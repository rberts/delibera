import { useState } from 'react';
import { Upload } from 'lucide-react';
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
import { CSVPreviewTable } from './CSVPreviewTable';
import { useCSVImport, useCSVPreview } from '../hooks/useCSVImport';

interface CSVImportProps {
  assemblyId: number;
  disabled?: boolean;
}

export function CSVImport({ assemblyId, disabled = false }: CSVImportProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const previewMutation = useCSVPreview(assemblyId);
  const importMutation = useCSVImport(assemblyId);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setFile(null);
      previewMutation.reset();
      importMutation.reset();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const formData = new FormData();
    formData.append('file', selectedFile);
    previewMutation.mutate(formData);
  };

  const handleImport = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    importMutation.mutate(formData, {
      onSuccess: () => {
        handleOpenChange(false);
      },
    });
  };

  return (
    <>
      <Button onClick={() => handleOpenChange(true)} disabled={disabled}>
        <Upload className="mr-2 h-4 w-4" />
        Importar CSV
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Importar Unidades</DialogTitle>
            <DialogDescription>
              Faca upload do arquivo CSV com as colunas: unit_number, owner_name, ideal_fraction, cpf_cnpj.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">Arquivo CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                disabled={importMutation.isPending}
              />
            </div>

            {previewMutation.data && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Total de linhas no arquivo: {previewMutation.data.total_rows}
                </div>

                {previewMutation.data.errors.length > 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <p className="font-medium">Erros de validacao:</p>
                    <ul className="mt-2 list-disc pl-5">
                      {previewMutation.data.errors.slice(0, 20).map((error) => (
                        <li key={`${error.line}-${error.field}-${error.message}`}>
                          Linha {error.line} ({error.field}): {error.message}
                        </li>
                      ))}
                    </ul>
                    {previewMutation.data.errors.length > 20 && (
                      <p className="mt-2">Exibindo 20 de {previewMutation.data.errors.length} erros.</p>
                    )}
                  </div>
                )}

                {previewMutation.data.warnings.length > 0 && (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    <p className="font-medium">Avisos:</p>
                    <ul className="mt-2 list-disc pl-5">
                      {previewMutation.data.warnings.map((warning) => (
                        <li key={`${warning.type}-${warning.message}`}>{warning.message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview (primeiras 10 linhas)</p>
                  <CSVPreviewTable rows={previewMutation.data.preview} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={importMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                !file ||
                !previewMutation.data ||
                !previewMutation.data.can_import ||
                importMutation.isPending
              }
            >
              {importMutation.isPending ? 'Importando...' : 'Confirmar importacao'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
