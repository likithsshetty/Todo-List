"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    if (!loading && user) {
      router.push("/todos");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || "Invalid email or password");
      setSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className={styles.container}>
        <div style={{ color: "var(--text-secondary)" }}>Loading security session...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={`glass-container ${styles.card}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to your todo-list account</p>
        </div>

        {error && <div className={styles.errorAlert}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">
              Email Address
            </label>
            <input
              className="input-field"
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              className="input-field"
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <button
            className={`glow-btn ${styles.submitBtn}`}
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className={styles.switchText}>
          Don&apos;t have an account?
          <Link href="/register" className={styles.switchLink}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
