# 4. Setup do Ambiente de Desenvolvimento

**Status:** ✅ Completo

---

## 4.1 Pré-requisitos

### Sistema Operacional

**Recomendado:**
- macOS 12+ ou Linux (Ubuntu 22.04+)
- Windows 11 com WSL2 (Ubuntu)

**Nota:** Windows nativo pode ter problemas com WeasyPrint (PDFs). Use WSL2.

---

### Ferramentas Essenciais

**Node.js & pnpm (Frontend):**
```bash
# Node.js 18+ (use nvm para gerenciar versões)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# pnpm
npm install -g pnpm
pnpm --version  # Deve mostrar 8.x+
```

**Python & Poetry (Backend):**
```bash
# Python 3.11+ (use pyenv para gerenciar versões)
curl https://pyenv.run | bash
pyenv install 3.11.7
pyenv global 3.11.7
python --version  # Deve mostrar 3.11.7

# Poetry
curl -sSL https://install.python-poetry.org | python3 -
poetry --version  # Deve mostrar 1.7.x+
```

**PostgreSQL 14+:**

**Option A: Local install**
```bash
# macOS (Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu
sudo apt update
sudo apt install postgresql-14 postgresql-contrib-14
sudo systemctl start postgresql
```

**Option B: Docker (Recomendado)**
```bash
# Veja seção 4.2
```

**Git:**
```bash
# Já instalado na maioria dos sistemas
git --version  # Deve mostrar 2.x+
```

---

## 4.2 Docker Setup (Opcional mas Recomendado)

**Docker Compose para Database:**

Crie `api/docker-compose.yml` na raiz do backend:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: assembly_voting_db
    environment:
      POSTGRES_USER: assembly_user
      POSTGRES_PASSWORD: assembly_pass
      POSTGRES_DB: assembly_voting
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U assembly_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

**Comandos:**
```bash
cd api

# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f postgres

# Access psql
docker exec -it assembly_voting_db psql -U assembly_user -d assembly_voting
```

**Vantagens do Docker:**
- Setup rápido, consistente entre devs
- Não "polui" sistema local
- Fácil de resetar (docker-compose down -v)

---

## 4.3 Setup Backend

### 1. Clone e Install

```bash
# Se ja clonou no setup do backend, pule o clone e va para `cd web`
git clone https://github.com/seu-usuario/delibera.git
cd delibera
cd api

# Install dependencies
poetry install

# Activate virtualenv
poetry shell
```

### 2. Variáveis de Ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite `.env`:

```bash
# Database
DATABASE_URL=postgresql://assembly_user:assembly_pass@localhost:5432/assembly_voting

# JWT
SECRET_KEY=sua-chave-secreta-aqui-use-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Environment
ENVIRONMENT=development
```

**Gerar SECRET_KEY:**
```bash
openssl rand -hex 32
```

### 3. Database Setup

```bash
# Create database (if not using Docker)
createdb assembly_voting

# Run migrations
poetry run alembic upgrade head

# Seed initial data (opcional)
poetry run python -m app.seed
```

### 4. Run Backend

```bash
# Development mode (hot reload)
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Backend rodando em: http://localhost:8000
# Docs disponíveis em: http://localhost:8000/docs
```

### 5. Verify Setup

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Expected response:
{"status": "ok", "version": "1.0.0"}
```

---

## 4.4 Setup Frontend

### 1. Clone e Install

```bash
git clone https://github.com/seu-usuario/delibera.git
cd delibera

# Frontend
cd web

# Install dependencies
pnpm install
```

### 2. Shadcn/ui Setup

```bash
# Init shadcn/ui com preset customizado (Maia + Cyan)
pnpm dlx shadcn@latest create \
  --preset "https://ui.shadcn.com/init?base=radix&style=maia&baseColor=gray&theme=cyan&iconLibrary=lucide&font=noto-sans&menuAccent=bold&menuColor=default&radius=default&template=vite" \
  --template vite

# Adicionar componentes necessários
pnpm dlx shadcn@latest add button dialog toast form input label \
  select checkbox table card badge skeleton alert tabs separator \
  dropdown-menu calendar popover
```

### 3. Variáveis de Ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite `.env`:

```bash
# API URL (backend)
VITE_API_URL=http://localhost:8000
```

### 4. Generate TypeScript Types

Com backend rodando:

```bash
# Gera types automáticos do OpenAPI
pnpm run generate:types

# Cria: src/types/api.ts
```

**Nota:** No scaffold atual do `web/`, o script `generate:types` ainda nao existe; adiciona-lo quando a integracao com a API for iniciada.

### 5. Run Frontend

```bash
# Development mode (hot reload)
pnpm dev

