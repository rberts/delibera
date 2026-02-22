import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CSVPreviewRow } from '../hooks/useCSVImport';

interface CSVPreviewTableProps {
  rows: CSVPreviewRow[];
}

export function CSVPreviewTable({ rows }: CSVPreviewTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Linha</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Proprietario</TableHead>
            <TableHead>Fracao Ideal</TableHead>
            <TableHead>CPF/CNPJ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Nenhuma linha para preview.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.line} className={row.error ? 'bg-red-50' : undefined}>
                <TableCell>{row.line}</TableCell>
                <TableCell>{row.unit_number}</TableCell>
                <TableCell>{row.owner_name}</TableCell>
                <TableCell>{row.ideal_fraction}</TableCell>
                <TableCell>{row.cpf_cnpj}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
