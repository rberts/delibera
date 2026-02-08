import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { AgendaResponse } from '@/types/api';

interface VoteCardProps {
  agenda: AgendaResponse;
  onVote: (optionId: number) => void;
  isSubmitting: boolean;
}

export function VoteCard({ agenda, onVote, isSubmitting }: VoteCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const sortedOptions = useMemo(
    () => [...(agenda.options ?? [])].sort((a, b) => a.display_order - b.display_order),
    [agenda.options]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecione seu voto</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {sortedOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedOption(option.id)}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                selectedOption === option.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-accent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-4 w-4 rounded-full border ${
                    selectedOption === option.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}
                />
                <span className="text-base">{option.option_text}</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => selectedOption && onVote(selectedOption)}
          disabled={!selectedOption || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Enviando...' : 'Confirmar voto'}
        </Button>
      </CardFooter>
    </Card>
  );
}
