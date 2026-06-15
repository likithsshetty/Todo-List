"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import styles from "./todos.module.css";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  user_id: string;
}

export default function TodosPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState("");
  
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fetching, setFetching] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user && token) {
      fetchTodos();
    }
  }, [user, token, loading, router]);

  const fetchTodos = async () => {
    try {
      setFetching(true);
      setError("");
      const res = await fetch(`${API_URL}/todos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      } else {
        setError("Failed to load todos from the cloud database.");
      }
    } catch (err) {
      setError("Network error. Unable to load todos.");
    } finally {
      setFetching(false);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || !token) return;

    try {
      setAddLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTodoTitle }),
      });
      if (res.ok) {
        const newTodo = await res.json();
        setTodos((prev) => [newTodo, ...prev]);
        setNewTodoTitle("");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to add todo.");
      }
    } catch (err) {
      setError("Network error. Could not add task.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    if (!token) return;
    try {
      setActionLoadingId(todo.id);
      const res = await fetch(`${API_URL}/todos/${todo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
      } else {
        setError("Failed to update status.");
      }
    } catch (err) {
      setError("Network error. Could not toggle status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingTodoTitle(todo.title);
  };

  const handleSaveEdit = async (todoId: string) => {
    if (!editingTodoTitle.trim() || !token) return;
    try {
      setActionLoadingId(todoId);
      const res = await fetch(`${API_URL}/todos/${todoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editingTodoTitle }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTodos((prev) => prev.map((t) => (t.id === todoId ? updated : t)));
        setEditingTodoId(null);
      } else {
        setError("Failed to update text.");
      }
    } catch (err) {
      setError("Network error. Could not save changes.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!token) return;
    try {
      setActionLoadingId(todoId);
      const res = await fetch(`${API_URL}/todos/${todoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setTodos((prev) => prev.filter((t) => t.id !== todoId));
      } else {
        setError("Failed to delete task.");
      }
    } catch (err) {
      setError("Network error. Could not delete task.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter & Search computation
  const filteredTodos = todos.filter((todo) => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "active") return matchesSearch && !todo.completed;
    if (filter === "completed") return matchesSearch && todo.completed;
    return matchesSearch;
  });

  const activeCount = todos.filter((t) => !t.completed).length;

  if (loading || !user) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.spinner}></div>
        <div style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
          Authenticating secure connection...
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.welcomeSection}>
            <h2>Manage Your Tasks</h2>
            <p>Welcome back, <strong>{user.username}</strong>! Keep track of your daily notes and productivity.</p>
          </div>

          {error && <div className={styles.errorAlert}>{error}</div>}

          {/* Add Todo Form */}
          <form className={`glass-container ${styles.addForm}`} onSubmit={handleAddTodo}>
            <input
              type="text"
              className={`input-field ${styles.addInput}`}
              placeholder="What needs to be done?"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              disabled={addLoading}
              required
            />
            <button
              type="submit"
              className={`glow-btn ${styles.addButton}`}
              disabled={addLoading || !newTodoTitle.trim()}
            >
              {addLoading ? "Adding..." : "Add Task"}
            </button>
          </form>

          {/* List Toolbar (Filters + Search) */}
          <div className={`glass-container ${styles.toolbar}`}>
            <div className={styles.filters}>
              <button
                className={`${styles.filterBtn} ${filter === "all" ? styles.activeFilter : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`${styles.filterBtn} ${filter === "active" ? styles.activeFilter : ""}`}
                onClick={() => setFilter("active")}
              >
                Active
              </button>
              <button
                className={`${styles.filterBtn} ${filter === "completed" ? styles.activeFilter : ""}`}
                onClick={() => setFilter("completed")}
              >
                Completed
              </button>
            </div>

            <div className={styles.searchContainer}>
              <input
                type="text"
                className={`input-field ${styles.searchInput}`}
                placeholder="🔍 Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Todo List Card */}
          <div className={`glass-container ${styles.todoCard}`}>
            {fetching ? (
              <div className={styles.listLoader}>
                <div className={styles.spinnerSmall}></div>
                <span>Syncing with cloud database...</span>
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className={styles.emptyState}>
                {searchQuery ? "No matching tasks found." : "No tasks in this list. Add one above!"}
              </div>
            ) : (
              <ul className={styles.todoList}>
                {filteredTodos.map((todo) => {
                  const isEditing = editingTodoId === todo.id;
                  const isTodoLoading = actionLoadingId === todo.id;
                  
                  return (
                    <li 
                      key={todo.id} 
                      className={`${styles.todoItem} ${todo.completed ? styles.completedItem : ""} ${isEditing ? styles.editingItem : ""}`}
                    >
                      {/* Checkbox */}
                      <button
                        className={`${styles.checkbox} ${todo.completed ? styles.checked : ""}`}
                        onClick={() => handleToggleComplete(todo)}
                        disabled={isTodoLoading}
                        aria-label="Toggle Complete"
                      >
                        {todo.completed && "✓"}
                      </button>

                      {/* Content / Edit field */}
                      {isEditing ? (
                        <div className={styles.editWrapper}>
                          <input
                            type="text"
                            className={`input-field ${styles.editInput}`}
                            value={editingTodoTitle}
                            onChange={(e) => setEditingTodoTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(todo.id)}
                            autoFocus
                          />
                          <button 
                            className={styles.saveBtn} 
                            onClick={() => handleSaveEdit(todo.id)}
                          >
                            Save
                          </button>
                          <button 
                            className={styles.cancelBtn} 
                            onClick={() => setEditingTodoId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div 
                          className={styles.todoTitle}
                          onDoubleClick={() => handleStartEdit(todo)}
                        >
                          {todo.title}
                        </div>
                      )}

                      {/* Actions */}
                      {!isEditing && (
                        <div className={styles.actions}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleStartEdit(todo)}
                            disabled={isTodoLoading}
                            title="Double-click task or click to edit"
                          >
                            ✏️
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.deleteAction}`}
                            onClick={() => handleDeleteTodo(todo.id)}
                            disabled={isTodoLoading}
                            title="Delete Task"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Footer Statistics */}
            <div className={styles.footer}>
              <span>{activeCount} active tasks left</span>
              <span>Total tasks: {todos.length}</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