# Frontend rodando em: http://localhost:5173
```

### 6. Verify Setup

- Abra http://localhost:5173
- Deve mostrar tela de login
- Tente fazer login (com dados seed se disponível)

---

## 4.5 Scripts Úteis

### Backend Scripts

Adicione ao `pyproject.toml`:

```toml
[tool.poetry.scripts]
dev = "uvicorn app.main:app --reload"
migrate = "alembic upgrade head"
migrate-down = "alembic downgrade -1"
seed = "python -m app.seed"
test = "pytest"
format = "black app tests && isort app tests"
```

**Uso:**
```bash
poetry run dev         # Start dev server
poetry run migrate     # Run migrations
poetry run seed        # Seed database
poetry run test        # Run tests
poetry run format      # Format code
```

### Frontend Scripts

Já incluídos no `package.json`:

```bash
pnpm dev               # Start dev server
pnpm build             # Build for production
pnpm preview           # Preview production build
pnpm test              # Run tests
pnpm test:ui           # Run tests with UI
pnpm lint              # Lint code
pnpm generate:types    # Generate API types
```

---

## 4.6 Database Management

### Create Migration

```bash
cd api

# Auto-generate migration (detecta mudanças nos models)
poetry run alembic revision --autogenerate -m "add new column"

# Manual migration
poetry run alembic revision -m "manual change"
```

### Apply Migrations

```bash
# Upgrade to latest
poetry run alembic upgrade head

# Downgrade one version
poetry run alembic downgrade -1

# View current version
poetry run alembic current

# View history
poetry run alembic history
```

### Seed Data (Exemplo)

Crie `app/seed.py`:

```python
"""
Seed database with initial data.
"""
from app.database import SessionLocal
from app.features.auth.service import create_user
from app.features.tenants.service import create_tenant

def seed():
    db = SessionLocal()
    
    try:
        # Create tenant
        tenant = create_tenant(db, {
            "name": "Demo Administradora",
            "email": "admin@demo.com"
        })
        
        # Create admin user
        create_user(db, {
            "tenant_id": tenant.id,
            "name": "Admin Demo",
            "email": "admin@demo.com",
            "password": "admin123",
            "role": "property_manager"
        })
        
        print("✓ Seed completed successfully")
        
    except Exception as e:
        print(f"✗ Seed failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
```

**Run:**
```bash
poetry run python -m app.seed
```

---

## 4.7 Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'app'`

**Solution:**
```bash
# Certifique-se de estar no virtualenv
poetry shell

# Reinstale dependencies
poetry install
```

---

**Problem:** `psycopg2.OperationalError: could not connect to server`

**Solution:**
```bash
# Verifique se PostgreSQL está rodando
docker-compose ps  # ou
pg_isctl status

# Verifique DATABASE_URL no .env
echo $DATABASE_URL
```

---

**Problem:** WeasyPrint fails on macOS

**Solution:**
```bash
# Install system dependencies
brew install cairo pango gdk-pixbuf libffi
```

---

### Frontend Issues

**Problem:** `Module not found: Can't resolve '@/...'`

**Solution:**
```bash
# Verifique tsconfig.json paths
# Restart dev server
pnpm dev
```

---

**Problem:** Shadcn/ui components not found

**Solution:**
```bash
# Reinstalar componente
pnpm dlx shadcn@latest add button

# Verifique components.json
cat components.json
```

---

**Problem:** API calls fail with CORS error

**Solution:**
```bash
# No backend .env, adicione frontend origin
CORS_ORIGINS=http://localhost:5173

# Restart backend
poetry run dev
```

---

## 4.8 IDE Setup (Opcional)

### VS Code Extensions Recomendadas

**Frontend:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

**Backend:**
- Python
- Pylance
- Black Formatter
- SQLAlchemy support

**Both:**
- GitLens
- Error Lens
- Better Comments

### VS Code Settings

Crie `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  },
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 4.9 Checklist de Setup Completo

**Backend:**
- [ ] Python 3.11+ instalado
- [ ] Poetry instalado
- [ ] PostgreSQL rodando (local ou Docker)
- [ ] Dependencies instaladas (`poetry install`)
- [ ] `.env` configurado
- [ ] Migrations aplicadas (`alembic upgrade head`)
- [ ] Seed data criado (opcional)
- [ ] Backend rodando em http://localhost:8000
- [ ] Docs acessíveis em http://localhost:8000/docs

**Frontend:**
- [ ] Node.js 18+ instalado
- [ ] pnpm instalado
- [ ] Dependencies instaladas (`pnpm install`)
- [ ] Shadcn/ui inicializado
- [ ] `.env` configurado
- [ ] Types gerados (`pnpm run generate:types`)
- [ ] Frontend rodando em http://localhost:5173
- [ ] Consegue fazer login

**Integração:**
- [ ] Frontend consegue chamar backend APIs
- [ ] CORS configurado corretamente
- [ ] SSE funciona (testar operator dashboard)

---

[Voltar ao Índice](README.md)
