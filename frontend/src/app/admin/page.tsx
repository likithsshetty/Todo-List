"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import styles from "./admin.module.css";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  todo_count: number;
}

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<AdminUser | null>(null);

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.is_admin) {
        router.push("/todos"); // Redirect standard users
      } else {
        fetchUsers();
      }
    }
  }, [user, loading, router]);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      setFetching(true);
      setError("");
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to load user list.");
      }
    } catch (err) {
      setError("Network error. Unable to connect to server.");
    } finally {
      setFetching(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser || !token) return;
    const targetUserId = confirmDeleteUser.id;
    
    try {
      setDeleteLoadingId(targetUserId);
      setError("");
      const res = await fetch(`${API_URL}/admin/users/${targetUserId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== targetUserId));
        setConfirmDeleteUser(null);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to delete user.");
      }
    } catch (err) {
      setError("Network error. Could not delete user.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Calculate statistics
  const totalUsers = users.length;
  const totalTodos = users.reduce((sum, u) => sum + (u.todo_count || 0), 0);

  if (loading || !user || !user.is_admin) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.spinner}></div>
        <div style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
          Checking admin security credentials...
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
            <h2>Admin Control Panel</h2>
            <p>Manage application users, view statistics, and perform database maintenance.</p>
          </div>

          {error && <div className={styles.errorAlert}>{error}</div>}

          {/* Stat Panels */}
          <div className={styles.statsRow}>
            <div className={`glass-container ${styles.statCard}`}>
              <span className={styles.statIcon}>👥</span>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{fetching ? "..." : totalUsers}</span>
                <span className={styles.statLabel}>Registered Users</span>
              </div>
            </div>
            
            <div className={`glass-container ${styles.statCard}`}>
              <span className={styles.statIcon}>📋</span>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{fetching ? "..." : totalTodos}</span>
                <span className={styles.statLabel}>Total Tasks Stored</span>
              </div>
            </div>
          </div>

          {/* User List Panel */}
          <div className={`glass-container ${styles.tableCard}`}>
            <div className={styles.cardHeader}>
              <h3>Users Directory</h3>
              <button className={styles.refreshBtn} onClick={fetchUsers} disabled={fetching}>
                🔄 Refresh
              </button>
            </div>

            {fetching ? (
              <div className={styles.listLoader}>
                <div className={styles.spinnerSmall}></div>
                <span>Fetching user list...</span>
              </div>
            ) : users.length === 0 ? (
              <div className={styles.emptyState}>No users registered.</div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email Address</th>
                      <th>Role</th>
                      <th>Joined On</th>
                      <th>Todos</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className={u.id === user.id ? styles.currentUserRow : ""}>
                        <td>
                          <div className={styles.usernameCell}>
                            <strong>@{u.username}</strong>
                            {u.id === user.id && <span className={styles.selfTag}>You</span>}
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={styles.roleTag} data-role={u.is_admin ? "admin" : "user"}>
                            {u.is_admin ? "ADMIN" : "USER"}
                          </span>
                        </td>
                        <td>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : "N/A"}
                        </td>
                        <td>
                          <span className={styles.todoBadge}>{u.todo_count}</span>
                        </td>
                        <td>
                          <button
                            className={styles.deleteUserBtn}
                            onClick={() => setConfirmDeleteUser(u)}
                            disabled={u.id === user.id || deleteLoadingId !== null}
                            title={u.id === user.id ? "Cannot delete your own account" : "Delete User"}
                          >
                            ❌ Delete User
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete User Confirmation Modal */}
      {confirmDeleteUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Delete User &quot;@{confirmDeleteUser.username}&quot;?</h3>
            <p>
              Are you absolutely sure you want to delete this user?
              <strong> This will permanently delete their account and all ({confirmDeleteUser.todo_count}) associated todos.</strong>
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setConfirmDeleteUser(null)}
                disabled={deleteLoadingId !== null}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={handleDeleteUser}
                disabled={deleteLoadingId !== null}
              >
                {deleteLoadingId === confirmDeleteUser.id ? "Deleting..." : "Yes, Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
