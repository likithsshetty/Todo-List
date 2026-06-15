"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./navbar.module.css";
import { usePathname } from "next/navigation";

export const Navbar: React.FC = () => {
  const { user, logout, deleteAccount } = useAuth();
  const pathname = usePathname();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (!user) return null;

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError("");
    const result = await deleteAccount();
    if (!result.success) {
      setDeleteError(result.error || "Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <span className={styles.icon}>⚡</span>
        <span className={styles.title}>CloudTodo</span>
      </div>
      
      <div className={styles.navLinks}>
        {user.role === "admin" && (
          <>
            {pathname === "/admin" ? (
              <Link href="/todos" className={styles.link}>
                📋 My Todos
              </Link>
            ) : (
              <Link href="/admin" className={styles.linkAdmin}>
                🛡️ Admin Panel
              </Link>
            )}
          </>
        )}
      </div>

      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <span className={styles.roleTag} data-role={user.role}>
            {user.role.toUpperCase()}
          </span>
          <span className={styles.username}>@{user.username}</span>
        </div>

        <button className={styles.logoutBtn} onClick={logout}>
          Sign Out
        </button>
        
        <button 
          className={styles.deleteBtn} 
          onClick={() => setShowConfirmDelete(true)}
        >
          Delete Account
        </button>
      </div>

      {showConfirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Delete Your Account?</h3>
            <p>
              Are you absolutely sure? This action is irreversible. All of your tasks 
              will be permanently removed from our cloud storage.
            </p>
            {deleteError && <div className={styles.errorText}>{deleteError}</div>}
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => {
                  setShowConfirmDelete(false);
                  setDeleteError("");
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmDeleteBtn} 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
