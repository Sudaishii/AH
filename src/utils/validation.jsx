import { supabase } from '../services/supabase-client';

export const validateEmail = (email) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  return { isValid: true, error: null };
};

export const validatePassword = (password) => {
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
    return { isValid: false, error: 'Password must contain uppercase, lowercase, number and be at least 8 chars long' };
  }
  return { isValid: true, error: null };
};



export const existingEmail = async (email) => {

  const { data: emailData } = await supabase
    .from('users')
    .select('user_email')
    .eq('user_email', email)
    .maybeSingle();

     if (emailData) {
      return { isValid: false, error: 'Email already exists' };
     }

  return { 
    isValid: true, 
    error: null 
  };
}



