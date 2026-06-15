import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load configuration
load_dotenv()

app = Flask(__name__)

# Configure CORS - allow authorization header
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Import and register blueprints
from routes.auth import auth_bp
from routes.todos import todos_bp
from routes.admin import admin_bp

app.register_blueprint(auth_bp, url_prefix="/api/auth")
# We specify prefix for todos as /api/todos. Note that the blueprint route is "" or "/<id>",
# so it matches "/api/todos" and "/api/todos/<id>"
app.register_blueprint(todos_bp, url_prefix="/api/todos")
app.register_blueprint(admin_bp, url_prefix="/api/admin")

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "Flask API with MongoDB"}), 200

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
