# Delibera API

Backend FastAPI para o sistema de votacao de assembleias.

## Setup rapido
1. Copie `.env.example` para `.env` e ajuste os valores.
2. Instale dependencias com Poetry.
3. Rode o servidor:

```bash
poetry run uvicorn app.main:app --reload
```

Documentacao: `http://localhost:8000/api/docs`

## Dependencias de PDF (WeasyPrint)
Para gerar relatorios em PDF, instale as dependencias de sistema:

macOS (Homebrew):
```bash
brew install cairo pango gdk-pixbuf libffi
```

Linux (Debian/Ubuntu):
```bash
sudo apt-get install -y libcairo2 libpango-1.0-0 libgdk-pixbuf-2.0-0 libffi-dev
```

## Endpoints de relatorios
- `GET /api/v1/reports/assemblies/{assembly_id}/attendance`
- `GET /api/v1/reports/agendas/{agenda_id}/results`
- `GET /api/v1/reports/assemblies/{assembly_id}/final`

## SSE (tempo real)
- `GET /api/v1/realtime/assemblies/{assembly_id}/stream`
