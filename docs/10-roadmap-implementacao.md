# 10. Roadmap de Implementação

**Status:** ✅ Completo

---

## 10.1 Princípios de Implementação

**Abordagem:** Incremental, testável, deployável em cada etapa

**Regras:**
1. **Uma feature por vez:** completar backend + frontend + testes antes de próxima
2. **Deploy frequente:** cada feature completa vai para produção
3. **Testes primeiro em críticos:** voting, auth, tenancy (TDD parcial)
4. **Vertical slices:** feature completa (DB → API → UI) antes de próxima

**Não fazer:**
- ❌ Todo backend primeiro, depois frontend
- ❌ Todas tabelas primeiro, depois lógica
- ❌ Deixar testes para o final

---

## 10.2 Fases de Implementação

### Fase 1: Foundation (Semana 1-2)
**Objetivo:** Setup inicial, auth, CRUD básico funcionando

### Fase 2: Core Voting (Semana 3-4)
**Objetivo:** Votação completa e funcional

### Fase 3: Real-time & Reports (Semana 5-6)
**Objetivo:** SSE, PDFs, polimento

---

## 10.3 Ordem Tática File-by-File

---

### FASE 1: FOUNDATION

---

#### **Milestone 1.1: Setup Inicial** (2-3 dias)

**Backend:**
```bash
1. Criar repositorio monorepo: delibera
2. Criar pasta `api/` e inicializar Poetry:
   mkdir api
   cd api
   poetry init
   poetry add fastapi uvicorn sqlalchemy alembic psycopg2-binary pydantic[email] python-jose passlib bcrypt python-multipart
   
3. Estrutura de pastas (seguir Seção 3.3)
   
4. Criar arquivos base:
   - app/main.py (FastAPI app básico)
   - app/config.py (Settings com Pydantic)
   - app/database.py (SQLAlchemy engine)
   - .env.example
   - .gitignore
   - README.md
   
5. Testar: uvicorn app.main:app --reload
   → http://localhost:8000/docs deve funcionar
```

**Frontend:**
```bash
1. Criar pasta `web/` no monorepo
2. Inicializar Vite:
   pnpm create vite web --template react-ts
   cd web
   
3. Instalar dependências core:
   pnpm add react-router-dom @tanstack/react-query zustand
   pnpm add react-hook-form zod @hookform/resolvers
   pnpm add tailwindcss postcss autoprefixer -D
   pnpm add -D vitest @testing-library/react
   
4. Configurar Tailwind:
   pnpm dlx tailwindcss init -p
   
5. Estrutura de pastas (seguir Seção 3.2)
   
6. Shadcn/ui setup (seguir Seção 7.2.6)
   
7. Testar: pnpm dev (dentro de `web/`)
   → http://localhost:5173 deve abrir
```

**Database:**
```bash
1. Setup PostgreSQL (Docker recomendado - Seção 4.2)
2. Criar database: assembly_voting
3. Inicializar Alembic:
   poetry run alembic init alembic
4. Configurar alembic.ini com DATABASE_URL
```

**✅ Checkpoint:** Ambos projetos rodando localmente

---

#### **Milestone 1.2: Database Schema** (1-2 dias)

**Seguir Seção 5 (Database Schema)**

```bash
Backend:
1. Criar app/features/tenants/models.py (Tenant model)
2. Criar app/features/users/models.py (User model)
3. Criar app/features/condominiums/models.py
4. Criar app/features/assemblies/models.py
5. Criar app/features/qr_codes/models.py
6. Criar app/features/agendas/models.py
7. Criar app/features/checkin/models.py (QRCodeAssignment, AssignedUnits)
8. Criar app/features/voting/models.py (Vote model)

# Gerar migration
poetry run alembic revision --autogenerate -m "initial schema"

# Aplicar
poetry run alembic upgrade head

# Verificar no psql
psql assembly_voting -c "\dt"
```

**✅ Checkpoint:** 10 tabelas criadas no database

