"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await apiRequest("/users/login", {
        method: "POST",
        body: JSON.stringify({ user, password }),
      });
      window.localStorage.setItem("userId", data.id);
      router.push("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={styles.main}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <svg
          style={styles.avatar}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="50" fill="#3a3a3a" />
          <circle cx="50" cy="38" r="16" fill="#e8e8e8" />
          <ellipse cx="50" cy="80" rx="26" ry="20" fill="#e8e8e8" />
        </svg>

        <h1 style={styles.title}>Iniciar sesion</h1>

        {error && <p style={styles.error}>{error}</p>}

        <label style={styles.label}>
          Usuario
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            required
            style={styles.input}
            placeholder="Tu nombre de usuario"
          />
        </label>

        <label style={styles.label}>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="••••••••"
          />
        </label>

        <button type="submit" disabled={isSubmitting} style={styles.button}>
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>

        <Link href="/" style={styles.link}>
          Volver
        </Link>
      </form>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8e8e8",
    fontFamily: "Arial, sans-serif",
    padding: "24px",
  },
  form: {
    width: "100%",
    maxWidth: "460px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  avatar: {
    width: "100px",
    height: "100px",
    marginBottom: "8px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "800",
    color: "#3a3a3a",
    alignSelf: "flex-start",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "100%",
    color: "#3a3a3a",
    fontWeight: "600",
    fontSize: "15px",
  },
  input: {
    border: "1px solid #b0b0b0",
    borderRadius: "8px",
    padding: "12px 14px",
    fontSize: "15px",
    backgroundColor: "#f2f2f2",
    color: "#2d2d2d",
    outline: "none",
  },
  button: {
    width: "100%",
    marginTop: "4px",
    backgroundColor: "#2d2d2d",
    color: "#fff",
    fontWeight: "700",
    fontSize: "20px",
    padding: "18px",
    borderRadius: "8px",
    border: "2px solid #6ab04c",
    cursor: "pointer",
  },
  link: {
    color: "#3a3a3a",
    fontSize: "14px",
    textDecoration: "underline",
  },
  error: {
    margin: 0,
    color: "#b00020",
    alignSelf: "flex-start",
    fontSize: "14px",
  },
};
