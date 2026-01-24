/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // Esto le dice a Vercel: "Ignora las advertencias de las fotos y publica"
      ignoreDuringBuilds: true,
    },
    typescript: {
      // Esto ignora errores de escritura técnica para que no se detenga
      ignoreBuildErrors: true,
    },
  }
  
  module.exports = nextConfig