---

#### **Milestone 1.3: Auth System** (2-3 dias)

**Seguir Seção 6.3 (Authentication)**

**Backend:**
```bash
1. app/core/security.py (hash_password, verify, JWT)
2. app/dependencies.py (get_current_user, get_current_tenant)
3. app/features/auth/schemas.py (LoginRequest, UserResponse)
4. app/features/auth/service.py (authenticate_user)
5. app/features/auth/router.py (login, logout, /me)
6. Integrar no app/main.py

# Testar
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'
```

**Frontend:**
```bash
Seguir Seção 7.4 (Auth & Routing):

1. src/features/auth/stores/auth-store.ts (Zustand)
2. src/features/auth/hooks/useAuth.ts
3. src/features/auth/pages/LoginPage.tsx
4. src/components/ProtectedRoute.tsx
5. src/lib/router.tsx (React Router setup)
6. src/lib/api-client.ts (fetch wrapper)
7. src/lib/query-client.ts (TanStack Query)

# Testar: login funcionando
```

**Testes:**
```bash
Backend: tests/integration/test_auth.py
Frontend: tests/integration/features/auth/LoginPage.test.tsx
```

**✅ Checkpoint:** Login funcional, JWT em cookie, rotas protegidas

---

#### **Milestone 1.4: Condominiums CRUD** (2 dias)

**Seguir Seção 6.5 + Seção 7.5**

**Backend:**
```bash
1. app/features/condominiums/schemas.py
2. app/features/condominiums/service.py
3. app/features/condominiums/router.py
4. Integrar no main.py

# Testar CRUD via /docs
```

**Frontend:**
```bash
1. src/features/condominiums/hooks/useCondominiums.ts
2. src/features/condominiums/pages/CondominiumsList.tsx
3. src/features/condominiums/pages/CondominiumForm.tsx
4. Adicionar rotas no router.tsx

# Testar: criar, listar, editar, deletar
```

**✅ Checkpoint:** CRUD completo de condomínios funcionando

---

### FASE 2: CORE VOTING

---

#### **Milestone 2.1: Assemblies & QR Codes** (2-3 dias)

**Backend:**
```bash
1. app/features/assemblies/ (seguir pattern do Condominiums)
   - schemas.py (AssemblyCreate, AssemblyResponse)
   - service.py (CRUD + start/finish)
   - router.py
   
2. app/features/qr_codes/
   - schemas.py
   - service.py (generate_batch, get_available)
   - router.py (GET list, POST generate, GET /:id/download)

# Generate QR image:
import qrcode
qr = qrcode.make(token)
qr.save(f"qr_{visual_number}.png")
```

**Frontend:**
```bash
1. src/features/assemblies/ (seguir pattern)
   - pages/AssembliesList.tsx
   - pages/AssemblyForm.tsx
   - pages/AssemblyDetails.tsx
   
2. src/features/qr-codes/
   - pages/QRCodesList.tsx
   - components/GenerateQRDialog.tsx
```

**✅ Checkpoint:** Criar assemblies, gerar QR codes

---

#### **Milestone 2.2: CSV Import** (2 dias)

**Seguir Seção 6.11 (CSV Processing)**

**Backend:**
```bash
1. app/features/assemblies/csv.py (validate_csv, parse_csv, import_csv)
2. app/features/assemblies/router.py (POST /units/preview, POST /units/import)

# Testar com CSV real
```

**Frontend:**
```bash
1. src/features/assemblies/components/CSVImport.tsx
2. src/features/assemblies/components/CSVPreview.tsx

# Testar upload + preview + import
```

**✅ Checkpoint:** Importar unidades via CSV funcionando

---

#### **Milestone 2.3: Agendas** (1-2 dias)

**Backend:**
```bash
1. app/features/agendas/schemas.py
2. app/features/agendas/service.py (create_with_options, open, close)
3. app/features/agendas/router.py

# Testar criar agenda com opções
```

