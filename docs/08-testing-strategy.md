# 8. Testing Strategy

**Status:** ✅ Completo

---

## 8.1 Visão Geral

**Objetivo:** Garantir qualidade do código com cobertura de testes focada em features críticas, sem overhead excessivo para MVP.

**Princípio:** "Test what matters" - priorizar features críticas (voting, auth, multi-tenancy) sobre features simples (CRUD básico).

**Cobertura alvo:**
- Backend: ~60% (foco em voting, auth, CSV, tenancy)
- Frontend: ~60% (foco em voting, auth, check-in)
- E2E: Fluxos críticos apenas (login → vote → results)

---

## 8.2 Backend Testing (Python/FastAPI)

### 8.2.1 Stack de Testes

**Pytest + SQLAlchemy + TestClient**

```python
# pyproject.toml
[tool.poetry.dependencies]
pytest = "^7.4.0"
pytest-cov = "^4.1.0"
pytest-asyncio = "^0.21.0"
httpx = "^0.24.0"  # For TestClient
faker = "^19.0.0"  # Test data generation
```

---

### 8.2.2 Fixtures Globais

**`tests/conftest.py`:**

```python
"""
Global test fixtures.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db
from app.features.tenants.service import create_tenant
from app.features.auth.service import create_user

# In-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def sample_tenant(db_session):
    """Create sample tenant."""
    return create_tenant(db_session, {
        "name": "Test Administradora",
        "email": "test@example.com"
    })

@pytest.fixture
def sample_user(db_session, sample_tenant):
    """Create sample user."""
    return create_user(db_session, {
        "tenant_id": sample_tenant.id,
        "name": "Test User",
        "email": "user@test.com",
        "password": "test123",
        "role": "property_manager"
    })

@pytest.fixture
def auth_headers(client, sample_user):
    """Get authentication headers."""
    response = client.post("/api/v1/auth/login", json={
        "email": "user@test.com",
        "password": "test123"
    })
    # Extract token from cookie
    cookies = response.cookies
    return {"Cookie": f"access_token={cookies['access_token']}"}
```

---

### 8.2.3 Estrutura de Testes Backend

```
tests/
├── conftest.py                     # Global fixtures
│
├── unit/                           # Unit tests (isolated)
│   ├── test_security.py            # Password hashing, JWT
│   ├── test_validators.py          # CPF/CNPJ validation
│   └── test_formatters.py          # Date, number formatting
│
├── integration/                    # Integration tests (with DB)
│   ├── test_auth.py                # Login, logout, /me
│   ├── test_condominiums.py        # CRUD operations
│   ├── test_assemblies.py          # Assembly lifecycle
│   ├── test_voting.py              # Vote casting, results
│   ├── test_checkin.py             # QR assignment, attendance
│   ├── test_csv_import.py          # CSV validation, import
│   └── test_tenancy.py             # Tenant isolation
│
└── e2e/                            # End-to-end tests
    └── test_assembly_flow.py       # Complete assembly flow
```

---

### 8.2.4 Exemplo: Unit Test (Security)

```python
"""
tests/unit/test_security.py
"""
from app.core.security import hash_password, verify_password, create_access_token

def test_password_hashing():
    password = "mypassword123"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_creation():
    data = {"user_id": 1, "tenant_id": 1}
    token = create_access_token(data)
    
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 20
```

---

### 8.2.5 Exemplo: Integration Test (Voting)

