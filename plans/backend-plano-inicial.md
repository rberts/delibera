# Planejamento Inicial do Backend

## Objetivo
Organizar a execução do backend no repositório `delibera-api` (pasta na raiz) com base no SPEC em `docs/`, garantindo ordem correta de dependências e foco no MVP.

## Referências obrigatórias
- `docs/06-backend-implementation.md`
- `docs/05-database-schema.md`
- `docs/10-roadmap-implementacao.md`
- `docs/08-testing-strategy.md`
- `docs/04-setup-ambiente.md`

## Fases e entregas

### 1) Foundation (setup e base) (concluido)
- [x] Estruturar o repositório conforme `docs/03-estrutura-repositorios.md`.
- [x] Criar `app/main.py`, `core/` e configuração do FastAPI.
- [x] Configurar SQLAlchemy + Alembic + `.env.example`.
- Validacao: endpoint `/health` presente e app com `/api/docs` configurado.

### 2) Schema e migrations (concluido)
- [x] Implementar modelos SQLAlchemy (tabelas do SPEC).
- [x] Gerar migration inicial.
- Validacao: migration inicial presente em `alembic/versions/`.

### 3) Autenticação e tenancy (finalizada)
- [x] JWT em cookies httpOnly (login, refresh, logout, /me).
- [x] Dependências `get_current_user` e `get_current_tenant`.
- [x] Middleware de tenant e handlers globais de erro.
- [x] Validacao: login/refresh/me/logout com cookies locais OK.

### 4) CRUDs principais
- [x] Condominiums (com status ativo/inativo e soft delete via status).
- [x] Assemblies (com status cancelado e bloqueio de edicao quando cancelada).
- [x] Users (com status ativo/inativo e bloqueio de login para inativos).
- [x] QR Codes (status ativo/inativo e soft delete).
- [x] Agendas (status e cancelamento).
- Schemas/routers/services por feature.
- Verificação: CRUD completo via `/api/docs`.
  - Teste sugerido: criar, listar, editar e remover entidades pelo Swagger.

### 5) Fluxo de assembleia
- Importação CSV e snapshot em `assembly_units`.
- Check-in e atribuições de QR.
- Votação (regras de voto, invalidação, auditoria).
- Verificação: fluxo completo sem falhas críticas.
  - Teste sugerido: importar CSV, atribuir QR, abrir pauta e votar (com checagem de resultados).

### 6) Realtime e relatórios (concluido)
- [x] SSE para dashboards.
- [x] PDFs com WeasyPrint (presença, resultados, ata).
- Verificação: SSE respondendo e PDFs gerados.
  - Teste sugerido: assinar SSE em `/api/v1/realtime` e gerar relatórios via endpoints.

### 7) Testes e hardening (parcial)
- [x] Testes E2E (assembly flow) rodando em SQLite.
- [x] Testes de integração para notificações SSE.
- [x] Ajustes de compatibilidade SQLite nos testes (UUID, constraints e pool).
- [x] Testes críticos: auth, tenancy, voting, CSV.
- [x] Documentacao do backend (README com PDF/SSE e deps).
- [x] Ajustes de índices/constraints (revisao alinhada ao SPEC, sem gaps).
- Verificação: suite crítica passando e cobertura mínima.
  - Teste sugerido: `pytest -q` e `pytest --cov`.

## Critérios de pronto (MVP backend)
- Auth + multi-tenancy funcionando.
- Fluxo de assembleia completo (import, check-in, votação, resultados).
- SSE e PDFs funcionando.
- Testes críticos cobrindo os casos principais.

## Observações
- Implementar por fatias verticais quando possível.
- Manter o SPEC atualizado se houver desvios.
