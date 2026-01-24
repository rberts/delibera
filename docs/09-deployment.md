# 9. Deployment

**Status:** ✅ Completo

---

## 9.1 Visão Geral

**Plataformas:**
- Frontend: Vercel
- Backend: Render
- Database: Neon (PostgreSQL serverless)

**Por quê:**
- Free tiers generosos para MVP
- Setup simples, zero config complexa
- Scaling automático quando precisar
- CI/CD via Git (push to deploy)

---

## 9.2 Database (Neon)

### 9.2.1 Setup Inicial

**1. Criar conta:**
- Acesse https://neon.tech
- Signup com GitHub

**2. Criar projeto:**
```
Project name: assembly-voting
Region: US East (Ohio) ou São Paulo (se disponível)
PostgreSQL version: 14
```

**3. Obter connection string:**
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**4. Configurar no backend `.env`:**
```bash
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

### 9.2.2 Migrations em Produção

**Executar migrations:**

```bash
# Localmente (apontando para Neon)
DATABASE_URL=postgresql://... poetry run alembic upgrade head

# Ou via Render (veja seção 9.3.3)
```

**Rollback (se necessário):**
```bash
DATABASE_URL=postgresql://... poetry run alembic downgrade -1
```

**⚠️ IMPORTANTE:**
- Sempre testar migrations em staging primeiro
- Fazer backup antes de migrations destrutivas
- Neon tem backups automáticos (Point-in-Time Recovery)

---

### 9.2.3 Neon Free Tier Limits

```
Storage: 0.5 GB
Data transfer: 3 GB/month
Compute: Shared, auto-suspend após inatividade
Branches: 10 (útil para staging)
```

**Quando escalar:**
- Storage > 400 MB → considerar paid tier ($19/mês)
- Transfer > 2.5 GB/mês → considerar paid tier
- Latência importante → upgrade para dedicated compute

---

### 9.2.4 Branches (Staging)

**Criar branch para staging:**

```bash
# Via Neon console ou CLI
neon branches create --name staging --parent main

# Obter connection string do staging
neon connection-string staging
```

**Uso:**
- `main` branch → production
- `staging` branch → testes antes de prod
- `dev-*` branches → features em desenvolvimento

---

## 9.3 Backend (Render)

### 9.3.1 Setup Inicial

**1. Criar conta:**
- Acesse https://render.com
- Signup com GitHub

**2. Criar Web Service:**
```
Repository: seu-usuario/delibera
Branch: main
Root Directory: api
Environment: Python 3
Region: Oregon (US West) ou mais próximo
Instance Type: Free
```

**3. Build & Start Commands:**

```yaml
# Build Command:
pip install poetry && poetry config virtualenvs.create false && poetry install --no-dev

# Start Command:
poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

### 9.3.2 Environment Variables

**No Render Dashboard → Environment:**

```bash
# Database
DATABASE_URL=<Neon connection string>

# JWT
SECRET_KEY=<openssl rand -hex 32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=https://assembly-voting.vercel.app,https://www.yourdomain.com

# Environment
ENVIRONMENT=production

# Optional: Sentry
SENTRY_DSN=https://...
```

**⚠️ IMPORTANTE:**
- Usar SECRET_KEY diferente de desenvolvimento
- Nunca commitar secrets no Git
- Atualizar CORS_ORIGINS com domínio real do frontend

---

### 9.3.3 Migrations via Render

**Opção A: Deploy Hook (recomendado)**

Adicionar script `migrate.sh`:

```bash
#!/bin/bash
set -e
poetry run alembic upgrade head
```

**No Render:**
- Settings → Deploy → Deploy hook
- Executar `./migrate.sh` antes do deploy

**Opção B: Manual**

```bash
# Via Render Shell
poetry run alembic upgrade head
```

---

### 9.3.4 Render Free Tier Limits

```
Hours: 750h/month (suficiente para 1 service 24/7)
Memory: 512 MB RAM
Auto-sleep: Após 15min inatividade
Cold start: ~30s para acordar
```

**Limitações:**
- Sleep após inatividade → primeira request lenta
- 512 MB RAM → suficiente para MVP, monitorar uso

**Quando escalar:**
- Cold starts inaceitáveis → Starter ($7/mês, sem sleep)
- Memória >400 MB → Standard ($25/mês, 2 GB RAM)
- Múltiplos services → Team plan

---

### 9.3.5 Health Checks

**Adicionar endpoint:**

```python
# app/main.py
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }
```

