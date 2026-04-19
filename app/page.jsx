import Link from "next/link";

export default function Home() {
  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Bienvenido</h1>
      <p style={styles.subtitle}>Portal del Administrador</p>

      <svg
        style={styles.avatar}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="50" fill="#3a3a3a" />
        <circle cx="50" cy="38" r="16" fill="#e8e8e8" />
        <ellipse cx="50" cy="80" rx="26" ry="20" fill="#e8e8e8" />
      </svg>

      <div style={styles.actions}>
        <Link href="/login" style={styles.button}>
          Ingresar
        </Link>
        <Link href="/register" style={styles.secondaryButton}>
          Crear cuenta
        </Link>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    backgroundColor: "#e8e8e8",
    fontFamily: "Arial, sans-serif",
    padding: "24px",
  },
  title: {
    margin: 0,
    fontSize: "64px",
    fontWeight: "800",
    color: "#3a3a3a",
    textAlign: "center",
  },
  subtitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    color: "#3a3a3a",
    textAlign: "center",
  },
  avatar: {
    width: "180px",
    height: "180px",
    margin: "16px 0",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "460px",
    marginTop: "8px",
  },
  button: {
    display: "block",
    textAlign: "center",
    backgroundColor: "#2d2d2d",
    color: "#fff",
    fontWeight: "700",
    fontSize: "22px",
    padding: "20px",
    borderRadius: "8px",
    border: "2px solid #6ab04c",
    textDecoration: "none",
  },
  secondaryButton: {
    display: "block",
    textAlign: "center",
    backgroundColor: "transparent",
    color: "#3a3a3a",
    fontWeight: "600",
    fontSize: "16px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #3a3a3a",
    textDecoration: "none",
  },
};
