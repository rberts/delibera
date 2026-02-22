import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { APIError } from '@/lib/api-client';
import { useAssembly } from '@/features/assemblies/hooks/useAssemblies';
import { AttendanceList } from '../components/AttendanceList';
import { QRScanner } from '../components/QRScanner';
import { UnitSelector } from '../components/UnitSelector';
import {
  useAssignQRCode,
  useAttendanceList,
  useCheckinUnits,
  useQuorum,
  useUndoCheckin,
} from '../hooks/useCheckin';

function getQuorumColor(value: number) {
  if (value >= 50) return 'bg-green-600';
  if (value >= 30) return 'bg-yellow-500';
  return 'bg-red-600';
}

export default function CheckinPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const assemblyId = Number(id);

  const { data: assembly, isLoading: isLoadingAssembly, error: assemblyError } = useAssembly(assemblyId);
  const {
    data: attendanceData,
    isLoading: isLoadingAttendance,
    error: attendanceError,
  } = useAttendanceList(assemblyId);
  const { data: unitsData, isLoading: isLoadingUnits, error: unitsError } = useCheckinUnits(assemblyId);
  const { data: quorumData, isLoading: isLoadingQuorum, error: quorumError } = useQuorum(assemblyId);

  const assignMutation = useAssignQRCode(assemblyId);
  const undoMutation = useUndoCheckin();

  const [scannedToken, setScannedToken] = useState('');
  const [manualVisualNumber, setManualVisualNumber] = useState('');
  const [selectorKey, setSelectorKey] = useState(0);

  const quorumPercent = useMemo(() => {
    if (!quorumData) return 0;
    return Math.min(100, Math.max(0, quorumData.fraction_present));
  }, [quorumData]);

  useEffect(() => {
    if (!assemblyError) return;
    const detail =
      assemblyError instanceof APIError
        ? ((assemblyError.data as { detail?: string })?.detail ?? 'Falha ao carregar assembleia.')
        : 'Falha ao carregar assembleia.';
    toast.error(detail);
  }, [assemblyError]);

  useEffect(() => {
    if (!attendanceError) return;
    const detail =
      attendanceError instanceof APIError
        ? ((attendanceError.data as { detail?: string })?.detail ?? 'Falha ao carregar lista de presenca.')
        : 'Falha ao carregar lista de presenca.';
    toast.error(detail);
  }, [attendanceError]);

  useEffect(() => {
    if (!unitsError) return;
    const detail =
      unitsError instanceof APIError
        ? ((unitsError.data as { detail?: string })?.detail ?? 'Falha ao carregar unidades da assembleia.')
        : 'Falha ao carregar unidades da assembleia.';
    toast.error(detail);
  }, [unitsError]);

  useEffect(() => {
    if (!quorumError) return;
    const detail =
      quorumError instanceof APIError
        ? ((quorumError.data as { detail?: string })?.detail ?? 'Falha ao carregar quorum.')
        : 'Falha ao carregar quorum.';
    toast.error(detail);
  }, [quorumError]);

  const handleScan = (scannedToken: string) => {
    setScannedToken(scannedToken.trim());
    setManualVisualNumber('');
  };

  const handleAssign = ({ unitIds, isProxy }: { unitIds: number[]; isProxy: boolean }) => {
    const token = scannedToken.trim();
    const parsedVisualNumber = Number(manualVisualNumber.trim());
    const hasValidVisualNumber = Number.isInteger(parsedVisualNumber) && parsedVisualNumber > 0;

    if (!token && !hasValidVisualNumber) return;

    assignMutation.mutate(
      {
        qr_token: token || undefined,
        qr_visual_number: token ? undefined : parsedVisualNumber,
        unit_ids: unitIds,
        is_proxy: isProxy,
      },
      {
        onSuccess: () => {
          setScannedToken('');
          setManualVisualNumber('');
          setSelectorKey((current) => current + 1);
        },
      }
    );
  };

  const handleUndo = (assignmentId: number) => {
    undoMutation.mutate(assignmentId);
  };

  const manualVisualNumberValue = Number(manualVisualNumber.trim());
  const hasQrIdentifier =
    scannedToken.trim().length > 0
    || (Number.isInteger(manualVisualNumberValue) && manualVisualNumberValue > 0);

  if (isLoadingAssembly) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[320px]" />
        <Skeleton className="h-[220px] w-full" />
      </div>
    );
  }

  if (!assembly) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/assemblies')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para assembleias
        </Button>
        <p className="text-red-600">Assembleia nao encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate(`/assemblies/${assemblyId}`)} className="mb-3">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para detalhes
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Check-in da Assembleia</h1>
        <p className="text-muted-foreground mt-1">{assembly.title}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quorum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingQuorum ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <>
              <div className="h-3 w-full rounded-full bg-muted">
                <div
                  className={`h-3 rounded-full transition-all ${getQuorumColor(quorumPercent)}`}
                  style={{ width: `${quorumPercent}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {quorumData?.units_present ?? 0} de {quorumData?.total_units ?? 0} unidades presentes
                {' · '}
                {quorumPercent.toFixed(2)}%
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leitura do QR Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <QRScanner onScan={handleScan} />

          <div className="space-y-2">
            <Label htmlFor="qr-visual-number">Numero visual do QR (manual)</Label>
            <Input
              id="qr-visual-number"
              type="number"
              min={1}
              placeholder="Ex: 5"
              value={manualVisualNumber}
              onChange={(event) => {
                setManualVisualNumber(event.target.value);
                setScannedToken('');
              }}
            />
          </div>

          <UnitSelector
            key={selectorKey}
            units={unitsData?.items ?? []}
            isLoadingUnits={isLoadingUnits}
            onSubmit={handleAssign}
            isSubmitting={assignMutation.isPending}
            hasQrIdentifier={hasQrIdentifier}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Presenca</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAttendance ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <AttendanceList
              items={attendanceData?.items ?? []}
              onUndo={handleUndo}
              isUndoing={undoMutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
