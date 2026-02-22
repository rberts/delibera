import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { APIError } from '@/lib/api-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof APIError) {
    const detail = (error.data as { detail?: string })?.detail;
    return detail || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function getFilenameFromContentDisposition(
  header: string | null,
  fallback: string
) {
  if (!header) return fallback;
  const match = header.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

async function downloadPdf(endpoint: string, fallbackFilename: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = { detail: await response.text() };
    }
    throw new APIError(response.status, response.statusText, data);
  }

  const blob = await response.blob();
  const filename = getFilenameFromContentDisposition(
    response.headers.get('content-disposition'),
    fallbackFilename
  );

  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);
}

export function useDownloadAttendancePDF(assemblyId: number) {
  return useMutation({
    mutationFn: () =>
      downloadPdf(
        `/api/v1/reports/assemblies/${assemblyId}/attendance`,
        `lista-presenca-${assemblyId}.pdf`
      ),
    onSuccess: () => {
      toast.success('Lista de presenca baixada com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao baixar lista de presenca.'));
    },
  });
}

export function useDownloadAgendaResultsPDF(agendaId: number | null) {
  return useMutation({
    mutationFn: async () => {
      if (!agendaId) {
        throw new Error('Selecione uma pauta para baixar o resultado.');
      }
      return downloadPdf(
        `/api/v1/reports/agendas/${agendaId}/results`,
        `resultado-pauta-${agendaId}.pdf`
      );
    },
    onSuccess: () => {
      toast.success('Resultado da pauta baixado com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao baixar resultado da pauta.'));
    },
  });
}

export function useDownloadFinalReportPDF(assemblyId: number) {
  return useMutation({
    mutationFn: () =>
      downloadPdf(
        `/api/v1/reports/assemblies/${assemblyId}/final`,
        `relatorio-final-${assemblyId}.pdf`
      ),
    onSuccess: () => {
      toast.success('Relatorio final baixado com sucesso.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Falha ao baixar relatorio final.'));
    },
  });
}
