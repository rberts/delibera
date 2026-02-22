import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export interface AssemblyUnit {
  id: number;
  assembly_id: number;
  unit_number: string;
  owner_name: string;
  ideal_fraction: number;
  cpf_cnpj: string;
  created_at: string;
}

export interface AssemblyUnitsResponse {
  items: AssemblyUnit[];
  total: number;
  fraction_sum: number;
}

export function useAssemblyUnits(assemblyId: number) {
  return useQuery({
    queryKey: ['assemblies', assemblyId, 'units'],
    queryFn: () => api.get<AssemblyUnitsResponse>(`/api/v1/assemblies/${assemblyId}/units`),
    enabled: Number.isFinite(assemblyId) && assemblyId > 0,
  });
}
