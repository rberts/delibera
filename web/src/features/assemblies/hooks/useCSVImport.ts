import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, APIError } from '@/lib/api-client';

export interface CSVPreviewError {
  line: number;
  field: string;
  message: string;
}

export interface CSVPreviewWarning {
  type: string;
  message: string;
}

export interface CSVPreviewRow {
  line: number;
  unit_number: string;
  owner_name: string;
  ideal_fraction: number | string;
  cpf_cnpj: string;
  error?: boolean;
}

export interface CSVPreviewResponse {
  preview: CSVPreviewRow[];
  total_rows: number;
  errors: CSVPreviewError[];
  warnings: CSVPreviewWarning[];
  can_import: boolean;
}

interface CSVImportResponse {
  message: string;
  total_imported: number;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof APIError) {
    const detail = (error.data as { detail?: string })?.detail;
    return detail || fallback;
  }
  return fallback;
}

export function useCSVPreview(assemblyId: number) {
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.postForm<CSVPreviewResponse>(`/api/v1/assemblies/${assemblyId}/units/preview`, formData),
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao gerar preview do CSV.'));
    },
  });
}

export function useCSVImport(assemblyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      api.postForm<CSVImportResponse>(`/api/v1/assemblies/${assemblyId}/units/import`, formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assemblies', assemblyId, 'units'] });
      queryClient.invalidateQueries({ queryKey: ['checkin'] });
      toast.success(`${data.total_imported} unidades importadas com sucesso.`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao importar unidades.'));
    },
  });
}