**Frontend:**
```bash
1. src/features/agendas/pages/AgendaForm.tsx (com nested options)
2. src/features/agendas/components/AgendaList.tsx

# Testar criar agenda com 2-3 opções
```

**✅ Checkpoint:** Criar pautas com opções

---

#### **Milestone 2.4: Check-in System** (2-3 dias)

**Seguir Seção 6.8 + Seção 7.8**

**Backend:**
```bash
1. app/features/checkin/schemas.py
2. app/features/checkin/service.py
   - assign_qr_code()
   - unassign_qr_code()
   - get_attendance_list()
   - select_all_units_by_owner()
3. app/features/checkin/router.py

# Testar: assign QR → units
```

**Frontend:**
```bash
1. src/features/checkin/pages/CheckinPage.tsx (COMPLETO)
2. src/features/checkin/components/QRScanner.tsx
3. src/features/checkin/components/UnitSelector.tsx
4. src/features/checkin/components/AttendanceList.tsx

# Instalar: pnpm add html5-qrcode

# Testar: scan QR, select units, attendance list atualiza
```

**✅ Checkpoint:** Check-in completo funcionando

---

#### **Milestone 2.5: Voting System** (3-4 dias) **CRÍTICO**

**Seguir Seção 6.7 + Seção 7.7**

**Backend:**
```bash
1. app/features/voting/schemas.py
2. app/features/voting/service.py
   - cast_vote() (com validações + UNIQUE constraint)
   - invalidate_vote()
   - calculate_results()
   - calculate_quorum()
3. app/features/voting/router.py

# TESTAR EXTENSIVAMENTE:
# - Voto único por unit/agenda
# - Invalidação mantém histórico
# - Cálculo correto de frações
```

**Frontend:**
```bash
1. src/features/voting/pages/VotingPage.tsx (COMPLETO - público)
2. src/features/voting/components/VoteCard.tsx
3. src/features/voting/hooks/useVoting.ts (com retry 3x)

# Testar: acessar via QR code, votar, verificar "já votou"
```

**Testes:**
```bash
Backend: tests/integration/test_voting.py (COMPLETO)
Frontend: tests/integration/features/voting/VotingPage.test.tsx

# Coverage mínimo: 90% nesta feature
```

**✅ Checkpoint:** Votação completa e testada

---

### FASE 3: REAL-TIME & POLISH

---

#### **Milestone 3.1: Operator Dashboard + SSE** (3-4 dias)

**Seguir Seção 6.9 + Seção 7.9 + Seção 7.10**

**Backend:**
```bash
1. app/features/realtime/broadcaster.py (EventBroadcaster singleton)
2. app/features/realtime/router.py (GET /stream)
3. Integrar em voting/service.py (emit events)
4. Integrar em checkin/service.py (emit events)

# Testar: curl -N http://localhost:8000/api/v1/assemblies/1/stream
```

**Frontend:**
```bash
1. src/hooks/useSSE.ts (generic SSE hook)
2. src/hooks/useRealtimeAssembly.ts (integra com TanStack Query)
3. src/features/operator/pages/OperatorDashboard.tsx (COMPLETO)
4. src/features/operator/components/VoteMonitor.tsx
5. src/features/operator/components/AgendaControl.tsx
6. src/features/operator/components/QuorumIndicator.tsx

# Testar: dashboard atualiza em real-time ao votar
```

**✅ Checkpoint:** Dashboard em tempo real funcionando

---

#### **Milestone 3.2: PDF Reports** (2-3 dias)

**Seguir Seção 6.10**

**Backend:**
```bash
1. app/templates/attendance_list.html (Jinja2)
2. app/templates/agenda_results.html
3. app/templates/final_report.html

4. app/features/reports/generator.py
   - generate_attendance_pdf()
   - generate_agenda_results_pdf()
   - generate_final_report_pdf()
   
5. app/features/reports/router.py

# Instalar: poetry add weasyprint

# Testar: baixar PDFs, verificar formatação
```

