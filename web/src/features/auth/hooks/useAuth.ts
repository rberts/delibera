/**
 * Auth Hook - Login, Logout, Me
 * Ref: SPEC 7.4.2
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api, APIError } from '@/lib/api-client';
import { useAuthStore } from '../stores/auth-store';
import type { LoginRequest, UserResponse } from '@/types/api';

// ============= Login =============
export function useLogin() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      // Backend usa JSON com campos email e password
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Login failed' }));
        throw new APIError(response.status, response.statusText, error);
      }

      return response.json();
    },
    onSuccess: async () => {
      // Buscar dados do usuário após login
      const user = await api.get<UserResponse>('/api/v1/auth/me');
      setUser(user);
      queryClient.setQueryData(['auth', 'me'], user);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      if (error instanceof APIError) {
        const detail = (error.data as { detail?: string })?.detail || 'Credenciais inválidas';
        toast.error(detail);
      } else {
        toast.error('Erro ao fazer login. Tente novamente.');
      }
    },
  });
}

// ============= Logout =============
export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/api/v1/auth/logout');
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear(); // Limpar todo cache
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    },
    onError: () => {
      // Mesmo com erro, limpar estado local
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
  });
}

// ============= Me (Current User) =============
export function useMe() {
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const user = await api.get<UserResponse>('/api/v1/auth/me');
        setUser(user);
        return user;
      } catch (error) {
        // Se 401, usuário não autenticado
        if (error instanceof APIError && error.status === 401) {
          clearAuth();
          throw error;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity, // Não refetch automático
  });
}

// ============= Hook consolidado =============
export function useAuth() {
  const { user, isAuthenticated } = useAuthStore();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const meQuery = useMe();

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isLoadingUser: meQuery.isLoading,
  };
}
