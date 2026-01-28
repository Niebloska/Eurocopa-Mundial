import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EF 2024 - EuroFantasy",
  description: "Crea tu equipo ideal para la Euro 2024 y participa en la quiniela",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Esto ayuda a que el icono se vea mejor en móviles */}
        <meta name="theme-color" content="#10b981" />
      </head>
      <body>{children}</body>
    </html>
  );
}