**Frontend:**
```bash
1. src/features/reports/components/ReportDownload.tsx (botões)

# Testar: download PDFs após assembleia
```

**✅ Checkpoint:** Relatórios PDF gerados corretamente

---

#### **Milestone 3.3: Layout & Navigation** (1 dia)

**Seguir Seção 7.14**

**Frontend:**
```bash
1. src/components/layout/Layout.tsx
2. src/components/layout/Header.tsx
3. src/components/layout/Sidebar.tsx

# Testar: navegação entre páginas
```

**✅ Checkpoint:** UI polida e navegável

---

#### **Milestone 3.4: Testing & Coverage** (2-3 dias)

**Seguir Seção 8**

```bash
Backend:
- Completar tests/integration/ para todas features
- Target: 60% coverage mínimo
- poetry run pytest --cov

Frontend:
- Completar tests/integration/ para critical paths
- Target: 60% coverage mínimo
- pnpm test --coverage
```

**✅ Checkpoint:** Coverage atingido, testes passando

---

#### **Milestone 3.5: Deployment** (1-2 dias)

**Seguir Seção 9**

```bash
1. Neon: criar database, obter connection string
2. Render: criar web service, configurar env vars
3. Vercel: import repo, configurar env vars

4. Run migrations em produção:
   DATABASE_URL=... poetry run alembic upgrade head

5. Smoke test em produção:
   - Login
   - Criar assembleia
   - Votar
   - Verificar PDFs

6. Configurar CI/CD (Seção 9.5)
```

**✅ Checkpoint:** Aplicação em produção funcionando

---

## 10.4 Checklist de Completude

### Backend

**Foundation:**
- [ ] FastAPI app rodando
- [ ] Database com 10 tabelas
- [ ] Alembic migrations funcionando
- [ ] Auth com JWT em cookies
- [ ] Multi-tenancy isolamento testado

**Features:**
- [ ] Condominiums CRUD
- [ ] Assemblies CRUD (com status workflow)
- [ ] QR Codes generation e download
- [ ] CSV import com validação
- [ ] Agendas CRUD com options
- [ ] Check-in (assign/unassign)
- [ ] Voting (cast/invalidate)
- [ ] Results calculation
- [ ] Quorum calculation
- [ ] SSE real-time events
- [ ] PDF generation (3 tipos)

**Testing:**
- [ ] Unit tests (security, validators)
- [ ] Integration tests (auth, voting, tenancy)
- [ ] E2E test (assembly flow)
- [ ] Coverage >= 60%

---

### Frontend

**Foundation:**
- [ ] Vite app rodando
- [ ] React Router configurado
- [ ] TanStack Query setup
- [ ] Shadcn/ui inicializado
- [ ] Auth flow completo
- [ ] Protected routes funcionando

**Features:**
- [ ] Login page
- [ ] Dashboard
- [ ] Condominiums CRUD
- [ ] Assemblies CRUD
- [ ] QR Codes list + generate
- [ ] CSV import com preview
- [ ] Agendas form (nested options)
- [ ] Check-in interface (QR scanner)
- [ ] Voting page (público)
- [ ] Operator dashboard (real-time)
- [ ] Reports download

**Testing:**
- [ ] Component tests (Login, Voting)
- [ ] Hook tests (useAuth)
- [ ] Coverage >= 60%

---

### Deployment

- [ ] Neon database criada
- [ ] Render backend deployed
- [ ] Vercel frontend deployed
- [ ] Environment variables configuradas
- [ ] Migrations executadas em prod
- [ ] CORS configurado corretamente
- [ ] Health checks funcionando
- [ ] CI/CD pipelines ativos
- [ ] Smoke test em produção ok

---

## 10.5 Estimativas de Tempo

**Desenvolvimento solo:**

