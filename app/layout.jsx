import "./globals.css";

export const metadata = {
  title: "Gestion de consorcios",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
