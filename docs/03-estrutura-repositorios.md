# 3. Estrutura dos Repositórios

**Status:** ✅ Completo

---

## 3.1 Multi-repo vs Monorepo

**Decisão:** Monorepo (um repositório com subprojetos)

```
delibera/
├── api/     (Python/FastAPI)
├── web/     (React/TypeScript)
├── docs/
├── plans/
└── .github/
    └── workflows/
```

**Status atual:** `api/`, `web/`, `docs/`, `plans/` ja existem; a pasta `.github/workflows` ainda sera adicionada durante a configuracao de CI/CD.

**Justificativa:**

✅ **Onboarding mais simples:**
- Um clone para backend + frontend
- Menos contexto trocado durante desenvolvimento

✅ **Mudanças coordenadas:**
- API e UI evoluem no mesmo PR
- Revisoes mais consistentes entre camadas

✅ **CI/CD direcionado por paths:**
- Workflows filtram `api/**` e `web/**`
- Deploy separado por subdiretorio

❌ **Desvantagens aceitas:**
- Deploy independente exige configuracao por subdiretorio
- Pipelines ficam um pouco mais complexos
- Repo cresce com o tempo

**Quando multi-repo faria sentido:**
- Times independentes com releases desacopladas
- Regras de acesso/seguranca separadas
- Necessidade forte de isolamento entre stacks

---

## 3.2 Frontend (Web)

**Diretorio:** `web/`

### Estrutura Completa

```
web/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component
│   ├── index.css                   # Global styles + Tailwind
│   │
│   ├── components/                 # Shared components
│   │   ├── ui/                     # Shadcn/ui (gerados)
│   │   ├── layout/                 # Header, Sidebar, Layout
│   │   ├── ProtectedRoute.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── features/                   # Feature modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   └── stores/
│   │   ├── condominiums/
│   │   ├── assemblies/
│   │   ├── qr-codes/
│   │   ├── agendas/
│   │   ├── voting/
│   │   ├── checkin/
│   │   ├── operator/
│   │   └── reports/
│   │
│   ├── hooks/                      # Global hooks
│   │   ├── useSSE.ts
│   │   ├── useRealtimeAssembly.ts
│   │   ├── useDebounce.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── lib/                        # Utilities
│   │   ├── api-client.ts
│   │   ├── query-client.ts
│   │   ├── router.tsx
│   │   ├── utils.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   └── types/                      # TypeScript types
│       ├── api.ts                  # Auto-generated
│       └── index.ts
│
├── tests/
│   ├── setup.ts
│   └── features/
│       ├── auth/
│       └── voting/
│
├── .env.example
├── .eslintrc.cjs
├── .gitignore
├── components.json                 # Shadcn/ui config
├── index.html
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json                     # Vercel config
└── vite.config.ts
```

### Convenções

**Nomenclatura:**
- Componentes: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Types: `PascalCase` (interfaces e types)

**Imports:**
- Alias `@/` para `src/`
- Imports absolutos, não relativos
- Exemplo: `import { Button } from '@/components/ui/button'`

**Feature modules:**
- Cada feature é self-contained
- Structure: `components/`, `pages/`, `hooks/`, `stores/`
- Exports via index.ts quando apropriado

---

## 3.3 Backend (API)

**Diretorio:** `api/`

### Estrutura Completa

```
api/
├── app/
│   ├── main.py                     # FastAPI application
│   ├── config.py                   # Settings (Pydantic)
│   ├── database.py                 # SQLAlchemy engine
│   ├── dependencies.py             # Dependency injection
│   │
│   ├── core/
│   │   ├── security.py             # JWT, password hashing
│   │   ├── tenancy.py              # Tenant isolation
│   │   └── exceptions.py           # Custom exceptions
│   │
│   ├── features/                   # Feature modules
│   │   ├── auth/
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── service.py
│   │   │   └── router.py
│   │   ├── condominiums/
│   │   ├── assemblies/
│   │   ├── users/
│   │   ├── qr_codes/
│   │   ├── agendas/
│   │   ├── voting/
│   │   ├── checkin/
│   │   ├── realtime/
│   │   └── reports/
│   │
│   └── templates/                  # Jinja2 templates (PDFs)
│       ├── attendance_list.html
│       ├── agenda_results.html
│       └── final_report.html
│
├── alembic/
│   ├── versions/                   # Migration files
│   ├── env.py
│   ├── script.py.mako
│   └── README.md
│
├── tests/
│   ├── conftest.py                 # Pytest fixtures
│   └── features/
│       ├── test_auth.py
│       ├── test_voting.py
│       └── test_csv_import.py
│
├── .env.example
├── .gitignore
├── alembic.ini
├── pyproject.toml                  # Poetry dependencies
├── poetry.lock
├── pytest.ini
├── README.md
└── render.yaml                     # Render config
```

