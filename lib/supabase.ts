import { createClient } from '@supabase/supabase-js';

// Configuration pour Vite (import.meta.env) avec fallback
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (window as any).process?.env?.SUPABASE_URL || 'https://brhnjhfwrjnwvjqtdslt.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_KEY || (window as any).process?.env?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyaG5qaGZ3cmpud3ZqcXRkc2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Njk3MjcsImV4cCI6MjA4MjA0NTcyN30._LjzJHRdy6fgiNiG916nKWfcrSRLcr20tM7rZQwZw44';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper pour s'abonner en temps réel à une table
 */
export const subscribeToTable = (tableName: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`${tableName}-changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      (payload) => callback(payload)
    )
    .subscribe();
};