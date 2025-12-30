import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION SUPABASE ---
// Remplacez les valeurs ci-dessous par celles de votre projet Supabase
// (Disponibles dans Project Settings > API)

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://brhnjhfwrjnwvjqtdslt.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyaG5qaGZ3cmpud3ZqcXRkc2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Njk3MjcsImV4cCI6MjA4MjA0NTcyN30._LjzJHRdy6fgiNiG916nKWfcrSRLcr20tM7rZQwZw44';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper pour vérifier si la connexion est configurée
export const isSupabaseConfigured = () => {
    return supabaseUrl !== 'https://brhnjhfwrjnwvjqtdslt.supabase.co';
};