```python
"""
tests/integration/test_voting.py
"""
import pytest

def test_cast_vote_success(client, db_session, auth_headers, sample_tenant):
    # Setup: Create condominium, assembly, agenda, QR code, assignment
    # (Usar fixtures ou helper functions)
    
    condominium = create_test_condominium(db_session, sample_tenant.id)
    assembly = create_test_assembly(db_session, condominium.id)
    agenda = create_test_agenda(db_session, assembly.id, status="open")
    option = agenda.options[0]
    qr_code = create_test_qr_code(db_session, sample_tenant.id)
    assignment = assign_qr_to_assembly(db_session, qr_code.id, assembly.id, [unit.id])
    
    # Action: Cast vote
    response = client.post("/api/v1/voting/vote", json={
        "qr_token": qr_code.token,
        "agenda_id": agenda.id,
        "option_id": option.id
    })
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

def test_cast_vote_duplicate_fails(client, db_session, auth_headers):
    # Setup (same as above)
    # Cast vote once
    client.post("/api/v1/voting/vote", json={...})
    
    # Try to vote again
    response = client.post("/api/v1/voting/vote", json={...})
    
    # Assert: Should fail with 400
    assert response.status_code == 400
    assert "already voted" in response.json()["detail"].lower()

def test_tenant_isolation(client, db_session):
    # Create two tenants with assemblies
    tenant1 = create_tenant(db_session, {...})
    tenant2 = create_tenant(db_session, {...})
    
    assembly1 = create_assembly(db_session, tenant1.id, {...})
    assembly2 = create_assembly(db_session, tenant2.id, {...})
    
    # Login as tenant1 user
    auth_headers = login_as(client, tenant1_user)
    
    # Try to access tenant2's assembly
    response = client.get(f"/api/v1/assemblies/{assembly2.id}", headers=auth_headers)
    
    # Assert: Should fail with 404 or 403
    assert response.status_code in [403, 404]
```

---

### 8.2.6 Exemplo: E2E Test (Complete Flow)

```python
"""
tests/e2e/test_assembly_flow.py
"""
def test_complete_assembly_flow(client, db_session, auth_headers, sample_tenant):
    """Test complete assembly flow: create → check-in → vote → results."""
    
    # 1. Create condominium
    response = client.post("/api/v1/condominiums", json={
        "name": "Test Condo",
        "address": "Test Address"
    }, headers=auth_headers)
    condominium_id = response.json()["id"]
    
    # 2. Create assembly
    response = client.post("/api/v1/assemblies", json={
        "condominium_id": condominium_id,
        "title": "Test Assembly",
        "assembly_date": "2024-12-31T10:00:00",
        "assembly_type": "ordinary"
    }, headers=auth_headers)
    assembly_id = response.json()["id"]
    
    # 3. Import units via CSV
    csv_data = "unit_number,owner_name,owner_cpf,ideal_fraction\n101,John Doe,12345678901,10.5"
    response = client.post(
        f"/api/v1/assemblies/{assembly_id}/units/import",
        files={"file": ("units.csv", csv_data, "text/csv")},
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # 4. Create agenda
    response = client.post(f"/api/v1/assemblies/{assembly_id}/agendas", json={
        "title": "Test Agenda",
        "options": [
            {"option_text": "Yes", "display_order": 1},
            {"option_text": "No", "display_order": 2}
        ]
    }, headers=auth_headers)
    agenda_id = response.json()["id"]
    
    # 5. Generate QR codes
    response = client.post("/api/v1/qr-codes/generate", json={
        "quantity": 1
    }, headers=auth_headers)
    qr_code = response.json()["qr_codes"][0]
    
    # 6. Check-in (assign QR to units)
    response = client.post(f"/api/v1/assemblies/{assembly_id}/checkin", json={
        "qr_code_id": qr_code["id"],
        "unit_ids": [1],  # Unit created from CSV
        "is_proxy": False
    }, headers=auth_headers)
    assert response.status_code == 200
    
    # 7. Open agenda
    response = client.post(
        f"/api/v1/assemblies/{assembly_id}/agendas/{agenda_id}/open",
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # 8. Cast vote
    response = client.post("/api/v1/voting/vote", json={
        "qr_token": qr_code["token"],
        "agenda_id": agenda_id,
        "option_id": 1  # "Yes" option
    })
    assert response.status_code == 200
    
    # 9. Get results
    response = client.get(
        f"/api/v1/assemblies/{assembly_id}/agendas/{agenda_id}/results",
        headers=auth_headers
    )
    assert response.status_code == 200
    results = response.json()
    assert results["results"][0]["vote_count"] == 1
```

