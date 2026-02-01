import './globals.css'

export const metadata = {
  title: 'Eurocopa Fantástica',
  description: 'Juego de manager de fútbol',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-[#05080f] text-white">
        {children}
      </body>
    </html>
  )
}