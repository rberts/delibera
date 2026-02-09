import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AttendanceItem } from '../hooks/useCheckin';

interface AttendanceListProps {
  items: AttendanceItem[];
  onUndo: (assignmentId: number) => void;
  isUndoing: boolean;
}

function formatVisualNumber(value: number) {
  return String(value).padStart(3, '0');
}

export function AttendanceList({ items, onUndo, isUndoing }: AttendanceListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>QR</TableHead>
            <TableHead>Unidades</TableHead>
            <TableHead>Proprietarios</TableHead>
            <TableHead>Fracao</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="w-[130px]">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhum check-in registrado ainda.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.assignment_id}>
                <TableCell className="font-medium">#{formatVisualNumber(item.qr_visual_number)}</TableCell>
                <TableCell>
                  {item.units.map((unit) => unit.unit_number).join(', ')}
                </TableCell>
                <TableCell>{item.owner_names.join(', ')}</TableCell>
                <TableCell>{item.total_fraction.toFixed(2)}%</TableCell>
                <TableCell>{item.is_proxy ? 'Procuracao' : 'Titular'}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUndo(item.assignment_id)}
                    disabled={isUndoing}
                  >
                    Desfazer
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
