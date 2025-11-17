import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://kudnxmjoslotzytfjrwc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZG54bWpvc2xvdHp5dGZqcndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzk4NzMsImV4cCI6MjA3NDg1NTg3M30.T9Uboe6JUCMTDj3GqGxBlTvH3VlDBEorldkW4oO_gGU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
