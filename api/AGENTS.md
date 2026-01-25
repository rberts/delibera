# Backend Guidelines (api/)

## Escopo
Este diretorio contem o backend FastAPI. Codigo principal em `app/`, migrations em `alembic/`, testes em `tests/`.

## Comandos Principais
- Dev server: `poetry run uvicorn app.main:app --reload`
- Migrations: `poetry run alembic upgrade head`
- Testes: `make test`, `make unit`, `make integration`, `make e2e`
- Cobertura: `make cov`

## Organizacao do Codigo
- Features em `app/features/` (models, schemas, service, router).
- Core em `app/core/` (config, database, dependencies).
- Nao alterar migrations existentes sem solicitacao explicita.

## Deploy & Config
- Deploy em Render com `Root Directory: api`.
- Banco em Neon (Postgres). `DATABASE_URL` no Render/GitHub Actions.
- Migrations automatizadas via GitHub Actions antes do deploy.
- Health check: `/health`.

## Testes
- Testes usam SQLite nos fixtures; ajustes de compatibilidade ficam em `tests/conftest.py`.
- Cobertura alvo >= 60%.

## Seguranca
- Nunca commitar secrets. Use `.env` local e Secrets no GitHub/Render.
