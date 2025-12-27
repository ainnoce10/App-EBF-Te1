/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION SUPABASE ---
// Remplacez les valeurs ci-dessous par celles de votre projet Supabase
// (Disponibles dans Project Settings > API)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://votre-projet.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'votre-cle-publique-anon';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper pour vérifier si la connexion est configurée
export const isSupabaseConfigured = () => {
    return supabaseUrl !== 'https://votre-projet.supabase.co';
};