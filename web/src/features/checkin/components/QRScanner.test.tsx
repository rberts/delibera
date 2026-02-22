import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QRScanner } from './QRScanner';

const startMock = vi.fn();
const stopMock = vi.fn();
const clearMock = vi.fn();

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: class {
    start = startMock;
    stop = stopMock;
    clear = clearMock;
  },
}));

describe('QRScanner', () => {
  beforeEach(() => {
    startMock.mockReset();
    stopMock.mockReset();
    clearMock.mockReset();
    stopMock.mockResolvedValue(undefined);
    clearMock.mockResolvedValue(undefined);
  });

  it('extracts token from /vote URL', async () => {
    const onScan = vi.fn();
    startMock.mockImplementation(async (_camera, _config, onDecode) => {
      onDecode('https://app.example.com/vote/test-token-123?x=1');
    });

    render(<QRScanner onScan={onScan} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir camera' }));

    await waitFor(() => {
      expect(onScan).toHaveBeenCalledWith('test-token-123');
    });
  });
});
