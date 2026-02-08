import { Badge } from '@/components/ui/badge';
import type { AssemblyStatus } from '@/types/api';

const statusConfig: Record<AssemblyStatus, { label: string; variant: 'secondary' | 'default' | 'outline' | 'destructive' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  in_progress: { label: 'Em andamento', variant: 'default' },
  finished: { label: 'Finalizada', variant: 'outline' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

export function AssemblyStatusBadge({ status }: { status: AssemblyStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
