# Plano de Implementação Frontend - Delibera

## Contexto

Sistema de votação para assembleias condominiais com QR codes, check-in e real-time updates.

**Backend**: ✅ Completo (FastAPI, JWT auth, SSE, 22 endpoints em `/api/v1`)
**Frontend**: 🚧 Em implementação (Vite + React 19 + Shadcn UI)

## Stack Tecnológico

- React 19 + TypeScript (strict)
- Vite 7 + Tailwind CSS 4
- Shadcn/ui (componentes instalados)
- React Router v6 (routing)
- TanStack Query v5 (data fetching)
- Zustand v4 (auth state)
- React Hook Form + Zod (forms)
- html5-qrcode + qrcode.react (QR)
- SSE para real-time
- Sonner (toast notifications)

## Arquitetura

Feature-based structure em `src/features/`:
- `auth/` - Login, useAuth, auth-store
- `condominiums/` - CRUD condomínios
- `assemblies/` - CRUD assembleias + workflow
- `qr-codes/` - Geração + listagem
- `agendas/` - Pautas + opções
- `voting/` - Interface pública (QR token)
- `checkin/` - Scanner QR + check-in
- `operator/` - Dashboard real-time (SSE)
- `reports/` - Download PDF/CSV
- `dashboard/` - Página inicial

---

## STATUS DE IMPLEMENTAÇÃO

### ✅ FASE 0: Preparação (CONCLUÍDA)

**Dependências Instaladas:**
- Runtime: react-router-dom, @tanstack/react-query, zustand, react-hook-form, zod, html5-qrcode, qrcode.react, date-fns
- Dev/Testing: vitest, @testing-library/react, @testing-library/jest-dom, jsdom
- Shadcn: skeleton, tabs, dialog, checkbox, popover, sonner, input, label, select, form, table, badge, card

**Estrutura de Pastas Criada:**
```
src/
├── features/{auth,condominiums,assemblies,qr-codes,agendas,voting,checkin,operator,reports,dashboard}/
│   └── {components,pages,hooks,stores}/
├── components/layout/
├── hooks/
├── lib/
└── types/
```

**Configuração:**
- `.env` com `VITE_API_URL=http://localhost:8000`
- `.gitignore` atualizado
- Scripts de teste no package.json

**Commit Sugerido:**
```bash
chore(web): configurar ambiente frontend com dependências e estrutura

- Instalar dependências runtime (react-router, tanstack-query, zustand, RHF, zod, QR libs)
- Instalar dependências de teste (vitest, testing-library)
- Adicionar componentes shadcn (skeleton, tabs, dialog, forms, table, sonner)
- Criar estrutura de pastas features/ (auth, condominiums, assemblies, etc)
- Configurar .env com VITE_API_URL=http://localhost:8000
- Adicionar scripts de teste no package.json
- Revisar .gitignore (coverage, cache, env files, OS files)
```

---

### ✅ FASE 1: Foundation - Core Infrastructure (CONCLUÍDA)

**Arquivos Implementados:**

1. **API Client** (`src/lib/api-client.ts`)
   - Fetch wrapper com `credentials: 'include'`
   - Classe `APIError` para erros tipados
   - Helper methods: `api.get()`, `api.post()`, `api.put()`, `api.patch()`, `api.delete()`
   - Suporte a query params

2. **TypeScript Types** (`src/types/api.ts`)
   - `UserResponse`: id, email, name, role, tenant_id
   - `LoginRequest`: email, password
   - `CondominiumResponse`, `AssemblyResponse`, `UnitResponse`
   - `QRCodeResponse`, `AgendaResponse`, `VotingSessionResponse`
   - `PaginatedResponse<T>`, `SSEEvent`

3. **TanStack Query Config** (`src/lib/query-client.ts`)
   - staleTime: 5min, gcTime: 30min
   - Retry 3x com backoff exponencial (não retry em 4xx)
   - refetchOnWindowFocus: false

4. **Auth Store** (`src/features/auth/stores/auth-store.ts`)
   - Zustand com persist no localStorage
   - State: `user`, `isAuthenticated`
   - Actions: `setUser()`, `clearAuth()`

