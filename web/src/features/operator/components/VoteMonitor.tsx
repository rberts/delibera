import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AgendaResults } from '../hooks/useOperatorDashboard';

interface AgendaItem {
  id: number;
  title: string;
  status: 'draft' | 'open' | 'closed';
}

interface VoteMonitorProps {
  agendas: AgendaItem[];
  selectedAgendaId: number | null;
  onSelectAgenda: (agendaId: number) => void;
  results?: AgendaResults;
  isLoadingResults: boolean;
  onInvalidateVote: (voteId: number) => void;
  isInvalidating: boolean;
}

export function VoteMonitor({
  agendas,
  selectedAgendaId,
  onSelectAgenda,
  results,
  isLoadingResults,
  onInvalidateVote,
  isInvalidating,
}: VoteMonitorProps) {
  const [voteIdInput, setVoteIdInput] = useState('');

  const selectedAgendaValue = useMemo(
    () => (selectedAgendaId ? String(selectedAgendaId) : ''),
    [selectedAgendaId]
  );

  const pendingVotes = results ? Math.max(0, results.total_units_present - results.total_units_voted) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pauta monitorada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedAgendaValue} onValueChange={(value) => onSelectAgenda(Number(value))}>
            <SelectTrigger className="w-full md:w-[320px]">
              <SelectValue placeholder="Selecione uma pauta" />
            </SelectTrigger>
            <SelectContent>
              {agendas.map((agenda) => (
                <SelectItem key={agenda.id} value={String(agenda.id)}>
                  {agenda.title} ({agenda.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!selectedAgendaId ? (
            <p className="text-sm text-muted-foreground">Selecione uma pauta para ver os resultados.</p>
          ) : isLoadingResults ? (
            <p className="text-sm text-muted-foreground">Carregando resultados...</p>
          ) : !results ? (
            <p className="text-sm text-muted-foreground">Sem dados de resultado para a pauta selecionada.</p>
          ) : (
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <p>Total unidades presentes: {results.total_units_present}</p>
              <p>Total unidades votadas: {results.total_units_voted}</p>
              <p>Fracao presente: {results.total_fraction_present.toFixed(2)}%</p>
              <p>Fracao votada: {results.total_fraction_voted.toFixed(2)}%</p>
              <p className="font-medium">Votos pendentes: {pendingVotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados por opcao</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opcao</TableHead>
                <TableHead>Votos</TableHead>
                <TableHead>Fracao (%)</TableHead>
                <TableHead>Percentual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!results || results.results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum voto computado.
                  </TableCell>
                </TableRow>
              ) : (
                results.results.map((result) => (
                  <TableRow key={result.option_id}>
                    <TableCell>{result.option_text}</TableCell>
                    <TableCell>{result.votes_count}</TableCell>
                    <TableCell>{result.fraction_sum.toFixed(2)}%</TableCell>
                    <TableCell>{result.percentage.toFixed(2)}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invalidar voto por ID</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="vote-id">ID do voto</Label>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              id="vote-id"
              type="number"
              min={1}
              placeholder="Ex.: 123"
              value={voteIdInput}
              onChange={(event) => setVoteIdInput(event.target.value)}
              className="md:max-w-[240px]"
            />
            <Button
              type="button"
              variant="outline"
              disabled={isInvalidating || Number(voteIdInput) <= 0}
              onClick={() => onInvalidateVote(Number(voteIdInput))}
            >
              Invalidar voto
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use apenas quando necessario para auditoria. O backend registra `invalidated_at` e `invalidated_by`.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
