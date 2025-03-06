import { createClient } from '@supabase/supabase-js';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error('VITE_SUPABASE_URL não está definido');
  throw new Error('VITE_SUPABASE_URL não está definido');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_ANON_KEY não está definido');
  throw new Error('VITE_SUPABASE_ANON_KEY não está definido');
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'pesquisa-app',
      },
    },
  }
);

console.log('Cliente Supabase inicializado com URL:', import.meta.env.VITE_SUPABASE_URL);

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Erro ao fazer login:', error);
      return { data: null, error };
    }
    
    console.log('Login bem sucedido para:', email);
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado ao fazer login:', err);
    return { data: null, error: err };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
      return { error };
    }
    console.log('Logout bem sucedido');
    return { error: null };
  } catch (err) {
    console.error('Erro inesperado ao fazer logout:', err);
    return { error: err };
  }
}

export async function resetPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      console.error('Erro ao resetar senha:', error);
      return { data: null, error };
    }
    
    console.log('Email de reset de senha enviado para:', email);
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado ao resetar senha:', err);
    return { data: null, error: err };
  }
}

export async function updatePassword(password: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) {
      console.error('Erro ao atualizar senha:', error);
      return { data: null, error };
    }
    
    console.log('Senha atualizada com sucesso');
    return { data, error: null };
  } catch (err) {
    console.error('Erro inesperado ao atualizar senha:', err);
    return { data: null, error: err };
  }
}