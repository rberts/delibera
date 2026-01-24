# Repository Guidelines

## Estrutura do Projeto & Organização
Este repositório contém o SPEC e artefatos de planejamento, não código executável. A documentação principal fica em `docs/` e é numerada por seção (ex.: `docs/06-backend-implementation.md`). Os arquivos de planejamento devem ficar em `plans/`. O `README.md` é o índice oficial do SPEC.

## Navegação Recomendada (Otimização de Contexto)
Para reduzir trocas de contexto durante o desenvolvimento, siga esta ordem ao trabalhar em uma feature:
1. Contexto e decisões: `docs/01-visao-geral.md` e `docs/02-decisoes-tecnicas.md`.
2. Estrutura de repositórios: `docs/03-estrutura-repositorios.md` (backend `assembly-voting-backend`, frontend `assembly-voting-frontend`).
3. Setup de ambiente: `docs/04-setup-ambiente.md`.
4. Dados e domínio: `docs/05-database-schema.md`.
5. Implementação backend: `docs/06-backend-implementation.md`.
6. Estratégia de testes: `docs/08-testing-strategy.md`.
7. Roadmap tático: `docs/10-roadmap-implementacao.md`.

## Comandos de Build, Teste e Desenvolvimento
Este repositório não possui comandos de build ou execução. Use os comandos descritos no SPEC, principalmente em:
- `docs/04-setup-ambiente.md` (ex.: `poetry run uvicorn app.main:app --reload`, `docker-compose up -d`).
- `docs/08-testing-strategy.md` (ex.: `pytest`).

## Estilo de Documentação & Nomenclatura
Mantenha o padrão do SPEC:
- Seções claras, numeradas e com bullets objetivos.
- Nomes de arquivos em `docs/` seguem `NN-titulo.md`.
- Qualquer nova seção deve ser adicionada ao índice do `README.md`.

## Diretrizes de Testes
Os testes são definidos para os repositórios de implementação. Referência obrigatória:
- `docs/08-testing-strategy.md` (Pytest + alvo de cobertura ~60% com foco em auth, voting, tenancy, CSV).

## Commits & Pull Requests
Não há convenção explícita registrada. Use Conventional Commits como padrão (ex.: `docs: atualiza AGENTS`). PRs devem:
- Explicar claramente a mudança no SPEC.
- Referenciar decisões/links relevantes (quando existirem).
- Indicar se algum número de seção mudou.

## Fluxo de Execução & Validação
- Só marcar etapa no checklist como concluída após aprovação explícita do usuário.
- Após implementar tarefas, fornecer passo a passo de teste e validação via Swagger.
- Após cada execução de tarefa, sugerir mensagem de commit seguindo o padrão Conventional Commits.

## Segurança & Configuração
Segredos e variáveis de ambiente pertencem aos repositórios de implementação. Consulte `docs/04-setup-ambiente.md` para variáveis e práticas recomendadas.
