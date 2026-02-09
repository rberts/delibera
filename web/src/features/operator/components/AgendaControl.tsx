import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AgendaItem {
  id: number;
  title: string;
  description?: string;
  status: 'draft' | 'open' | 'closed';
  display_order: number;
}

interface AgendaControlProps {
  agendas: AgendaItem[];
  isLoading: boolean;
  isSubmitting: boolean;
  onOpenAgenda: (agendaId: number) => void;
  onCloseAgenda: (agendaId: number) => void;
}

function statusLabel(status: AgendaItem['status']) {
  if (status === 'open') return 'Aberta';
  if (status === 'closed') return 'Fechada';
  return 'Rascunho';
}

function statusClassName(status: AgendaItem['status']) {
  if (status === 'open') return 'bg-blue-100 text-blue-700';
  if (status === 'closed') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-700';
}

export function AgendaControl({
  agendas,
  isLoading,
  isSubmitting,
  onOpenAgenda,
  onCloseAgenda,
}: AgendaControlProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando pautas...</p>;
  }

  if (agendas.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma pauta cadastrada para esta assembleia.</p>;
  }

  return (
    <div className="space-y-3">
      {agendas.map((agenda) => (
        <Card key={agenda.id}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">
                {agenda.display_order}. {agenda.title}
              </CardTitle>
              <Badge className={statusClassName(agenda.status)}>{statusLabel(agenda.status)}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {agenda.description ? (
              <p className="text-sm text-muted-foreground">{agenda.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Sem descricao.</p>
            )}

            <div>
              {agenda.status !== 'open' ? (
                <Button
                  size="sm"
                  onClick={() => onOpenAgenda(agenda.id)}
                  disabled={isSubmitting || agenda.status === 'closed'}
                >
                  Abrir pauta
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onCloseAgenda(agenda.id)} disabled={isSubmitting}>
                  Fechar pauta
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
