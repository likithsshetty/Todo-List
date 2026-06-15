#!/bin/bash

echo "========================================="
echo "Starting todo-list Container Deployment..."
echo "========================================="

# Fallback repo URL
REPO=${REPO_URL:-https://github.com/likithsshetty/Todo-List.git}
TARGET_DIR="/app/todo-list"

# 1. Clone or pull the repository
if [ -d "$TARGET_DIR/.git" ]; then
    echo "Local repository directory exists. Fetching latest updates..."
    cd "$TARGET_DIR"
    git fetch --all
    git reset --hard origin/main
else
    echo "Cloning repository from $REPO to $TARGET_DIR..."
    git clone "$REPO" "$TARGET_DIR"
    cd "$TARGET_DIR"
fi

# 2. Write dynamic Environment variables for the backend
echo "Writing environment configurations..."
cat <<EOF > "$TARGET_DIR/backend/.env"
MONGO_URI=${MONGO_URI:-mongodb://mongo:27017/todo_app}
JWT_SECRET=${JWT_SECRET:-8f45a0bdf196d09df24f1c7d24ab9668}
FLASK_PORT=${FLASK_PORT:-5000}
FLASK_DEBUG=False
EOF

# 3. Setup and start Python Flask Backend
echo "Configuring Flask Backend..."
cd "$TARGET_DIR/backend"
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

echo "Launching Flask REST API..."
./venv/bin/python app.py > /var/log/backend.log 2>&1 &

# 4. Setup and start Next.js Frontend
echo "Configuring Next.js Frontend..."
cd "$TARGET_DIR/frontend"
npm install
npm run build

echo "========================================="
echo "Redeployment successful! Services online."
echo "Flask API: http://localhost:5000"
echo "Next.js Frontend: http://localhost:3000"
echo "========================================="

# Start Next.js in the foreground to keep container running
npm start
