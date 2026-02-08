/**
 * TanStack Query hooks for Condominiums CRUD.
 * Ref: SPEC 7.5.1
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, APIError } from '@/lib/api-client';
import type {
  CondominiumCreate,
  CondominiumResponse,
  CondominiumUpdate,
  PaginatedResponse,
} from '@/types/api';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof APIError) {
    const detail = (error.data as { detail?: string })?.detail;
    return detail || fallback;
  }
  return fallback;
}

export function useCondominiums(
  page = 1,
  pageSize = 20,
  status: 'active' | 'inactive' = 'active'
) {
  return useQuery({
    queryKey: ['condominiums', { page, pageSize, status }],
    queryFn: () =>
      api.get<PaginatedResponse<CondominiumResponse>>('/api/v1/condominiums', {
        page,
        page_size: pageSize,
        status,
      }),
  });
}

export function useCondominium(id: number) {
  return useQuery({
    queryKey: ['condominiums', id],
    queryFn: () => api.get<CondominiumResponse>(`/api/v1/condominiums/${id}`),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateCondominium() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CondominiumCreate) =>
      api.post<CondominiumResponse>('/api/v1/condominiums', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['condominiums'] });
      toast.success('Condomínio criado com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao criar condomínio.'));
    },
  });
}

export function useUpdateCondominium(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CondominiumUpdate) =>
      api.put<CondominiumResponse>(`/api/v1/condominiums/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['condominiums'] });
      queryClient.invalidateQueries({ queryKey: ['condominiums', id] });
      toast.success('Condomínio atualizado com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao atualizar condomínio.'));
    },
  });
}

export function useDeleteCondominium() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/condominiums/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['condominiums'] });
      toast.success('Condomínio removido com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao remover condomínio.'));
    },
  });
}