### Convenções

**Nomenclatura:**
- Files: `snake_case.py`
- Classes: `PascalCase`
- Functions/variables: `snake_case`
- Constants: `UPPER_SNAKE_CASE`

**Feature modules:**
- Pattern: models → schemas → service → router
- `models.py`: SQLAlchemy models
- `schemas.py`: Pydantic schemas (request/response)
- `service.py`: Business logic
- `router.py`: FastAPI routes

**Imports:**
- Absolute imports: `from app.features.auth import schemas`
- Relative imports apenas dentro do mesmo feature module

**Dependency Injection:**
```python
from app.dependencies import get_current_user, get_db

@router.get("/")
async def list_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ...
```

---

## 3.4 Convenções Compartilhadas

### Git Workflow

**Branches:**
- `main`: production-ready code
- `develop`: integration branch
- `feature/*`: feature branches
- `fix/*`: bugfix branches

**Commits:**
- Conventional Commits format
- Exemplos:
  - `feat(voting): add vote invalidation`
  - `fix(auth): correct JWT expiration`
  - `docs(readme): update setup instructions`

**Pull Requests:**
- Squash merge para `main`
- Pelo menos 1 approval (ou self-merge para solo dev)
- CI deve passar antes de merge

---

### CI/CD Strategy

**Frontend (Vercel):**
```yaml
# .github/workflows/frontend-deploy.yml
name: Deploy Frontend
on:
  push:
    branches: [main]
    paths:
      - "web/**"
      - ".github/workflows/frontend-deploy.yml"
jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm build
      # Vercel auto-deploy via Git integration
```

**Backend (Render):**
```yaml
# api/render.yaml
services:
  - type: web
    name: assembly-voting-api
    env: python
    buildCommand: "pip install poetry && poetry install"
    startCommand: "poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: DATABASE_URL
        sync: false
```

---

### Environment Variables

**Frontend (`.env`):**
```bash
VITE_API_URL=http://localhost:8000
```

**Backend (`.env`):**
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/assembly_voting
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
```

**Nota:** Variáveis sensíveis (SECRET_KEY, DATABASE_URL) devem estar em `.env.example` como placeholders, nunca committadas.

---

### Code Quality

**Frontend:**
- ESLint + Prettier
- TypeScript strict mode
- Husky pre-commit hooks (opcional)

**Backend:**
- Black (formatter)
- isort (import sorting)
- mypy (type checking - opcional)
- pylint (linting - opcional)

**Ambos:**
- Tests antes de merge
- Coverage mínimo: ~60% para MVP

---

### Documentation

**README.md (monorepo e subprojetos):**
```markdown
# Delibera (Monorepo)

## Quick Start
[Setup instructions]

## Development
[Run locally]

## Testing
[How to run tests]

## Deploy
[How to deploy]

## Tech Stack
[List of technologies]
```

**Inline comments:**
- Docstrings para funções públicas
- Comments apenas quando código não é self-explanatory
- Evitar comentários óbvios

---

## 3.5 Dependency Management

### Frontend (pnpm)

**Por que pnpm:**
- Mais rápido que npm
- Disk space efficient (symlinks)
- Strict (não hoista dependencies automaticamente)

```bash
# Install
pnpm install

# Add dependency
pnpm add react-hook-form

# Add dev dependency
pnpm add -D vitest

# Update
pnpm update
```

### Backend (Poetry)

**Por que Poetry:**
- Resolve dependencies corretamente
- Lock file determinístico
- Gerencia virtualenvs automaticamente

```bash
# Install
poetry install

# Add dependency
poetry add fastapi

# Add dev dependency
poetry add -D pytest

# Update
poetry update
```

---

[Voltar ao Índice](README.md)
