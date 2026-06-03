// src/services/supabaseAuth.js

const supabaseUrl = 'https://zlmjvbtmzkphkdfspcht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsbWp2YnRtemtwaGtkZnNwY2h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NDA4NDUsImV4cCI6MjA5MjMxNjg0NX0.j6aRmC3tTrFiZj62WrEmSKkuICoBHagFzKS3b8_adeM';

export const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
