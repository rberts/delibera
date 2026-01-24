# 2. Decisões Técnicas & Arquitetura

**Status:** ✅ Completo

---

## 2.1 Stack Completa

### Frontend

**React 18 + TypeScript + Vite**

**Por quê:**
- React: ecossistema maduro, grande comunidade, contratação fácil
- TypeScript: type safety reduz bugs, melhor DX com autocomplete
- Vite: build rápido, HMR instantâneo, melhor que CRA

**Alternativas consideradas:**
- ❌ Next.js: overhead desnecessário (não precisa SSR para este caso)
- ❌ Vue/Svelte: menor ecossistema, menos desenvolvedores disponíveis

**Tailwind CSS + Shadcn/ui**

**Por quê:**
- Tailwind: utility-first, rápido para prototipar, consistência visual
- Shadcn/ui: componentes acessíveis, customizáveis, sem dependência runtime

**Alternativas consideradas:**
- ❌ Material-UI: pesado, opinionated demais
- ❌ CSS modules: mais verboso, menos produtivo

**TanStack Query + Zustand**

**Por quê:**
- TanStack Query: gerencia cache, retry, invalidation automaticamente
- Zustand: state global simples, menos boilerplate que Redux

**Alternativas consideradas:**
- ❌ Redux: muito boilerplate para projeto deste tamanho
- ❌ Apollo Client: overhead de GraphQL desnecessário

---

### Backend

**Python 3.11+ + FastAPI**

**Por quê:**
- FastAPI: async nativo, documentação automática (OpenAPI), type hints
- Python: excelente para processamento de dados (frações ideais, cálculos)
- Ecossistema: WeasyPrint (PDFs), SQLAlchemy (ORM maduro)

**Alternativas consideradas:**
- ❌ Node.js + Express: menos maduro para PDFs, cálculos matemáticos
- ❌ Django: muito opinionated, DRF é verbose, FastAPI é mais moderno
- ❌ Go: curva de aprendizado, menos libs para PDFs em português

**SQLAlchemy + Alembic**

**Por quê:**
- SQLAlchemy: ORM maduro, suporte excelente a PostgreSQL, type hints
- Alembic: migrations declarativas, rollback seguro

**WeasyPrint**

**Por quê:**
- Gera PDFs de alta qualidade de HTML/CSS
- Suporte a fontes, tabelas complexas, paginação
- Alternativa: ReportLab é mais low-level, menos produtivo

---

### Database

**PostgreSQL 14+**

**Por quê:**
- ACID completo (essencial para integridade de votos)
- JSON support (útil para metadados futuros)
- Constraints robustas (UNIQUE, CHECK, foreign keys)
- Free tier no Neon com 0.5 GB (suficiente para MVP)

**Alternativas consideradas:**
- ❌ MySQL: menos features, sem SERIAL, weaker constraints
- ❌ SQLite: não adequado para multi-tenant SaaS
- ❌ MongoDB: schema-less não é adequado para dados estruturados críticos

---

### Deploy

**Frontend: Vercel**
- Free tier: 100 GB bandwidth/mês
- Deploy automático via Git
- CDN global, HTTPS automático

**Backend: Render**
- Free tier: 750h/mês, sleep após 15min inatividade
- Bom para MVP, facilmente escalável para paid tier

**Database: Neon**
- PostgreSQL serverless
- Free tier: 0.5 GB storage, 3 GB transfer
- Backups automáticos

**Por que não AWS/GCP/Azure:**
- Overhead de configuração
- Custo inicial mais alto
- Free tiers menos generosos

---

## 2.2 Multi-Tenancy Strategy

### Abordagem: Single Database, Row-Level Isolation

**Como funciona:**
- Cada tabela tem coluna `tenant_id` (Foreign Key para `tenants`)
- Middleware extrai `tenant_id` do JWT
- Todas as queries filtram automaticamente por `tenant_id`

**Exemplo:**
```sql
-- Tabela de condomínios
CREATE TABLE condominiums (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    ...
);

-- Query automática filtra por tenant
SELECT * FROM condominiums WHERE tenant_id = 1;
```

**Vantagens:**
- Simples de implementar
- Um único deploy, uma única migration
- Custo reduzido (single database)

**Desvantagens:**
- Risco de "leakage" (mitigado por middleware rígido)
- Menos isolamento que database-per-tenant

**Por que esta abordagem:**
- MVP não justifica complexidade de database-per-tenant
- Teste de isolamento rigoroso no middleware
- Escalável para ~1000 tenants antes de considerar sharding

**Alternativas consideradas:**
- ❌ Database-per-tenant: overhead operacional enorme
- ❌ Schema-per-tenant: complexidade de migrations
- ✅ Row-level (escolhida): sweet spot para SaaS B2B

---

## 2.3 Segurança e Autenticação

### Estratégia: JWT em httpOnly Cookies

**Como funciona:**
```
1. Login: POST /api/v1/auth/login
   └─> Retorna JWT em cookie httpOnly, secure, samesite=lax
2. Requests subsequentes: Cookie enviado automaticamente
3. Backend valida JWT, extrai user_id e tenant_id
4. Middleware injeta contexto do usuário
```

**Por quê:**
- httpOnly: protege contra XSS (JS não acessa cookie)
- secure: só envia em HTTPS
- samesite=lax: protege contra CSRF em formulários

**Token structure:**
```json
{
  "user_id": 123,
  "tenant_id": 1,
  "role": "property_manager",
  "exp": 1234567890
}
```

**Lifetime:**
- Access token: 15 minutos (curto para limitar janela de ataque)
- Refresh token: 7 dias (permite renovação sem re-login)

