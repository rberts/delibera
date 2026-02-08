/**
 * TanStack Query hooks for Assemblies CRUD + workflow.
 * Ref: SPEC 7.6.1
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, APIError } from '@/lib/api-client';
import type {
  AssemblyCreate,
  AssemblyResponse,
  AssemblyUpdate,
  PaginatedResponse,
} from '@/types/api';

type AssembliesApiStatusFilter = 'active' | 'cancelled';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof APIError) {
    const detail = (error.data as { detail?: string })?.detail;
    return detail || fallback;
  }
  return fallback;
}

export function useAssemblies(page = 1, pageSize = 20, status: AssembliesApiStatusFilter = 'active') {
  return useQuery({
    queryKey: ['assemblies', { page, pageSize, status }],
    queryFn: () =>
      api.get<PaginatedResponse<AssemblyResponse>>('/api/v1/assemblies', {
        page,
        page_size: pageSize,
        status,
      }),
  });
}

export function useAssembly(id: number) {
  return useQuery({
    queryKey: ['assemblies', id],
    queryFn: () => api.get<AssemblyResponse>(`/api/v1/assemblies/${id}`),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateAssembly() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssemblyCreate) =>
      api.post<AssemblyResponse>('/api/v1/assemblies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
      toast.success('Assembleia criada com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao criar assembleia.'));
    },
  });
}

export function useUpdateAssembly(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssemblyUpdate) =>
      api.put<AssemblyResponse>(`/api/v1/assemblies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
      queryClient.invalidateQueries({ queryKey: ['assemblies', id] });
      toast.success('Assembleia atualizada com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao atualizar assembleia.'));
    },
  });
}

export function useDeleteAssembly() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/assemblies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
      toast.success('Assembleia cancelada com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao cancelar assembleia.'));
    },
  });
}

export function useStartAssembly() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api.put<AssemblyResponse>(`/api/v1/assemblies/${id}`, { status: 'in_progress' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
      queryClient.invalidateQueries({ queryKey: ['assemblies', id] });
      toast.success('Assembleia iniciada.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao iniciar assembleia.'));
    },
  });
}

export function useFinishAssembly() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api.put<AssemblyResponse>(`/api/v1/assemblies/${id}`, { status: 'finished' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['assemblies'] });
      queryClient.invalidateQueries({ queryKey: ['assemblies', id] });
      toast.success('Assembleia finalizada.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao finalizar assembleia.'));
    },
  });
}
