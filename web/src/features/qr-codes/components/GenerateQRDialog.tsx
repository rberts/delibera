import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { QRCodeGenerateRequest } from '@/types/api';

interface GenerateQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStartVisualNumber: number;
  isPending: boolean;
  onGenerate: (payload: QRCodeGenerateRequest) => void;
}

export function GenerateQRDialog({
  open,
  onOpenChange,
  defaultStartVisualNumber,
  isPending,
  onGenerate,
}: GenerateQRDialogProps) {
  const [startVisualNumber, setStartVisualNumber] = useState(defaultStartVisualNumber);
  const [quantity, setQuantity] = useState(10);

  useEffect(() => {
    if (!open) return;
    setStartVisualNumber(defaultStartVisualNumber);
    setQuantity(10);
  }, [defaultStartVisualNumber, open]);

  const submit = () => {
    if (!Number.isInteger(startVisualNumber) || startVisualNumber <= 0) {
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return;
    }

    onGenerate({
      start_visual_number: startVisualNumber,
      quantity,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar QR Codes</DialogTitle>
          <DialogDescription>
            Informe o numero inicial e a quantidade para gerar um lote.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-visual-number">Numero visual inicial</Label>
            <Input
              id="start-visual-number"
              type="number"
              min={1}
              value={startVisualNumber}
              onChange={(event) => setStartVisualNumber(Number(event.target.value))}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade (1-100)</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? 'Gerando...' : 'Gerar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
