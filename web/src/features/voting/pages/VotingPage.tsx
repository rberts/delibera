import { useParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VoteCard } from '../components/VoteCard';
import { useVoting } from '../hooks/useVoting';

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function VotingPage() {
  const { token } = useParams<{ token: string }>();

  const {
    assembly,
    agenda,
    units,
    hasVoted,
    isLoading,
    error,
    submitVote,
    isSubmitting,
  } = useVoting(token || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-md space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (error || !assembly) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Nao foi possivel acessar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              QR Code invalido ou votacao indisponivel no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assembly.status === 'finished' || assembly.status === 'cancelled') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Assembleia encerrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Esta assembleia foi encerrada. Obrigado pela participacao.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Voto registrado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">Seu voto foi registrado com sucesso.</p>
            <p className="text-sm text-muted-foreground">Aguarde a proxima pauta.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agenda) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Aguardando votacao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{assembly.title}</p>
              <p className="text-sm text-muted-foreground">{formatDate(assembly.assembly_date)}</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Unidades vinculadas:</p>
              <div className="flex flex-wrap gap-2">
                {units.map((unit) => (
                  <Badge key={unit.id} variant="outline">{unit.unit_number}</Badge>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Aguarde a abertura da proxima pauta.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{assembly.title}</p>
              <CardTitle>{agenda.title}</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {agenda.description && <p className="text-muted-foreground">{agenda.description}</p>}

            <div>
              <p className="mb-2 text-sm font-medium">Votando pelas unidades:</p>
              <div className="flex flex-wrap gap-2">
                {units.map((unit) => (
                  <Badge key={unit.id} variant="secondary">
                    {unit.unit_number} - {unit.owner_name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <VoteCard agenda={agenda} onVote={submitVote} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