5. **Auth Hook** (`src/features/auth/hooks/useAuth.ts`)
   - `useLogin()` - Mutation com JSON { email, password }
   - `useLogout()` - Mutation com limpeza de cache
   - `useMe()` - Query para `/api/v1/auth/me`
   - Hook consolidado `useAuth()`

6. **Login Page** (`src/features/auth/pages/LoginPage.tsx`)
   - React Hook Form + Zod validation
   - Validação: email válido + senha mínimo 6 chars
   - Toast notifications via Sonner
   - Redirect para `/dashboard` após login

7. **Protected Route** (`src/components/ProtectedRoute.tsx`)
   - Verifica `isAuthenticated`
   - Skeleton loading durante carregamento
   - Redirect para `/login` se não autenticado

8. **Router** (`src/lib/router.tsx`)
   - Rotas públicas: `/login`, `/vote/:token`
   - Rotas protegidas: `/dashboard`, `/condominiums/*`, `/assemblies/*`, `/qr-codes`
   - Stub pages para rotas futuras
   - 404 page

9. **Layout Components**
   - `Layout.tsx` - Container com Sidebar + Header + Outlet
   - `Header.tsx` - Logo + User dropdown com logout
   - `Sidebar.tsx` - Nav links (Dashboard, Condomínios, Assembleias, QR Codes)

10. **Main Entry Point** (`src/main.tsx`)
    - QueryClientProvider, RouterProvider, Toaster, ReactQueryDevtools

11. **Dashboard Stub** (`src/features/dashboard/pages/DashboardPage.tsx`)
    - Cards de estatísticas (mock)

**Critérios de Aceitação:**
- ✅ Login funcional com credenciais reais (JSON format)
- ✅ JWT em cookie httpOnly (backend configurado)
- ✅ Redirect para `/dashboard` após login
- ✅ Logout limpa estado e redireciona
- ✅ Protected routes bloqueiam acesso sem auth
- ✅ DevTools do React Query visível

**Correções Aplicadas:**
- ✅ Types `UserResponse` corrigidos para corresponder ao backend (name, role, tenant_id)
- ✅ LoginRequest usa `email` (não `username`)
- ✅ Header usa `user?.name` (não `user?.full_name`)

**Commit Sugerido:**
```bash
feat(web): implementar autenticação e infraestrutura core

- Criar API client com fetch wrapper e credentials include
- Adicionar types TypeScript para todas entidades da API
- Configurar TanStack Query com retry e cache strategies
- Implementar auth store (Zustand) com persist em localStorage
- Criar hooks de auth (login, logout, me) com React Query
- Adicionar login page com React Hook Form e Zod validation
- Implementar protected routes com redirect automático
- Configurar router com rotas públicas e protegidas
- Criar layout principal (Header + Sidebar + Content)
- Adicionar dashboard stub com cards de estatísticas
- Integrar Sonner para toast notifications
- Adicionar React Query DevTools

Ref: SPEC 7.3, 7.4
```

**Pendências Fase 1:**
- ⚠️ Confirmar credenciais de teste do backend (demo@admin.com / qwe123?)
- ⚠️ Testar login end-to-end após backend estar rodando

---

## FASE 2: CRUD Condominiums (PENDENTE)

### Objetivo
Implementar CRUD completo como pattern replicável.

### Arquivos a Implementar

**1. Hooks** (`src/features/condominiums/hooks/useCondominiums.ts`)
- `useCondominiums(page, pageSize)` - GET lista paginada
- `useCondominium(id)` - GET single
- `useCreateCondominium()` - POST mutation
- `useUpdateCondominium(id)` - PUT mutation
- `useDeleteCondominium()` - DELETE mutation
- Toast notifications + invalidate cache
- Ref: SPEC 7.5.1

**2. List Page** (`src/features/condominiums/pages/CondominiumsList.tsx`)
- Table: Nome, Endereço, Ações
- Skeleton loading, paginação
- Delete confirmation dialog
- "New Condominium" button
- Ref: SPEC 7.5.2

