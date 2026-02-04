/**
 * TanStack Query Client Configuration
 * Ref: SPEC 7.3.2
 */

import { QueryClient } from '@tanstack/react-query';
import { APIError } from './api-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 30 * 60 * 1000, // 30 minutos (antigo cacheTime)
      retry: (failureCount, error) => {
        // Não retry em erros 4xx (client errors)
        if (error instanceof APIError && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry até 3x em outros erros
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Backoff exponencial: 1s, 2s, 4s
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
      refetchOnWindowFocus: false, // Desabilitar refetch automático ao focar janela
    },
    mutations: {
      retry: false, // Não retry em mutations por padrão
    },
  },
});
