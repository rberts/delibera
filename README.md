# SPEC - Sistema de Votação para Assembleias de Condomínio

**Versão:** 1.0  
**Data:** 19 de Janeiro de 2026  
**Status:** Em Desenvolvimento

---

## Índice de Documentação

Este SPEC técnico está organizado em seções modulares para facilitar navegação e manutenção.

### 📋 Contexto & Planejamento

- **[01. Visão Geral & Contexto](01-visao-geral.md)**  
  Resumo executivo, objetivos, público-alvo do documento

- **[02. Decisões Técnicas & Arquitetura](02-decisoes-tecnicas.md)**  
  Stack completa, multi-tenancy, segurança, real-time, trade-offs

- **[03. Estrutura dos Repositórios](03-estrutura-repositorios.md)**  
  Organização monorepo, convenções, estrutura de pastas

- **[04. Setup do Ambiente de Desenvolvimento](04-setup-ambiente.md)**  
  Pré-requisitos, Docker, variáveis de ambiente, scripts

### 💾 Database & Backend

- **[05. Database Schema & Models](05-database-schema.md)** ✅  
  Diagrama ER, tabelas detalhadas, índices, migrations, seed data

- **[06. Backend Implementation](06-backend-implementation.md)** ✅  
  FastAPI, features, auth, voting, SSE, PDF, CSV, testes

### 🎨 Frontend & Testing

- **[07. Frontend Implementation](07-frontend-implementation.md)**  
  React, componentes, routers, state management, real-time

- **[08. Testing Strategy](08-testing-strategy.md)**  
  Estratégia geral, fixtures, cobertura, CI/CD

### 🚀 Deploy & Roadmap

- **[09. Deployment](09-deployment.md)**  
  Vercel, Render, Neon, CI/CD, variáveis de ambiente

- **[10. Roadmap de Implementação](10-roadmap-implementacao.md)**  
  Ordem tática, milestones, dependências entre features

---

## Status das Seções

| Seção | Arquivo | Status |
|-------|---------|--------|
| 1 | `01-visao-geral.md` | ✅ Completo |
| 2 | `02-decisoes-tecnicas.md` | ✅ Completo |
| 3 | `03-estrutura-repositorios.md` | ✅ Completo |
| 4 | `04-setup-ambiente.md` | ✅ Completo |
| 5 | `05-database-schema.md` | ✅ Completo |
| 6 | `06-backend-implementation.md` | ✅ Completo |
| 7 | `07-frontend-implementation.md` | ✅ Completo |
| 8 | `08-testing-strategy.md` | ✅ Completo |
| 9 | `09-deployment.md` | ✅ Completo |
| 10 | `10-roadmap-implementacao.md` | ✅ Completo |

---

## Como Usar Este SPEC

**Para Desenvolvimento:**
1. Leia a ordem do Roadmap (Seção 10)
2. Consulte Database Schema (Seção 5) para entender estrutura
3. Siga Backend Implementation (Seção 6) file-by-file
4. Use Frontend Implementation (Seção 7) para UI

**Para Claude Code:**
```bash
# Exemplo de uso
"Leia 06-backend-implementation.md seção 6.7 sobre Voting System"
"Implemente conforme especificado em 05-database-schema.md seção 5.6.11"
```

**Para Manutenção:**
- Cada arquivo é independente e versionável
- Atualize seções específicas sem afetar outras
- Use git diff para ver mudanças por seção

---

## Tecnologias Principais

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui  
**Backend:** Python 3.11+, FastAPI, SQLAlchemy, Alembic  
**Database:** PostgreSQL 14+ (Neon)  
**Deploy:** Vercel (frontend), Render (backend)

---

## Contato & Contribuição

Este é um documento vivo que evolui com o projeto.

Para questões ou sugestões sobre o SPEC:
- Abra issue no repositório
- Proponha mudanças via PR
- Documente decisões importantes como ADRs

---

**Última atualização:** 19 de Janeiro de 2026