**3. Form Page** (`src/features/condominiums/pages/CondominiumForm.tsx`)
- Reutilizável create/edit (detectar via `id` param)
- Campos: name, address (RHF + Zod)
- Loading state, redirect após sucesso
- Ref: SPEC 7.5.3

**4. Router Update** (`src/lib/router.tsx`)
- Adicionar rotas lazy: `/condominiums`, `/condominiums/new`, `/condominiums/:id/edit`

### Critérios de Aceitação
- ✅ Criar condomínio → aparece na lista
- ✅ Editar → dados persistem
- ✅ Deletar → confirmação + remove da lista
- ✅ Paginação funciona

---

## FASE 3: Assemblies CRUD + Workflow (PENDENTE)

### Objetivo
CRUD com workflow de status (draft → in_progress → finished).

### Arquivos a Implementar

**1. Hooks** (`src/features/assemblies/hooks/useAssemblies.ts`)
- Mesmo pattern de condominiums
- **Adicional**: `useStartAssembly(id)`, `useFinishAssembly(id)` (POST workflow)

**2. List Page** (`src/features/assemblies/pages/AssembliesList.tsx`)
- Status badges: draft (gray), in_progress (blue), finished (green)
- Filtro por status

**3. Form Page** (`src/features/assemblies/pages/AssemblyForm.tsx`)
- Campos: title, condominium (select), scheduled_date (calendar)
- Select usa `useCondominiums()` para opções

**4. Details Page** (`src/features/assemblies/pages/AssemblyDetails.tsx`)
- Info da assembleia
- Workflow buttons: "Start Assembly", "Finish Assembly" (condicionais)
- Tabs: Overview, Agendas (stub), Units (stub)
- Link para `/assemblies/:id/operate` (operator dashboard)

**5. Router Update**
- Rotas: `/assemblies`, `/assemblies/new`, `/assemblies/:id`, `/assemblies/:id/edit`

### Critérios de Aceitação
- ✅ Criar assembleia vinculada a condomínio
- ✅ Workflow: draft → Start → in_progress → Finish → finished
- ✅ Status badge atualiza
- ✅ Details page mostra dados corretos

---

## FASE 4: QR Codes (PENDENTE)

### Arquivos a Implementar

**1. Hooks** (`src/features/qr-codes/hooks/useQRCodes.ts`)
- `useQRCodes(assemblyId?)` - lista
- `useGenerateQRCodes()` - POST lote

**2. List Page** (`src/features/qr-codes/pages/QRCodesList.tsx`)
- Grid de QR codes (visual_number, status)
- Renderizar com `<QRCodeSVG value={token} />` (qrcode.react)
- Download PNG individual
- "Generate QR Codes" button → dialog

**3. Generate Dialog** (`src/features/qr-codes/components/GenerateQRDialog.tsx`)
- Select assembleia + input quantidade (1-100)

### Critérios de Aceitação
- ✅ Gerar lote de 10 QR codes
- ✅ Ver lista com visual numbers (001-010)
- ✅ Download PNG funciona

---

## FASE 5: Voting - Interface Pública (PENDENTE)

### Objetivo
Interface mobile-first para votação via QR token (sem auth).

### Arquivos a Implementar

**1. Hooks** (`src/features/voting/hooks/useVoting.ts`)
- `useVotingSession(token)` - GET assembly via token
- `useCastVote(token)` - POST vote com retry 3x

**2. Voting Page** (`src/features/voting/pages/VotingPage.tsx`)
- Mobile-first design
- Estados:
  - Loading: skeleton
  - Aguardando: "Assembly not started"
  - Votação aberta: lista agendas + radio options
  - Já votou: "Your vote has been recorded"
  - Finalizada: "Assembly finished"
- Polling 5s para updates
- Ref: SPEC 7.7

**3. Vote Card Component** (`src/features/voting/components/VoteCard.tsx`)
- Card de agenda com radio group de opções

**4. Router Update**
- Rota pública: `/vote/:token`

### Critérios de Aceitação
- ✅ Acesso via `/vote/:token` sem auth
- ✅ Estados corretos conforme status
- ✅ Votar persiste
- ✅ "Já votou" bloqueia novo voto

---

## FASE 6: Check-in Interface (PENDENTE)

