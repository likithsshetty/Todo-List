import os
import logging
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db")

class InMemoryCollection:
    def __init__(self, name):
        self.name = name
        self.data = {}  # key: str(id) -> val: dict

    def find_one(self, query):
        for doc in self.data.values():
            if self._matches(doc, query):
                return dict(doc)
        return None

    def find(self, query=None):
        if query is None:
            query = {}
        results = []
        for doc in self.data.values():
            if self._matches(doc, query):
                results.append(dict(doc))
        
        # Mimic MongoDB cursor's sort method
        class MockCursor:
            def __init__(self, items):
                self.items = items
            def sort(self, key, direction=-1):
                reverse = direction == -1
                # Try sorting by the given key
                self.items.sort(key=lambda x: x.get(key) if x.get(key) is not None else "", reverse=reverse)
                return self
            def __iter__(self):
                return iter(self.items)
        return MockCursor(results)

    def insert_one(self, doc):
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        doc_id = str(doc["_id"])
        self.data[doc_id] = dict(doc)
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    def update_one(self, query, update):
        doc = self.find_one(query)
        if doc:
            doc_id = str(doc["_id"])
            if "$set" in update:
                for k, v in update["$set"].items():
                    self.data[doc_id][k] = v
            return True
        return False

    def delete_one(self, query):
        doc = self.find_one(query)
        if doc:
            del self.data[str(doc["_id"])]
            return type('DeleteResult', (), {'deleted_count': 1})()
        return type('DeleteResult', (), {'deleted_count': 0})()

    def delete_many(self, query):
        to_delete = []
        for doc in self.data.values():
            if self._matches(doc, query):
                to_delete.append(str(doc["_id"]))
        for doc_id in to_delete:
            del self.data[doc_id]
        return type('DeleteResult', (), {'deleted_count': len(to_delete)})()

    def count_documents(self, query):
        count = 0
        for doc in self.data.values():
            if self._matches(doc, query):
                count += 1
        return count

    def _matches(self, doc, query):
        for k, v in query.items():
            if k == "_id" or k == "user_id":
                # Convert both values to string for proper comparison of ObjectIds
                if str(doc.get(k)) != str(v):
                    return False
            else:
                if doc.get(k) != v:
                    return False
        return True

# Initialize variables
use_in_memory = False
users_collection = None
todos_collection = None
db = None

mongo_uri = os.getenv("MONGO_URI")

if mongo_uri:
    try:
        logger.info("Attempting to connect to MongoDB Atlas...")
        # Timeout quickly (2 seconds) so it doesn't block server startup
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # Perform ping to verify credentials immediately
        client.admin.command('ping')
        db = client["todo_app"]
        users_collection = db["users"]
        todos_collection = db["todos"]
        logger.info("SUCCESS: Connected to MongoDB Atlas cluster!")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        use_in_memory = True

if not mongo_uri or use_in_memory:
    logger.warning("------------------------------------------------------------------------")
    logger.warning("CRITICAL: FALLING BACK TO IN-MEMORY DATABASE (DEMO MODE)")
    logger.warning("Registration, Login, Todos, and Admin panels will work, but data will reset")
    logger.warning("whenever the Flask server restarts.")
    logger.warning("------------------------------------------------------------------------")
    
    class InMemoryDB:
        def __getitem__(self, name):
            if name == "users":
                return users_collection
            if name == "todos":
                return todos_collection
            return None
    db = InMemoryDB()
    users_collection = InMemoryCollection("users")
    todos_collection = InMemoryCollection("todos")

def get_db():
    return db
