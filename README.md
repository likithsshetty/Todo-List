# todo-list

A premium, glassmorphic, responsive Todo Application with a **Flask (Python) REST API** backend, a **Next.js (React / TypeScript)** frontend, and **MongoDB** database storage.

## Key Features
* 🔒 **Secure User Authentication**: Sign Up, Sign In, and Sign Out using JWT (Json Web Tokens) and BCrypt password hashing.
* 🗑️ **Account Deletion**: Users can delete their own accounts, executing a cascading deletion of their database profiles and todos.
* 🛡️ **Admin Dashboard**: Secure panel accessible only to administrators, showing global stats (total users, total tasks) and a directory to delete any user account.
* ⚡ **Interactive Todo List**: CRUD (Create, Read, Update, Delete) actions, inline double-click editing, checkbox toggles, search queries, and active task counters.
* 🎨 **Premium Glassmorphism**: Frosty transparent containers, border glows, custom scrollbars, and keyframe slide-up page transitions.
* 💾 **In-Memory Fallback**: The Flask server automatically falls back to an in-memory database if MongoDB connection fails, allowing instant sandbox usage.

---

## 🐳 Docker Deployment (Automatic Deployment)

You can launch the entire stack—including a local MongoDB database and the web application—using a single Docker command. 

When you run this command, the container will automatically clone the repository from GitHub, configure environment variables, install all dependencies, build the static assets, and deploy the application.

### Prerequisites
1. Ensure **Docker Desktop** is installed and running on your system.

### Deployment Command
Run the following command in the project root folder:
```bash
docker-compose up --build
```

### Services Online
Once the container starts, the following services will be available:
* **Next.js Frontend**: [http://localhost:3000](http://localhost:3000)
* **Flask REST API**: [http://localhost:5000](http://localhost:5000)
* **MongoDB Instance**: Port `27017` (bound locally to your machine)

---

## 🚀 Local Development (Without Docker)

### 1. Flask Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env`:
   Create a `.env` file inside `backend/` containing:
   ```env
   MONGO_URI=mongodb://localhost:27017/todo_app
   JWT_SECRET=super_secret_jwt_key
   FLASK_PORT=5000
   FLASK_DEBUG=True
   ```
5. Run the server:
   ```bash
   python app.py
   ```

### 2. Next.js Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the web app at [http://localhost:3000](http://localhost:3000).

---

## 🌐 Static Web Hosting (GitHub Pages / GitHub Static Web)

The Next.js frontend is configured to build into a static HTML export. This makes it perfect for hosting on **GitHub Pages**, Cloudflare Pages, or Netlify.

### 1. Build Static Assets
Navigate to the `frontend/` directory and run:
```bash
npm run build
```
Next.js will compile all TypeScript files, optimize assets, and output static HTML, CSS, and JS files inside the **`frontend/out/`** directory.

### 2. Deploy to GitHub Pages
1. Push the contents of the `frontend/out/` folder to the `gh-pages` branch of your GitHub repository.
2. Under your GitHub Repository Settings -> **Pages**, set the build source to deploy from the `gh-pages` branch.
3. Your static frontend is now live!

> [!NOTE]
> If you deploy the frontend to a public URL on GitHub Pages, make sure to update the `API_URL` variable inside [frontend/src/context/AuthContext.tsx](file:///c:/Users/Likith/Projects/CloudDrive/frontend/src/context/AuthContext.tsx) and [frontend/src/app/todos/page.tsx](file:///c:/Users/Likith/Projects/CloudDrive/frontend/src/app/todos/page.tsx) to point to your publicly hosted Flask REST API instead of `localhost:5000`.