### Objetivo
QR scanner + seleção de unidades + lista de presença.

### Arquivos a Implementar

**1. Hooks** (`src/features/checkin/hooks/useCheckin.ts`)
- `useUnits(assemblyId)` - lista unidades disponíveis
- `useAssignQRCode()` - POST check-in
- `useAttendanceList(assemblyId)` - GET presença

**2. QR Scanner Component** (`src/features/checkin/components/QRScanner.tsx`)
- Usar `html5-qrcode` library
- Request camera (rear preferred)
- Callback `onScan(token)`

**3. Unit Selector Component** (`src/features/checkin/components/UnitSelector.tsx`)
- Checkboxes de unidades (agrupadas por owner)
- "Select all by owner" shortcut
- Checkbox "This is a proxy"

**4. Attendance List Component** (`src/features/checkin/components/AttendanceList.tsx`)
- Lista de presença com QR visual number
- Unidades associadas + proxy indicator
- Real-time updates (polling 5s)

**5. Check-in Page** (`src/features/checkin/pages/CheckinPage.tsx`)
- Assembly selector (dropdown)
- QR Scanner (collapsible)
- Manual token input (fallback)
- Unit selector (após scan)
- Attendance list + quorum indicator (progress bar 50%)
- Ref: SPEC 7.8

**6. Router Update**
- Rota: `/assemblies/:id/checkin`

### Critérios de Aceitação
- ✅ Scanner lê QR code (testar com device real ou simulador)
- ✅ Selecionar unidades + confirmar
- ✅ Attendance list atualiza
- ✅ Quorum indicator sobe

---

## FASE 7: Operator Dashboard - Real-time (PENDENTE)

### Objetivo
Dashboard com SSE para updates real-time.

### Arquivos a Implementar

**1. SSE Hook** (`src/hooks/useSSE.ts`)
- Generic SSE hook
- Auto-reconnect (3s delay)
- Event handler callbacks
- Cleanup on unmount
- Ref: SPEC 7.10

**2. Realtime Assembly Hook** (`src/hooks/useRealtimeAssembly.ts`)
- Wrapper de useSSE
- Invalidar TanStack Query cache em eventos
- Event types: `vote_update`, `checkin_update`, `agenda_update`, `heartbeat`

**3. Agenda Control Tab** (`src/features/operator/components/AgendaControl.tsx`)
- Lista agendas com status badges
- Buttons: "Open Agenda", "Close Agenda"
- Workflow: apenas 1 agenda aberta por vez

**4. Vote Monitor Tab** (`src/features/operator/components/VoteMonitor.tsx`)
- Resultados por agenda (lista ou gráfico simples)
- Pending votes count
- "Invalidate vote" button
- Real-time updates via SSE

**5. Quorum Indicator Component** (`src/features/operator/components/QuorumIndicator.tsx`)
- Progress bar (50% threshold)
- Cor: red < 50%, green >= 50%

**6. Operator Dashboard Page** (`src/features/operator/pages/OperatorDashboard.tsx`)
- Assembly header (título, data, status)
- Tabs: Agenda Control, Vote Monitor, Attendance
- SSE connection indicator
- Ref: SPEC 7.9

**7. Router Update**
- Rota: `/assemblies/:id/operate`

### Critérios de Aceitação
- ✅ Abrir agenda → botão vira "Close Agenda"
- ✅ Votar em outra aba → Vote Monitor atualiza automaticamente (SSE)
- ✅ Check-in → Attendance tab atualiza
- ✅ Quorum indicator muda cor ao atingir 50%

---

## FASE 8: Agendas CRUD (PENDENTE)

### Objetivo
CRUD de pautas com opções aninhadas.

### Arquivos a Implementar

**1. Hooks** (`src/features/agendas/hooks/useAgendas.ts`)
- `useAgendas(assemblyId)`
- `useCreateAgenda()` - inclui nested options
- `useUpdateAgenda(id)`, `useDeleteAgenda()`

**2. Agenda Form** (`src/features/agendas/pages/AgendaForm.tsx`)
- Campos: title, description
- Dynamic options array (useFieldArray do RHF)
- Add/Remove option buttons