---

### 8.2.7 Coverage Configuration

**`pytest.ini`:**

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --cov=app
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=60
```

**Run tests:**
```bash
# All tests with coverage
poetry run pytest

# Specific test file
poetry run pytest tests/integration/test_voting.py

# With verbose output
poetry run pytest -v

# Watch mode (pytest-watch)
poetry run ptw
```

---

## 8.3 Frontend Testing (React/TypeScript)

### 8.3.1 Stack de Testes

**Vitest + Testing Library + MSW**

```json
{
  "devDependencies": {
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0",
    "@testing-library/user-event": "^14.5.2",
    "msw": "^2.0.0"
  }
}
```

---

### 8.3.2 Estrutura de Testes Frontend

```
tests/
├── setup.ts                        # Global setup
├── mocks/
│   └── handlers.ts                 # MSW API mocks
│
├── unit/
│   ├── hooks/
│   │   ├── useAuth.test.ts
│   │   └── useDebounce.test.ts
│   ├── utils/
│   │   ├── formatters.test.ts
│   │   └── validators.test.ts
│
├── integration/
│   ├── features/
│   │   ├── auth/
│   │   │   └── LoginPage.test.tsx
│   │   ├── voting/
│   │   │   └── VotingPage.test.tsx
│   │   └── checkin/
│   │       └── CheckinPage.test.tsx
│
└── e2e/                            # Playwright (opcional)
    └── assembly-flow.spec.ts
```

---

### 8.3.3 MSW Setup (API Mocking)

**`tests/mocks/handlers.ts`:**

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json()
    if (body.email === 'test@example.com' && body.password === 'test123') {
      return HttpResponse.json({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'property_manager'
      })
    }
    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
  }),
  
  // Voting status
  http.get('/api/v1/voting/status/:token', ({ params }) => {
    return HttpResponse.json({
      assembly: { id: 1, title: 'Test Assembly', status: 'in_progress' },
      agenda: { id: 1, title: 'Test Agenda', options: [
        { id: 1, option_text: 'Yes' },
        { id: 2, option_text: 'No' }
      ]},
      units: [{ id: 1, unit_number: '101', owner_name: 'John' }],
      has_voted: false
    })
  }),
  
  // Cast vote
  http.post('/api/v1/voting/vote', () => {
    return HttpResponse.json({ success: true })
  })
]
```

**`tests/setup.ts`:**

```typescript
import { afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'
import '@testing-library/jest-dom'

// Setup MSW server
export const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
```

---

### 8.3.4 Exemplo: Component Test

```typescript
/**
 * tests/integration/features/voting/VotingPage.test.tsx
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import VotingPage from '@/features/voting/pages/VotingPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})

const Wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={['/vote/test-token']}>
      {children}
    </MemoryRouter>
  </QueryClientProvider>
)

describe('VotingPage', () => {
  it('displays voting options', async () => {
    render(<VotingPage />, { wrapper: Wrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Test Assembly')).toBeInTheDocument()
      expect(screen.getByText('Yes')).toBeInTheDocument()
      expect(screen.getByText('No')).toBeInTheDocument()
    })
  })
  
  it('submits vote successfully', async () => {
    const user = userEvent.setup()
    render(<VotingPage />, { wrapper: Wrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Yes')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('Yes'))
    await user.click(screen.getByRole('button', { name: /submit/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/vote recorded/i)).toBeInTheDocument()
    })
  })
})
```

---

## 8.4 E2E Testing (Opcional)

**Playwright (se tempo permitir):**

```typescript
// tests/e2e/assembly-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete assembly flow', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173/login')
  await page.fill('[name="email"]', 'admin@demo.com')
  await page.fill('[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  
  // Create assembly
  await page.goto('http://localhost:5173/assemblies/new')
  await page.fill('[name="title"]', 'Test Assembly')
  await page.click('button[type="submit"]')
  
  // ... more steps
  
  expect(await page.textContent('h1')).toBe('Test Assembly')
})
```