**Alternativas consideradas:**
- ❌ Session-based: requer Redis/database lookup (mais lento)
- ❌ JWT em localStorage: vulnerável a XSS
- ✅ JWT em httpOnly cookie (escolhida): melhor segurança

### Voto Secreto vs Auditabilidade

**Requisito legal:**
- Condôminos não devem saber como outros votaram (voto secreto)
- Administradora precisa auditar votos (compliance)

**Solução:**
```
votes table:
  - vote_id (PK)
  - agenda_id (FK)
  - option_id (FK)
  - unit_id (FK) ← identifica unidade, não pessoa
  - ideal_fraction
  - voted_at
  - is_valid
  - invalidated_by (FK users) ← para auditoria
```

**Votação pública (condômino):**
- Interface mostra apenas: "Seu voto foi registrado"
- Não mostra votos de outros

**Operator dashboard:**
- Mostra: quem ainda não votou, contagem total
- Não mostra: voto individual nominal
- Pode invalidar voto (marca is_valid=FALSE, mantém histórico)

**PDF de resultados:**
- Mostra: opção X recebeu Y votos, Z% fração ideal
- Não mostra: lista nominal de quem votou em quê

---

## 2.4 Real-time com SSE (Server-Sent Events)

### Por que SSE e não WebSockets?

**SSE (Server-Sent Events):**
- Unidirecional (server → client)
- HTTP/1.1 nativo, funciona em qualquer navegador
- Reconexão automática
- Simples de implementar (no backend é um generator)

**WebSockets:**
- Bidirecional (client ↔ server)
- Requer upgrade HTTP
- Mais complexo (heartbeats, reconexão manual)

**Para este projeto:**
- ✅ SSE é suficiente: updates vão do server → clients (votos, check-ins)
- ✅ Clientes não precisam enviar mensagens em tempo real (usam POST normal)
- ✅ Menos overhead, mais fácil de debugar

**Limitação conhecida:**
- Navegadores limitam ~6 SSE connections por domínio
- Mitigação: operadores usam 1 SSE, condôminos não precisam (reload manual)

**Eventos suportados:**
```json
{
  "type": "vote_update",
  "agenda_id": 123,
  "data": { "option_id": 1, "new_count": 15 }
}

{
  "type": "checkin_update",
  "data": { "total_fraction": 65.5, "quorum_reached": true }
}

{
  "type": "agenda_update",
  "data": { "agenda_id": 124, "status": "open" }
}

{
  "type": "heartbeat"
}
```

---

## 2.5 Principais Trade-offs

### Trade-off 1: Multi-repo vs Monorepo

**Decisão:** Monorepo (backend e frontend no mesmo repositório)

**Vantagens:**
- Setup e onboarding mais simples (um clone)
- Mudanças coordenadas (API + UI) no mesmo PR
- CI/CD com filtros por caminho para evitar builds desnecessários

**Desvantagens:**
- Deploy independente exige configuração por subdiretório
- Pipeline e permissões mais detalhadas
- Repo maior ao longo do tempo

**Por quê:** O projeto já evoluiu para uma estrutura unificada (`api/` e `web/`), e a redução de fricção no desenvolvimento é mais valiosa neste momento.

---

### Trade-off 2: Soft Delete vs Hard Delete

**Decisão:** Soft delete APENAS para QR codes e usuários. Votos e assembleias NUNCA deletados.

**Por quê:**
- Votos: auditoria legal requer imutabilidade
- Assembleias: histórico é crítico
- QR codes: podem ser reativados se necessário
- Usuários: compliance (LGPD) pode requerer soft delete

---

### Trade-off 3: Normalização vs Denormalização

**Decisão:** Snapshot pattern para assembly_units (denormalização controlada)

**Por quê:**
- assembly_units é snapshot imutável no momento da importação CSV
- Mudanças posteriores em condominiums não afetam assembleia passada
- Trade-off: duplicação de dados vs integridade histórica

**Normalização estrita aplicada em:**
- Relacionamentos dinâmicos (qr_code_assignments)
- Entidades que mudam frequentemente (users)

---

### Trade-off 4: Server-Side vs Client-Side Rendering

**Decisão:** Client-Side Rendering (SPA)

**Por quê:**
- Não precisa SEO (app privado, atrás de login)
- Interatividade é mais importante que first paint
- SSR adiciona complexidade sem benefício claro

**Quando SSR faria sentido:**
- Landing page pública (futuro)
- Blog/conteúdo (futuro)

---

### Trade-off 5: Invalidação vs Deleção de Votos

**Decisão:** Invalidação (flag is_valid=FALSE)

**Por quê:**
- Auditoria: precisa saber que voto existiu e foi invalidado
- Compliance: histórico completo de operações
- Debug: facilita investigar problemas

**Alternativa rejeitada:**
- DELETE: perde histórico, não permite auditoria

---

## 2.6 Princípios de Design

### Imutabilidade Seletiva

**Imutável:**
- Votos (apenas invalidação)
- Assembleias finalizadas
- Snapshots de unidades

**Mutável:**
- Condomínios (nome, endereço)
- Usuários (senha, nome)
- QR codes (status ativo/inativo)

### Fail-Safe Defaults

- Voto não enviado? Retry 3x antes de erro
- SSE desconectado? Reconecta automaticamente
- Query sem tenant_id? Erro explícito (nunca retorna dados de outros tenants)

### Progressive Enhancement

- Funciona sem JavaScript? ❌ (É um SPA)
- Funciona offline? ❌ (Requer conexão para votar)
- Graceful degradation: SSE fallback para polling se necessário

---

[Voltar ao Índice](README.md)
