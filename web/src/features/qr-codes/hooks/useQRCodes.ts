import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, APIError } from '@/lib/api-client';
import type { PaginatedResponse, QRCodeGenerateRequest, QRCodeResponse } from '@/types/api';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof APIError) {
    const detail = (error.data as { detail?: string })?.detail;
    return detail || fallback;
  }
  return fallback;
}

export function useQRCodes(page = 1, pageSize = 20, status: 'active' | 'inactive' = 'active') {
  return useQuery({
    queryKey: ['qr-codes', { page, pageSize, status }],
    queryFn: () =>
      api.get<PaginatedResponse<QRCodeResponse>>('/api/v1/qr-codes', {
        page,
        page_size: pageSize,
        status,
      }),
  });
}

export function useGenerateQRCodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ start_visual_number, quantity }: QRCodeGenerateRequest) => {
      const created: QRCodeResponse[] = [];

      for (let i = 0; i < quantity; i += 1) {
        const visualNumber = start_visual_number + i;
        const item = await api.post<QRCodeResponse>('/api/v1/qr-codes', {
          visual_number: visualNumber,
        });
        created.push(item);
      }

      return created;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      toast.success(`${created.length} QR Codes gerados com sucesso.`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao gerar QR Codes.'));
    },
  });
}

export function useDeleteQRCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/qr-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      toast.success('QR Code desativado com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao desativar QR Code.'));
    },
  });
}
