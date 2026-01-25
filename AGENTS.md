# Repository Guidelines (Monorepo)

## Estrutura do Projeto & Organizacao
Este repositorio e monorepo:
- Implementacao backend em `api/` e frontend em `web/`.
- Documentacao principal em `docs/` (secoes numeradas).
- Planejamento em `plans/`.
- `README.md` e o indice oficial do SPEC.

## Navegacao Recomendada
Para reduzir trocas de contexto durante o desenvolvimento, siga esta ordem:
1. Contexto e decisoes: `docs/01-visao-geral.md` e `docs/02-decisoes-tecnicas.md`.
2. Estrutura do monorepo: `docs/03-estrutura-repositorios.md`.
3. Setup de ambiente: `docs/04-setup-ambiente.md`.
4. Dados e dominio: `docs/05-database-schema.md`.
5. Implementacao backend: `docs/06-backend-implementation.md`.
6. Frontend: `docs/07-frontend-implementation.md`.
7. Estrategia de testes: `docs/08-testing-strategy.md`.
8. Roadmap tatico: `docs/10-roadmap-implementacao.md`.

## Comandos de Build, Teste e Desenvolvimento
Nao ha comandos na raiz. Use:
- Backend: `api/` (Makefile e Poetry).
- Frontend: `web/` (pnpm/Vite).
- Referencias: `docs/04-setup-ambiente.md` e `docs/08-testing-strategy.md`.

## Estilo de Documentacao & Nomenclatura
Mantenha o padrao do SPEC:
- Secoes claras, numeradas e com bullets objetivos.
- Arquivos em `docs/` seguem `NN-titulo.md`.
- Nova secao deve ser adicionada ao indice do `README.md`.

## Diretrizes de Testes
Testes sao definidos nos subprojetos. Referencia obrigatoria:
- `docs/08-testing-strategy.md` (Pytest + cobertura ~60%).

## Commits & Pull Requests
Use Conventional Commits (ex.: `docs: atualiza AGENTS`). PRs devem:
- Explicar claramente a mudanca no SPEC.
- Referenciar decisoes/links relevantes.
- Indicar se algum numero de secao mudou.

## Fluxo de Execucao & Validacao
- Marcar etapa no checklist apenas com aprovacao explicita do usuario.
- Para features implementadas, fornecer passo a passo de teste/validacao via Swagger.
- Após cada tarefa, sugerir mensagem de commit em Conventional Commits.

## Seguranca & Configuracao
Segredos/variaveis pertencem a `api/` e `web/`. Consulte `docs/04-setup-ambiente.md`.
