import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AttendanceItem } from '@/features/checkin/hooks/useCheckin';

interface AttendancePanelProps {
  items: AttendanceItem[];
  isLoading: boolean;
}

function formatVisualNumber(value: number) {
  return String(value).padStart(3, '0');
}

export function AttendancePanel({ items, isLoading }: AttendancePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de presenca</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando lista de presenca...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>QR</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Proprietarios</TableHead>
                <TableHead>Fracao</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum check-in registrado.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.assignment_id}>
                    <TableCell className="font-medium">#{formatVisualNumber(item.qr_visual_number)}</TableCell>
                    <TableCell>{item.units.map((unit) => unit.unit_number).join(', ')}</TableCell>
                    <TableCell>{item.owner_names.join(', ')}</TableCell>
                    <TableCell>{item.total_fraction.toFixed(2)}%</TableCell>
                    <TableCell>{item.is_proxy ? 'Procuracao' : 'Titular'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