**3. Integrar em Assembly Details**
- Modificar `src/features/assemblies/pages/AssemblyDetails.tsx`
- Tab "Agendas" mostra lista
- "Add Agenda" button

### Critérios de Aceitação
- ✅ Criar agenda com 2-3 opções
- ✅ Ver agendas em Assembly Details
- ✅ Votar nas opções funciona

---

## FASE 9: Reports & Polish (PENDENTE)

### Arquivos a Implementar

**1. Reports Hooks** (`src/features/reports/hooks/useReports.ts`)
- `useDownloadAttendancePDF(assemblyId)`
- `useDownloadAgendaResults(agendaId)`
- `useDownloadFinalReport(assemblyId)`
- Trigger download via blob URL

**2. Report Download Buttons** (`src/features/reports/components/ReportDownload.tsx`)
- 3 buttons com loading states
- Integrar em Assembly Details page

**3. Error Boundary** (`src/components/ErrorBoundary.tsx`)
- Catch React errors + display message + reload button

**4. Polish**
- Revisar todas pages: skeleton loading, empty states, toast notifications
- Garantir mobile responsive em voting e check-in

### Critérios de Aceitação
- ✅ Download de PDFs funciona
- ✅ Sidebar navegação fluida
- ✅ Todos loading states implementados

---

## FASE 10: Testing & Deployment (PENDENTE)

### Setup Vitest

**1. Configurar**
- Atualizar `vite.config.ts` com vitest
- Criar `tests/setup.ts`

**2. Tests Críticos**
- `tests/features/auth/LoginPage.test.tsx`
  - Renderiza form, validação, submit
- `tests/features/voting/VotingPage.test.tsx`
  - Estados, submit voto
- `tests/hooks/useAuth.test.ts`
  - Login mutation, logout

**Meta**: 30-40% coverage (prioridade auth + voting)

### Build & Deploy

**Build**:
```bash
cd /Users/robertsantos/www/delibera/web
pnpm build
```

**Deploy Vercel**:
- Root Directory: `web`
- Build: `pnpm build`
- Output: `dist`
- Env: `VITE_API_URL=https://api-delibera.onrender.com`

### Critérios de Aceitação
- ✅ Testes passando (`pnpm test`)
- ✅ Build produção sem erros
- ✅ Deploy Vercel automático
- ✅ Smoke test completo (checklist no plano original)

---

## Verificação End-to-End (Smoke Test Produção)

### Checklist Completo

1. **Auth**
   - [ ] Login com credenciais reais
   - [ ] Redirect para dashboard
   - [ ] Logout funciona

2. **Condominiums**
   - [ ] Criar condomínio "Edifício Teste"
   - [ ] Ver na lista
   - [ ] Editar nome
   - [ ] Deletar (confirmar dialog)

3. **Assemblies**
   - [ ] Criar assembleia vinculada ao condomínio
   - [ ] Status = draft
   - [ ] Clicar "Start Assembly" → status = in_progress
   - [ ] Ver em details page

4. **QR Codes**
   - [ ] Gerar 5 QR codes para assembleia
   - [ ] Ver lista com números 001-005
   - [ ] Download PNG de um QR code
   - [ ] Abrir PNG e verificar QR válido

5. **Agendas**
   - [ ] Criar agenda "Aprovação de contas" com 3 opções: Aprovar, Rejeitar, Abstencão
   - [ ] Ver agenda em Assembly Details

6. **Check-in**
   - [ ] Acessar `/assemblies/:id/checkin`
   - [ ] Scanner QR code (usar device real ou input manual)
   - [ ] Selecionar 2 unidades
   - [ ] Confirmar check-in
   - [ ] Ver attendance list atualizar
   - [ ] Quorum indicator subir

7. **Voting (Mobile)**
   - [ ] Abrir `/vote/:token` em mobile (copiar token do QR)
   - [ ] Ver agendas disponíveis
   - [ ] Votar em uma opção
   - [ ] Ver mensagem "Your vote has been recorded"
   - [ ] Tentar votar novamente → bloqueado

