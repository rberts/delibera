# Planejamento: Migracao do SPEC para Monorepo

## Objetivo
Atualizar o SPEC e artefatos de planejamento para refletir uma estrutura monorepo, alinhada a estrutura atual do repo (pastas `api/` e `web/`).

## Contexto Atual (observado)
- O repositorio ja contem `api/` (backend FastAPI) e `web/` (frontend Vite/React).
- A documentacao ainda descreve multi-repo com `assembly-voting-backend` e `assembly-voting-frontend`.

## Escopo das Mudancas
- Documentacao de decisoes e estrutura de repositorios.
- Setup de ambiente, deploy e CI/CD.
- Roadmap e referencias a repositorios separados.
- Ajustes pontuais em backend/frontend docs para paths e exemplos.

## Plano de Trabalho
### 1) Alinhamento de Decisoes e Estrutura
- [ ] Atualizar `docs/02-decisoes-tecnicas.md` (Trade-off 2.5) para monorepo.
- [ ] Revisar `docs/03-estrutura-repositorios.md` para refletir layout monorepo.
- [ ] Definir estrutura alvo (manter `api/` e `web/` como subprojetos).

### 2) Setup de Ambiente
- [ ] Ajustar `docs/04-setup-ambiente.md` para comandos a partir do monorepo:
  - `cd api` para backend e `cd web` para frontend.
  - Atualizar exemplos de clone (agora um repo unico).
  - Atualizar caminhos de arquivos (`docker-compose.yml`, `.env`, etc.).

### 3) Backend e Frontend Specs
- [ ] Atualizar referencias de repositorio em `docs/06-backend-implementation.md`.
- [ ] Atualizar referencias de repositorio em `docs/07-frontend-implementation.md`.
- [ ] Revisar paths de exemplos, se houver referencias a raiz antiga.

### 4) Deploy e CI/CD
- [ ] Ajustar `docs/09-deployment.md` para monorepo:
  - Vercel/Render apontando para subdiretorios.
  - Workflows separados por path (`api/**`, `web/**`).
  - Repositorio unico nas instrucoes.

### 5) Testing Strategy
- [ ] Ajustar `docs/08-testing-strategy.md` para monorepo:
  - Comandos e CI com paths.
  - Separacao de cobertura por subprojeto.

### 6) Roadmap e Indice
- [ ] Atualizar `docs/10-roadmap-implementacao.md` (remover passos de criar dois repos).
- [ ] Ajustar `README.md` com nova decisao e referencias a monorepo.

## Artefatos a Revisar (lista inicial)
- `README.md`
- `docs/02-decisoes-tecnicas.md`
- `docs/03-estrutura-repositorios.md`
- `docs/04-setup-ambiente.md`
- `docs/06-backend-implementation.md`
- `docs/07-frontend-implementation.md`
- `docs/08-testing-strategy.md`
- `docs/09-deployment.md`
- `docs/10-roadmap-implementacao.md`

## Criterios de Aceite
- [ ] Toda referencia a multi-repo substituida por monorepo.
- [ ] Comandos de setup/deploy/teste funcionando com `api/` e `web/`.
- [ ] Estrutura documentada condiz com o repo atual.
- [ ] README atualizado como indice oficial do SPEC.
