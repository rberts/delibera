import { useEffect, useId, useMemo, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (token: string) => void;
}

function extractToken(decodedText: string): string {
  const trimmed = decodedText.trim();
  const match = trimmed.match(/\/vote\/([^/?#]+)/i);
  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }
  return trimmed;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isActive, setIsActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const rawId = useId();
  const elementId = useMemo(() => `qr-scanner-${rawId.replace(/[:]/g, '')}`, [rawId]);

  useEffect(() => {
    if (!isActive) return;

    let scanner: Html5Qrcode | null = new Html5Qrcode(elementId);
    let cancelled = false;

    const start = async () => {
      try {
        await scanner?.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText) => {
            if (cancelled) return;
            onScan(extractToken(decodedText));
            setIsActive(false);
          },
          () => {
            // Ignore frame-level decode errors to avoid noisy UI.
          }
        );
        setErrorMessage(null);
      } catch {
        setErrorMessage('Nao foi possivel iniciar a camera. Use o numero visual manual.');
      }
    };

    start();

    return () => {
      cancelled = true;
      const stop = async () => {
        if (!scanner) return;
        try {
          await scanner.stop();
        } catch {
          // noop
        }
        try {
          await scanner.clear();
        } catch {
          // noop
        }
        scanner = null;
      };
      void stop();
    };
  }, [elementId, isActive, onScan]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={() => setIsActive((prev) => !prev)}>
          {isActive ? 'Fechar camera' : 'Abrir camera'}
        </Button>
      </div>

      {isActive && <div id={elementId} className="min-h-[260px] rounded-md border p-2" />}

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
}
