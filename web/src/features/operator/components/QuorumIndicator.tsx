import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuorumData {
  total_units: number;
  units_present: number;
  fraction_present: number;
  quorum_reached: boolean;
}

interface QuorumIndicatorProps {
  quorum?: QuorumData;
  isLoading?: boolean;
}

export function QuorumIndicator({ quorum, isLoading = false }: QuorumIndicatorProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quorum</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando quorum...</p>
        </CardContent>
      </Card>
    );
  }

  const unitsPresent = quorum?.units_present ?? 0;
  const totalUnits = quorum?.total_units ?? 0;
  const fractionPresent = quorum?.fraction_present ?? 0;
  const progress = Math.min(100, Math.max(0, fractionPresent));
  const quorumReached = quorum?.quorum_reached ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quorum</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {unitsPresent} de {totalUnits} unidades presentes
        </div>

        <div className="h-3 w-full rounded-full bg-muted">
          <div
            className={quorumReached ? 'h-3 rounded-full bg-green-600' : 'h-3 rounded-full bg-red-600'}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span>Fracao presente: {fractionPresent.toFixed(2)}%</span>
          <span className={quorumReached ? 'text-green-700' : 'text-red-700'}>
            {quorumReached ? 'Quorum atingido' : 'Abaixo do quorum'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
