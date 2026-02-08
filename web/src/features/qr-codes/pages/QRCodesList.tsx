import { useMemo, useState } from 'react';
import { Eye, Plus, Trash2, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GenerateQRDialog } from '../components/GenerateQRDialog';
import { useDeleteQRCode, useGenerateQRCodes, useQRCodes } from '../hooks/useQRCodes';
import type { QRCodeResponse } from '@/types/api';

function formatVisualNumber(value: number) {
  return String(value).padStart(3, '0');
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function getStatusBadge(status: 'active' | 'inactive') {
  if (status === 'active') {
    return <Badge variant="default">Ativo</Badge>;
  }
  return <Badge variant="outline">Inativo</Badge>;
}

export default function QRCodesList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [previewQRCode, setPreviewQRCode] = useState<QRCodeResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, error } = useQRCodes(page, 20, statusFilter);
  const generateMutation = useGenerateQRCodes();
  const deleteMutation = useDeleteQRCode();

  const maxVisualNumber = useMemo(() => {
    const items = data?.items || [];
    if (!items.length) return 0;
    return Math.max(...items.map((item) => item.visual_number));
  }, [data?.items]);

  const nextVisualNumber = maxVisualNumber + 1;

  const handleGenerate = (payload: { start_visual_number: number; quantity: number }) => {
    generateMutation.mutate(payload, {
      onSuccess: () => setIsGenerateOpen(false),
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSettled: () => setDeleteId(null),
    });
  };

  const downloadQRCode = (qrCode: QRCodeResponse) => {
    const element = document.getElementById(`qr-canvas-${qrCode.id}`) as HTMLCanvasElement | null;
    if (!element) return;

    const link = document.createElement('a');
    link.href = element.toDataURL('image/png');
    link.download = `qr-${formatVisualNumber(qrCode.visual_number)}.png`;
    link.click();
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Erro ao carregar QR Codes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Codes</h1>
          <p className="text-muted-foreground">Gerencie e gere lotes de QR Codes</p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as 'active' | 'inactive');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setIsGenerateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Gerar QR Codes
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numero visual</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[180px]">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[220px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[70px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[150px]" /></TableCell>
                </TableRow>
              ))
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum QR Code encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((qrCode) => (
                <TableRow key={qrCode.id}>
                  <TableCell className="font-medium">#{formatVisualNumber(qrCode.visual_number)}</TableCell>
                  <TableCell className="max-w-[260px] truncate font-mono text-xs">{qrCode.token}</TableCell>
                  <TableCell>{getStatusBadge(qrCode.status)}</TableCell>
                  <TableCell>{formatDate(qrCode.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setPreviewQRCode(qrCode)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => downloadQRCode(qrCode)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {qrCode.status === 'active' && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(qrCode.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <QRCodeCanvas
                      id={`qr-canvas-${qrCode.id}`}
                      value={qrCode.token}
                      size={256}
                      className="hidden"
                      includeMargin
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total_pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {data.items.length} de {data.total} QR Codes
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= data.total_pages}
            >
              Proxima
            </Button>
          </div>
        </div>
      )}

      <GenerateQRDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        defaultStartVisualNumber={nextVisualNumber}
        isPending={generateMutation.isPending}
        onGenerate={handleGenerate}
      />

      <Dialog open={!!previewQRCode} onOpenChange={() => setPreviewQRCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code #{previewQRCode ? formatVisualNumber(previewQRCode.visual_number) : ''}</DialogTitle>
            <DialogDescription>Use este QR Code para acesso na votacao.</DialogDescription>
          </DialogHeader>

          {previewQRCode && (
            <div className="flex flex-col items-center gap-4 py-2">
              <QRCodeCanvas value={previewQRCode.token} size={280} includeMargin />
              <p className="max-w-full truncate font-mono text-xs text-muted-foreground">
                {previewQRCode.token}
              </p>
              <Button onClick={() => downloadQRCode(previewQRCode)}>
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar QR Code?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao marca o QR Code como inativo e ele nao ficara mais disponivel na lista de ativos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {deleteMutation.isPending ? 'Desativando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
