import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Supabase Key:', supabaseAnonKey ? 'Found' : 'Missing')

let supabase = null;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('Supabase client initialized successfully')
  } else {
    console.warn('Supabase credentials missing:', { 
      hasUrl: Boolean(supabaseUrl), 
      hasKey: Boolean(supabaseAnonKey) 
    })
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error)
}

export { supabase }