**Configurar no Render:**
- Settings → Health Check Path: `/api/health`
- Render pingará endpoint e auto-restart se falhar

---

## 9.4 Frontend (Vercel)

### 9.4.1 Setup Inicial

**1. Criar conta:**
- Acesse https://vercel.com
- Signup com GitHub

**2. Import Project:**
```
Repository: seu-usuario/delibera
Framework Preset: Vite
Root Directory: web
Build Command: pnpm build
Output Directory: dist
Install Command: pnpm install
```

**3. Deploy automático:**
- Push to `main` → deploy production
- Pull Requests → deploy preview

---

### 9.4.2 Environment Variables

**No Vercel Dashboard → Settings → Environment Variables:**

```bash
# API URL (Render backend)
VITE_API_URL=https://assembly-voting-api.onrender.com

# Optional: Analytics
VITE_ANALYTICS_ID=...

# Optional: Sentry
VITE_SENTRY_DSN=...
```

**⚠️ IMPORTANTE:**
- Variáveis devem começar com `VITE_`
- Configurar para Production, Preview, e Development

---

### 9.4.3 Custom Domain (Opcional)

**Adicionar domínio customizado:**

1. Vercel Dashboard → Settings → Domains
2. Adicionar domínio: `app.yourdomain.com`
3. Configurar DNS (Vercel fornece instruções)
4. HTTPS automático via Let's Encrypt

**Atualizar CORS no backend:**
```bash
CORS_ORIGINS=https://app.yourdomain.com
```

---

### 9.4.4 Vercel Free Tier Limits

```
Bandwidth: 100 GB/month
Build time: 100 hours/month
Serverless Function Execution: 100 GB-hours/month
Deployments: Unlimited
```

**Suficiente para:**
- ~10.000 usuários ativos/mês
- Builds ilimitados
- Preview deployments ilimitados

**Quando escalar:**
- Bandwidth > 90 GB → Pro ($20/mês, 1 TB)
- Multiple team members → Pro plan

---

### 9.4.5 Build Optimization

**`vite.config.ts` (produção):**

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
```

**Resultados esperados:**
- Initial load: < 500 KB
- Lazy loaded routes: < 200 KB each
- First Contentful Paint: < 2s

---

## 9.5 CI/CD Pipelines Completos

### 9.5.1 Backend Pipeline

**`.github/workflows/backend-deploy.yml`:**

```yaml
name: Backend Deploy

on:
  push:
    branches: [main]
    paths:
      - "api/**"
      - ".github/workflows/backend-deploy.yml"

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: api
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install Poetry
        run: |
          curl -sSL https://install.python-poetry.org | python3 -
      
      - name: Install dependencies
        run: poetry install
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/postgres
        run: poetry run pytest --cov
      
      - name: Coverage check
        run: poetry run pytest --cov --cov-fail-under=60
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

**Setup:**
1. Render → Settings → Deploy Hook → Copy URL
2. GitHub → Settings → Secrets → Add `RENDER_DEPLOY_HOOK`

---

### 9.5.2 Frontend Pipeline

**`.github/workflows/frontend-deploy.yml`:**

```yaml
name: Frontend Deploy

on:
  push:
    branches: [main]
    paths:
      - "web/**"
      - ".github/workflows/frontend-deploy.yml"
  pull_request:
    branches: [main]
    paths:
      - "web/**"
      - ".github/workflows/frontend-deploy.yml"

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test --coverage
      
      - name: Build
        run: pnpm build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
  
  deploy:
    needs: test
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    
    steps:
      - name: Vercel Deploy
        run: echo "Vercel auto-deploys via Git integration"
```

**Nota:** Vercel auto-deploys quando conectado via Git. GitHub Action é opcional.

---

## 9.6 Monitoring & Logs

### 9.6.1 Backend Logs (Render)

**Acessar logs:**
- Render Dashboard → Logs
- Logs em tempo real durante deploy e runtime

**Structured logging:**

```python
# app/main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Status: {response.status_code}")
    return response
```

---

### 9.6.2 Frontend Logs (Vercel)

**Acessar logs:**
- Vercel Dashboard → Logs
- Real-time function logs (se usar serverless functions)

**Error tracking (Sentry - opcional):**

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react'

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
  })
}
```

---

### 9.6.3 Database Monitoring (Neon)

**Neon Console:**
- Metrics: CPU, Memory, Storage
- Query performance
- Connection pooling stats

**Alertas (opcional):**
- Storage > 80% → email
- Queries lentas > 1s → log

---

## 9.7 Backup & Recovery

### 9.7.1 Database Backups

**Neon:**
- Backups automáticos (Point-in-Time Recovery)
- Retention: 7 dias (free tier)
- Restore: via Neon Console ou CLI

**Manual backup:**
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20241231.sql
```