**Nota:** E2E tests são opcionais para MVP. Priorizar unit e integration tests.

---

## 8.5 CI/CD Integration (GitHub Actions)

### 8.5.1 Backend CI

**`.github/workflows/backend-tests.yml`:**

```yaml
name: Backend Tests

on:
  push:
    branches: [main, develop]
    paths:
      - "api/**"
      - ".github/workflows/backend-tests.yml"
  pull_request:
    branches: [main, develop]
    paths:
      - "api/**"
      - ".github/workflows/backend-tests.yml"

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
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install Poetry
        run: |
          curl -sSL https://install.python-poetry.org | python3 -
          echo "$HOME/.local/bin" >> $GITHUB_PATH
      
      - name: Install dependencies
        run: poetry install
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          SECRET_KEY: test-secret-key
        run: poetry run pytest --cov --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
```

---

### 8.5.2 Frontend CI

**`.github/workflows/frontend-tests.yml`:**

```yaml
name: Frontend Tests

on:
  push:
    branches: [main, develop]
    paths:
      - "web/**"
      - ".github/workflows/frontend-tests.yml"
  pull_request:
    branches: [main, develop]
    paths:
      - "web/**"
      - ".github/workflows/frontend-tests.yml"

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
```

---

## 8.6 Test Data Management

### 8.6.1 Faker para Dados de Teste

```python
# tests/factories.py
from faker import Faker
from app.features.condominiums.models import Condominium
from app.features.assemblies.models import Assembly

fake = Faker('pt_BR')  # Portuguese locale

def create_test_condominium(db, tenant_id):
    condo = Condominium(
        tenant_id=tenant_id,
        name=fake.company(),
        address=fake.address()
    )
    db.add(condo)
    db.commit()
    db.refresh(condo)
    return condo

def create_test_assembly(db, condominium_id):
    assembly = Assembly(
        condominium_id=condominium_id,
        title=f"Assembly {fake.word()}",
        assembly_date=fake.future_datetime(),
        assembly_type="ordinary",
        status="draft"
    )
    db.add(assembly)
    db.commit()
    db.refresh(assembly)
    return assembly
```

---

## 8.7 Estratégia de Coverage

### Features Críticas (Alta Prioridade)

**Backend:**
- ✅ Auth (login, JWT, permissions) - 90%+
- ✅ Voting (cast, invalidate, results) - 90%+
- ✅ Tenant isolation - 100%
- ✅ CSV import/validation - 80%+
- ✅ Quorum calculation - 90%+

**Frontend:**
- ✅ Auth flow (login, protected routes) - 80%+
- ✅ Voting interface - 80%+
- ✅ Check-in workflow - 70%+

### Features Médias (Média Prioridade)

**Backend:**
- CRUD operations - 60%
- PDF generation - 50% (visual tests complexos)
- SSE - 50% (integration tests)

**Frontend:**
- CRUD forms - 60%
- Operator dashboard - 50%
- SSE integration - 40%

### Features Simples (Baixa Prioridade)

- Formatters/validators - 70% (unit tests rápidos)
- Utils - 60%
- UI components - 30% (baixo risco)

---

## 8.8 Comandos Úteis

### Backend

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov

# Run specific test
poetry run pytest tests/integration/test_voting.py::test_cast_vote

# Watch mode
poetry run ptw

# Generate HTML coverage report
poetry run pytest --cov --cov-report=html
open htmlcov/index.html
```

### Frontend

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Watch mode
pnpm test --watch

# UI mode
pnpm test --ui

# Specific test file
pnpm test VotingPage.test.tsx
```

---

## 8.9 Checklist de Testing

**Antes de cada PR:**
- [ ] Todos os testes passam localmente
- [ ] Coverage não diminuiu
- [ ] Novos features têm testes
- [ ] Features críticas têm >=80% coverage
- [ ] CI está verde

**Antes de deploy:**
- [ ] E2E tests passam (se implementados)
- [ ] Smoke tests em staging
- [ ] Performance tests (se aplicável)

---

[Voltar ao Índice](README.md)
