import { createClient } from '@supabase/supabase-js';

// =================================================================
// CONFIGURACIÓN DE SUPABASE
// =================================================================

// URL de tu proyecto
const supabaseUrl = "https://ymnebogpsqnzftpnxtem.supabase.co";

// Clave pública (Anon public)
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbmVib2dwc3FuemZ0cG54dGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTkwMzcsImV4cCI6MjA4NTUzNTAzN30.weaBvvWNRA-JGyVCi0H_NVNojWxcy4U-EP98421QBGE";

// Verificación de seguridad básica
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("🚨 Error: Faltan las claves de Supabase en lib/supabase.ts");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);