```
Fase 1 (Foundation): 1-2 semanas
  ├─ Setup inicial: 2-3 dias
  ├─ Database schema: 1-2 dias
  ├─ Auth system: 2-3 dias
  └─ Condominiums CRUD: 2 dias

Fase 2 (Core Voting): 2-3 semanas
  ├─ Assemblies + QR Codes: 2-3 dias
  ├─ CSV Import: 2 dias
  ├─ Agendas: 1-2 dias
  ├─ Check-in: 2-3 dias
  └─ Voting System: 3-4 dias (crítico)

Fase 3 (Real-time & Polish): 1-2 semanas
  ├─ Operator Dashboard + SSE: 3-4 dias
  ├─ PDF Reports: 2-3 dias
  ├─ Layout & Navigation: 1 dia
  ├─ Testing & Coverage: 2-3 dias
  └─ Deployment: 1-2 dias

TOTAL: 4-7 semanas (1-2 meses)
```

**Com Claude Code:**
- Reduzir ~30-40% do tempo (especialmente CRUD repetitivo)
- Focar em features críticas e review

---

## 10.6 Decisões Durante Implementação

**Se encontrar bloqueios:**

1. **Performance lenta no voting:**
   - Adicionar índice extra em votes(agenda_id, unit_id)
   - Otimizar query de results (usar agregação SQL)

2. **SSE não funciona em produção:**
   - Verificar se Render permite SSE (pode precisar upgrade)
   - Fallback para polling a cada 5s

3. **WeasyPrint falha em Render:**
   - Adicionar system dependencies no render.yaml
   - Ou usar serviço externo (DocRaptor, CloudConvert)

4. **Neon free tier estoura:**
   - Otimizar queries (menos fetches)
   - Upgrade para paid tier ($19/mês)

5. **QR scanner não funciona mobile:**
   - Verificar permissões de câmera
   - Testar html5-qrcode em HTTPS

---

## 10.7 Próximos Passos Imediatos

**Agora que o SPEC está completo:**

```
OPÇÃO A: Começar implementação (recomendado)
  1. Setup inicial (Milestone 1.1)
  2. Seguir ordem file-by-file desta seção
  3. Usar Claude Code para boilerplate
  4. Focar em quality nas features críticas

OPÇÃO B: Review do SPEC
  1. Ler Seção 5 (Database) inteira
  2. Ler Seção 6 (Backend) seções críticas
  3. Ler Seção 7 (Frontend) seções críticas
  4. Depois começar implementação

OPÇÃO C: Teste rápido
  1. Setup inicial apenas
  2. Auth + Condominiums CRUD
  3. Validar abordagem
  4. Depois continuar com resto
```

**Recomendação:** Opção A ou C. O SPEC está completo o suficiente para começar.

---

## 10.8 Referências Rápidas

**Durante implementação, consultar:**

- **Database:** Seção 5
- **Backend feature específica:** Seção 6.X
- **Frontend feature específica:** Seção 7.X
- **Testing:** Seção 8
- **Deploy issue:** Seção 9
- **Ordem:** Esta seção (10)

**Claude Code prompts efetivos:**

```
"Leia 05-database-schema.md seção 5.6.11 e implemente a tabela votes"
"Implemente conforme 06-backend-implementation.md seção 6.7 (Voting)"
"Crie o componente seguindo 07-frontend-implementation.md seção 7.7"
```

---

## 10.9 Success Metrics

**Ao final da implementação:**

✅ **Funcional:**
- Usuário consegue criar assembleia
- Condôminos conseguem votar via QR
- Operador vê resultados em tempo real
- PDFs são gerados corretamente

✅ **Técnico:**
- Testes passando (60%+ coverage)
- Deploy automático funcionando
- No critical bugs em produção

✅ **Performance:**
- Voting response < 2s
- Real-time updates < 5s latency
- PDFs gerados < 10s

---

**BOA SORTE! 🚀**

O SPEC está completo. Hora de codar!

---

[Voltar ao Índice](README.md)