8. **Operator Dashboard**
   - [ ] Acessar `/assemblies/:id/operate`
   - [ ] Tab "Agenda Control": abrir agenda criada
   - [ ] Tab "Vote Monitor": ver resultado do voto (1 voto na opção escolhida)
   - [ ] Em outra aba/device: votar novamente
   - [ ] Vote Monitor atualiza automaticamente (SSE)
   - [ ] Tab "Attendance": ver quorum indicator
   - [ ] Fechar agenda

9. **Reports**
   - [ ] Download PDF de presença
   - [ ] Download PDF de resultados da agenda
   - [ ] Abrir PDFs e verificar dados corretos

10. **Finalização**
    - [ ] Voltar para Assembly Details
    - [ ] Clicar "Finish Assembly" → status = finished
    - [ ] Tentar votar novamente → bloqueado (assembleia finalizada)

---

## Riscos e Mitigações

### Risco 1: html5-qrcode não funciona em produção HTTPS
**Mitigação**: Testar em Vercel preview na Fase 6. Fallback: input manual sempre disponível.

### Risco 2: SSE não suportado em Render free tier
**Mitigação**: Implementar fallback polling 5s (já previsto). Feature degrada gracefully.

### Risco 3: Types do backend desatualizados
**Mitigação**: Gerar via openapi-typescript quando backend disponível. Usar types manuais temporariamente.

---

## Dependências e Ordem de Execução

**Bloqueantes**:
- Fase 0 → bloqueia todas
- Fase 1 → bloqueia features (2-9)
- Fases 2-6 → podem ser parcialmente paralelizadas após Fase 1
- Fase 7 → depende de 4-6 (QR, voting, check-in)
- Fase 10 → última (testing + deploy)

**Sequencial Recomendada**: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

---

## Estimativa

**Solo Developer**: 26-30 dias (5-6 semanas)
**Com Claude Code**: 16-20 dias (3-4 semanas) - assumindo 40% aceleração em CRUD/boilerplate

---

## Arquivos Mais Críticos

1. `/Users/robertsantos/www/delibera/web/src/lib/api-client.ts` - Base de toda comunicação
2. `/Users/robertsantos/www/delibera/web/src/features/auth/hooks/useAuth.ts` - Core auth
3. `/Users/robertsantos/www/delibera/web/src/lib/router.tsx` - Toda navegação
4. `/Users/robertsantos/www/delibera/web/src/features/voting/pages/VotingPage.tsx` - Interface pública principal
5. `/Users/robertsantos/www/delibera/web/src/hooks/useSSE.ts` - Real-time (diferencial)

---

## Notas de Implementação

### Backend API Schema Confirmado

**Auth Endpoints:**
- POST `/api/v1/auth/login`
  - Request: `{ email: string, password: string }` (JSON)
  - Response: `{ id, email, name, role, tenant_id }` + httpOnly cookies
  - Cookies: `access_token`, `refresh_token`

**User Response:**
```typescript
{
  id: number;
  email: string;
  name: string;        // ← Não é "full_name"
  role: string;        // ← admin, user, etc
  tenant_id: number;   // ← Multi-tenancy
}
```

### CORS Configuration
Backend `.env` formato correto:
```env
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
ALLOWED_HOSTS=["*"]
```

⚠️ **NÃO** usar formato CSV - Pydantic espera JSON array como string.

### Credenciais de Teste
- Email: `demo@admin.com` (a confirmar)
- Senha: `qwe123` (a confirmar)
- ⚠️ Verificar se usuário existe no banco antes de testar login

---

## Próximos Passos Imediatos

1. ✅ Fase 0 concluída
2. ✅ Fase 1 concluída (aguardando validação de login)
3. ⏳ Confirmar credenciais de teste do backend
4. ⏳ Testar login end-to-end
5. 🔜 Iniciar Fase 2: CRUD Condominiums

---

## Referências

- SPEC: `/Users/robertsantos/www/delibera/docs/07-frontend-implementation.md`
- Backend: `/Users/robertsantos/www/delibera/api`
- Frontend: `/Users/robertsantos/www/delibera/web`
- Plano original fornecido pelo usuário em 2026-01-25