---

### 9.7.2 Code Backups

**Git como source of truth:**
- Código sempre no GitHub
- Tags para releases: `v1.0.0`, `v1.1.0`
- Branches de ambiente: `main`, `staging`

---

## 9.8 Rollback Strategy

### 9.8.1 Backend Rollback

**Via Render:**
1. Dashboard → Deploys
2. Selecionar deploy anterior
3. "Rollback to this deploy"

**Via Git:**
```bash
git revert <commit-hash>
git push origin main  # Trigger new deploy
```

---

### 9.8.2 Frontend Rollback

**Via Vercel:**
1. Dashboard → Deployments
2. Selecionar deployment anterior
3. "Promote to Production"

**Instantâneo:** < 10 segundos

---

### 9.8.3 Database Rollback

**Migration rollback:**
```bash
DATABASE_URL=... poetry run alembic downgrade -1
```

**Data rollback (Point-in-Time):**
- Neon Console → Restore
- Escolher timestamp
- Restaura para branch novo (não sobrescreve prod)

---

## 9.9 Performance & Scaling

### 9.9.1 Current Limits (Free Tiers)

```
Frontend (Vercel):
  - 100 GB bandwidth/month
  - Cold start: ~200ms
  
Backend (Render):
  - 512 MB RAM
  - Cold start: ~30s (após 15min inatividade)
  
Database (Neon):
  - 0.5 GB storage
  - 3 GB transfer/month
  - Auto-suspend após inatividade
```

**Capacidade estimada (MVP):**
- ~50 assembleias/mês
- ~500 votos/assembleia
- ~10 usuários simultâneos

---

### 9.9.2 Scaling Path

**Quando escalar:**

**Frontend:**
- Bandwidth > 90 GB → Vercel Pro ($20/mês)

**Backend:**
- Cold starts problemáticos → Render Starter ($7/mês, sem sleep)
- RAM > 400 MB → Render Standard ($25/mês, 2 GB)

**Database:**
- Storage > 400 MB → Neon Pro ($19/mês, 10 GB)
- Query performance → Connection pooling (PgBouncer)

---

### 9.9.3 Otimizações Rápidas

**Backend:**
- Connection pooling: SQLAlchemy default pool size = 5
- Query optimization: adicionar índices (veja Seção 5)
- Caching: Redis para sessions (se necessário)

**Frontend:**
- Code splitting: `React.lazy()` para rotas
- Image optimization: WebP, lazy loading
- Bundle size: remover dependencies não usadas

**Database:**
- Vacuum regularmente: `VACUUM ANALYZE`
- Índices em foreign keys: já incluídos (Seção 5)

---

## 9.10 Security Checklist

**Antes de production:**

- [ ] SECRET_KEY único e forte (não reusar de dev)
- [ ] CORS configurado com domínios corretos
- [ ] HTTPS enforced (Vercel/Render fazem automaticamente)
- [ ] Environment variables não committadas no Git
- [ ] Database com acesso restrito (Neon firewall)
- [ ] Logs não expõem dados sensíveis (senhas, tokens)
- [ ] Rate limiting configurado (Render tem básico built-in)
- [ ] SQL injection prevenido (SQLAlchemy parametriza queries)
- [ ] XSS prevenido (React escapa por padrão)
- [ ] CSRF prevenido (httpOnly cookies + SameSite)

---

## 9.11 Deployment Checklist

**Backend (Render):**
- [ ] Repositório conectado
- [ ] Build command correto
- [ ] Start command correto
- [ ] Environment variables configuradas
- [ ] Database connection string válida
- [ ] Health check endpoint funcionando
- [ ] Migrations executadas
- [ ] Logs acessíveis

**Frontend (Vercel):**
- [ ] Repositório conectado
- [ ] Build command correto (pnpm build)
- [ ] Output directory correto (dist)
- [ ] Environment variables configuradas
- [ ] API_URL apontando para Render
- [ ] Preview deploys funcionando
- [ ] Custom domain configurado (opcional)

**Database (Neon):**
- [ ] Projeto criado
- [ ] Connection string obtida
- [ ] Migrations executadas
- [ ] Backup automático ativo
- [ ] Staging branch criada (opcional)

---

[Voltar ao Índice](README.md)
