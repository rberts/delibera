import { FileDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AgendaResponse } from '@/types/api';
import {
  useDownloadAgendaResultsPDF,
  useDownloadAttendancePDF,
  useDownloadFinalReportPDF,
} from '../hooks/useReports';

interface ReportDownloadProps {
  assemblyId: number;
  agendas: AgendaResponse[];
}

export function ReportDownload({ assemblyId, agendas }: ReportDownloadProps) {
  const openAgendaId = useMemo(
    () => agendas.find((agenda) => agenda.status === 'open')?.id ?? null,
    [agendas]
  );
  const [selectedAgendaId, setSelectedAgendaId] = useState<number | null>(openAgendaId);

  useEffect(() => {
    if (selectedAgendaId && agendas.some((agenda) => agenda.id === selectedAgendaId)) {
      return;
    }
    setSelectedAgendaId(openAgendaId ?? agendas[0]?.id ?? null);
  }, [agendas, openAgendaId, selectedAgendaId]);

  const attendanceDownload = useDownloadAttendancePDF(assemblyId);
  const agendaResultsDownload = useDownloadAgendaResultsPDF(selectedAgendaId);
  const finalDownload = useDownloadFinalReportPDF(assemblyId);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Baixe os PDFs da assembleia e das pautas em andamento.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => attendanceDownload.mutate()}
          disabled={attendanceDownload.isPending}
        >
          <FileDown className="mr-2 h-4 w-4" />
          {attendanceDownload.isPending ? 'Baixando...' : 'Baixar Lista de Presenca'}
        </Button>

        <Button
          variant="outline"
          onClick={() => agendaResultsDownload.mutate()}
          disabled={agendaResultsDownload.isPending || !selectedAgendaId}
          title={!selectedAgendaId ? 'Nenhuma pauta disponivel' : undefined}
        >
          <FileDown className="mr-2 h-4 w-4" />
          {agendaResultsDownload.isPending
            ? 'Baixando...'
            : 'Baixar Resultado da Pauta'}
        </Button>

        <Button
          onClick={() => finalDownload.mutate()}
          disabled={finalDownload.isPending}
        >
          <FileDown className="mr-2 h-4 w-4" />
          {finalDownload.isPending ? 'Baixando...' : 'Baixar Relatorio Final'}
        </Button>
      </div>

      {agendas.length > 0 && (
        <div className="space-y-1">
          <label htmlFor="report-agenda" className="text-xs text-muted-foreground">
            Pauta para o PDF de resultado
          </label>
          <select
            id="report-agenda"
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={selectedAgendaId ?? ''}
            onChange={(event) => setSelectedAgendaId(Number(event.target.value))}
          >
            {agendas.map((agenda) => (
              <option key={agenda.id} value={agenda.id}>
                {agenda.display_order}. {agenda.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {!selectedAgendaId && (
        <p className="text-xs text-muted-foreground">
          Crie ao menos uma pauta para habilitar o PDF de resultados.
        </p>
      )}
    </div>
  );
}
