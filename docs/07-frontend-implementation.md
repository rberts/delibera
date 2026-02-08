# 7. Frontend Implementation (Feature-by-Feature)

**Status:** 🚧 Em Progresso

---

## 7.1 Project Structure

**Diretorio:** `web/` (monorepo)

**Status atual:** scaffold inicial do Vite. O `package.json` atual usa `name: "vite-app"` e scripts basicos; a estrutura detalhada abaixo e o alvo da implementacao.

```
web/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component
│   ├── index.css                   # Global styles (Tailwind)
│   │
│   ├── components/                 # Shared components
│   │   ├── ui/                     # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── features/                   # Feature modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── pages/
│   │   │   │   └── LoginPage.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   └── stores/
│   │   │       └── auth-store.ts
│   │   ├── condominiums/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   │   ├── CondominiumsList.tsx
│   │   │   │   └── CondominiumForm.tsx
│   │   │   └── hooks/
│   │   │       └── useCondominiums.ts
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
│   │   ├── useDebounce.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── lib/                        # Utilities
│   │   ├── api-client.ts           # Fetch wrapper
│   │   ├── query-client.ts         # TanStack Query config
│   │   ├── router.tsx              # React Router config
│   │   ├── utils.ts                # Helpers (cn, etc.)
│   │   ├── formatters.ts           # Date, CPF/CNPJ, etc.
│   │   └── validators.ts           # Custom validators
│   │
│   └── types/                      # TypeScript types
│       ├── api.ts                  # Auto-generated from OpenAPI
│       └── index.ts                # Custom types
│
├── tests/
│   ├── setup.ts                    # Vitest config
│   └── features/
│       └── auth/
│           └── LoginPage.test.tsx
│
├── .env.example                    # Environment variables
├── .eslintrc.cjs
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

**Descrição dos diretórios:**

- **`components/ui/`:** Componentes Shadcn/ui (gerados via CLI)
- **`components/layout/`:** Layout components (Header, Sidebar)
- **`features/`:** Feature modules (feature-based architecture, igual ao backend)
- **`hooks/`:** Custom hooks globais
- **`lib/`:** Utilitários e configurações
- **`types/`:** TypeScript types (api.ts é auto-gerado)

---

## 7.2 Setup & Configuration

### 7.2.1 `package.json` - Dependências Principais

```json
{
  "name": "assembly-voting-web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest",
    "generate:types": "openapi-typescript http://localhost:8000/api/openapi.json -o src/types/api.ts"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    
    "@tanstack/react-query": "^5.17.0",
    "@tanstack/react-table": "^8.11.0",
    
    "zustand": "^4.4.7",
    
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.3",
    
    "html5-qrcode": "^2.3.8",
    "qrcode.react": "^3.1.0",
    
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "class-variance-authority": "^0.7.0",
    
    "date-fns": "^3.0.6",
    "lucide-react": "^0.307.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11",
    
    "typescript": "^5.3.3",
    
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.33",
    "autoprefixer": "^10.4.16",
    
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0",
    "@testing-library/user-event": "^14.5.2",
    
    "openapi-typescript": "^6.7.3"
  }
}
```

---

### 7.2.2 `vite.config.ts` - Configuração Vite

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

**Notas:**
- Alias `@/` aponta para `src/`
- Proxy `/api` para backend local (desenvolvimento)

---

### 7.2.3 `tsconfig.json` - TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

### 7.2.4 `tailwind.config.js` - Tailwind CSS

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

### 7.2.5 OpenAPI → TypeScript (Script de Geração)

**Setup:**

```bash
# Instalar ferramenta
npm install -D openapi-typescript

# Adicionar script no package.json (já incluído acima)
"generate:types": "openapi-typescript http://localhost:8000/api/openapi.json -o src/types/api.ts"
```

**Uso:**

```bash
# Com backend rodando localmente
npm run generate:types

# Ou apontar para ambiente de staging
openapi-typescript https://api-staging.seuapp.com/api/openapi.json -o src/types/api.ts
```

**Resultado (exemplo):**

```typescript
// src/types/api.ts (AUTO-GERADO - NÃO EDITAR MANUALMENTE)

export interface paths {
  "/api/v1/condominiums": {
    get: operations["list_condominiums"];
    post: operations["create_condominium"];
  };
  "/api/v1/condominiums/{condominium_id}": {
    get: operations["get_condominium"];
    put: operations["update_condominium"];
    delete: operations["delete_condominium"];
  };
  // ... todas as rotas
}

export interface components {
  schemas: {
    CondominiumResponse: {
      id: number;
      tenant_id: number;
      name: string;
      address: string;
      created_at: string;
      updated_at: string;
    };
    CondominiumCreate: {
      name: string;
      address: string;
    };
    // ... todos os schemas
  };
}

export type CondominiumResponse = components["schemas"]["CondominiumResponse"];
export type CondominiumCreate = components["schemas"]["CondominiumCreate"];
// ... exports convenientes
```

**Integração com TanStack Query:**

```typescript
import type { CondominiumResponse } from '@/types/api'

// Type-safe!
const { data } = useQuery<CondominiumResponse[]>({
  queryKey: ['condominiums'],
  queryFn: fetchCondominiums
})
```

**⚠️ IMPORTANTE:**
- Rodar `npm run generate:types` sempre que backend API mudar
- Adicionar no `.gitignore`: NÃO commitar `api.ts` (gerar no CI/CD)
- Ou commitar para ter types disponíveis sem backend rodando (sua escolha)

---

### 7.2.6 Componentes Shadcn/ui Utilizados

**Instalação Inicial (com preset customizado):**

```bash
# Init shadcn/ui com preset Maia (cyan theme, Noto Sans)
pnpm dlx shadcn@latest create \
  --preset "https://ui.shadcn.com/init?base=radix&style=maia&baseColor=gray&theme=cyan&iconLibrary=lucide&font=noto-sans&menuAccent=bold&menuColor=default&radius=default&template=vite" \
  --template vite
```

**Preset customizado:**
- **Style:** Maia (design system moderno)
- **Base Color:** Gray
- **Theme (Primary):** Cyan (azul-esverdeado)
- **Font:** Noto Sans
- **Icons:** Lucide (já instalado)
- **Radius:** Default (bordas arredondadas padrão)
- **Menu:** Bold accent, default color

**Por que esse preset:**
- Cyan como cor primária: profissional, transmite confiança
- Maia style: componentes modernos e clean
- Noto Sans: boa legibilidade em telas mobile

**Adicionar componentes individuais:**

```bash
# Após init com preset, adicionar componentes conforme necessário
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add toast
# ... etc
```

**Lista de componentes usados no projeto:**

| Componente | Uso Principal | Comando |
|------------|---------------|---------|
| **button** | Botões gerais | `add button` |
| **dialog** | Modais (confirmação, forms) | `add dialog` |
| **toast** | Notificações | `add toast` |
| **form** | Formulários (integra com RHF) | `add form` |
| **input** | Campos de texto | `add input` |
| **label** | Labels de formulário | `add label` |
| **select** | Dropdowns | `add select` |
| **checkbox** | Checkboxes (seleção de unidades) | `add checkbox` |
| **table** | Tabelas de dados | `add table` |
| **card** | Cards de conteúdo | `add card` |
| **badge** | Badges de status | `add badge` |
| **skeleton** | Loading states | `add skeleton` |
| **alert** | Alertas e avisos | `add alert` |
| **tabs** | Navegação por abas | `add tabs` |
| **separator** | Divisores | `add separator` |
| **dropdown-menu** | Menus dropdown | `add dropdown-menu` |
| **calendar** | Date picker | `add calendar` |
| **popover** | Popovers | `add popover` |

**Import básico:**

```typescript
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
```

**Customizações importantes:**

```typescript
// src/components/ui/toast.tsx
// Shadcn/ui gera automaticamente, mas você pode ajustar cores/posições

// src/components/ui/button.tsx
// Adicionar variant "loading" se necessário
import { Loader2 } from 'lucide-react'

const Button = ({ isLoading, children, ...props }) => (
  <button {...props}>
    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {children}
  </button>
)
```

---

## 7.3 API Client & TanStack Query Setup

### 7.3.1 `src/lib/api-client.ts` - API Client Base (CÓDIGO COMPLETO)

```typescript
/**
 * API Client base - wrapper around fetch with authentication.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: any
  ) {
    super(`API Error ${status}: ${statusText}`)
    this.name = 'APIError'
  }
}

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>
}

/**
 * Make authenticated API request.
 * Automatically includes credentials (cookies) for authentication.
 */
export async function apiClient<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, ...fetchConfig } = config

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint}`
  
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
    url += `?${searchParams.toString()}`
  }

  // Default headers
  const headers = new Headers(fetchConfig.headers)
  if (!headers.has('Content-Type') && fetchConfig.body) {
    headers.set('Content-Type', 'application/json')
  }

  // Make request
  const response = await fetch(url, {
    ...fetchConfig,
    headers,
    credentials: 'include', // Include cookies (httpOnly JWT)
  })

  // Handle errors
  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      errorData = { detail: response.statusText }
    }
    
    throw new APIError(response.status, response.statusText, errorData)
  }

  // Parse response
  if (response.status === 204) {
    return null as T // No content
  }

  return response.json()
}

/**
 * Helper methods for common HTTP verbs.
 */
export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>) =>
    apiClient<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: any) =>
    apiClient<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any) =>
    apiClient<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    apiClient<T>(endpoint, { method: 'DELETE' }),
}
```

**Uso:**

```typescript
import { api } from '@/lib/api-client'

// GET com params
const condos = await api.get('/api/v1/condominiums', { page: 1, page_size: 20 })

// POST com body
const newCondo = await api.post('/api/v1/condominiums', {
  name: 'Condomínio Teste',
  address: 'Rua Teste, 123'
})

// Tratamento de erros
try {
  await api.get('/api/v1/assemblies/999')
} catch (error) {
  if (error instanceof APIError) {
    console.error(error.status, error.data.detail)
  }
}
```

---

### 7.3.2 `src/lib/query-client.ts` - TanStack Query Config (CÓDIGO COMPLETO)

```typescript
/**
 * TanStack Query client configuration.
 */
import { QueryClient } from '@tanstack/react-query'
import { APIError } from './api-client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache time (5 minutes default)
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30, // Previously cacheTime
      
      // Retry logic
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof APIError && error.status >= 400 && error.status < 500) {
          return false
        }
        // Retry up to 3 times for network/server errors
        return failureCount < 3
      },
      
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * 2 ** attemptIndex, 30000)
      },
      
      // Refetch on window focus (useful for real-time data)
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    
    mutations: {
      // Retry mutations 3 times (for votes, critical operations)
      retry: 3,
      retryDelay: (attemptIndex) => {
        return Math.min(1000 * 2 ** attemptIndex, 30000)
      },
    },
  },
})
```

**Setup em App:**

```typescript
// src/main.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
```

**React Query DevTools (desenvolvimento):**

```typescript
// src/App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      {/* ... resto do app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

---

Continuarei com Auth, Routing e o restante da Seção 7. Quer que eu continue agora ou prefere revisar esta primeira parte?

[Voltar ao Índice](README.md)

---

## 7.4 Auth & Routing (COMPLETO - Crítico)

### 7.4.1 `src/features/auth/stores/auth-store.ts` - Auth State (CÓDIGO COMPLETO)

```typescript
/**
 * Authentication state management with Zustand.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { components } from '@/types/api'

type UserResponse = components['schemas']['UserResponse']

interface AuthState {
  user: UserResponse | null
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: UserResponse) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      setUser: (user) => set({ user, isAuthenticated: true }),
      
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ user: state.user }), // Only persist user
    }
  )
)
```

---

### 7.4.2 `src/features/auth/hooks/useAuth.ts` - Auth Hook (CÓDIGO COMPLETO)

```typescript
/**
 * Auth hook - handles login, logout, and current user.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
import { useAuthStore } from '../stores/auth-store'
import { useToast } from '@/components/ui/use-toast'
import type { components } from '@/types/api'

type LoginRequest = components['schemas']['LoginRequest']
type UserResponse = components['schemas']['UserResponse']

export function useAuth() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const { user, isAuthenticated, setUser, logout: logoutStore } = useAuthStore()
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) =>
      api.post<UserResponse>('/api/v1/auth/login', credentials),
    
    onSuccess: (data) => {
      setUser(data)
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.name}!`,
      })
      navigate('/dashboard')
    },
    
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.data?.detail || 'Invalid credentials',
        variant: 'destructive',
      })
    },
  })
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => api.post('/api/v1/auth/logout'),
    
    onSuccess: () => {
      logoutStore()
      queryClient.clear() // Clear all cached data
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      })
      navigate('/login')
    },
  })
  
  // Fetch current user (on app load)
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<UserResponse>('/api/v1/auth/me'),
    enabled: isAuthenticated, // Only fetch if we think user is authenticated
    retry: false, // Don't retry on 401
    
    onSuccess: (data) => {
      setUser(data)
    },
    
    onError: () => {
      // Token expired or invalid
      logoutStore()
    },
  })
  
  return {
    user: currentUser || user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}
```

---

### 7.4.3 `src/features/auth/pages/LoginPage.tsx` - Login Page (CÓDIGO COMPLETO)

```typescript
/**
 * Login page with form validation.
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, isLoggingIn } = useAuth()
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  
  const onSubmit = (data: LoginFormData) => {
    login(data)
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### 7.4.4 `src/components/ProtectedRoute.tsx` - Route Protection

```typescript
/**
 * Protected route wrapper - redirects to login if not authenticated.
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <Outlet />
}
```

---

### 7.4.5 `src/lib/router.tsx` - React Router Setup (CÓDIGO COMPLETO)

```typescript
/**
 * Application routing configuration.
 */
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'

// Auth
import { LoginPage } from '@/features/auth/pages/LoginPage'

// Dashboard
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'

// Condominiums (lazy load)
import { lazy } from 'react'
const CondominiumsList = lazy(() => import('@/features/condominiums/pages/CondominiumsList'))
const CondominiumForm = lazy(() => import('@/features/condominiums/pages/CondominiumForm'))

// Assemblies
const AssembliesList = lazy(() => import('@/features/assemblies/pages/AssembliesList'))
const AssemblyForm = lazy(() => import('@/features/assemblies/pages/AssemblyForm'))
const AssemblyDetails = lazy(() => import('@/features/assemblies/pages/AssemblyDetails'))

// QR Codes
const QRCodesList = lazy(() => import('@/features/qr-codes/pages/QRCodesList'))

// Voting (public route)
const VotingPage = lazy(() => import('@/features/voting/pages/VotingPage'))

// Operator Dashboard
const OperatorDashboard = lazy(() => import('@/features/operator/pages/OperatorDashboard'))

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  
  {
    path: '/vote/:token',
    element: <VotingPage />, // Public route (QR code access)
  },
  
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/',
            element: <DashboardPage />,
          },
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          
          // Condominiums
          {
            path: '/condominiums',
            element: <CondominiumsList />,
          },
          {
            path: '/condominiums/new',
            element: <CondominiumForm />,
          },
          {
            path: '/condominiums/:id/edit',
            element: <CondominiumForm />,
          },
          
          // Assemblies
          {
            path: '/assemblies',
            element: <AssembliesList />,
          },
          {
            path: '/assemblies/new',
            element: <AssemblyForm />,
          },
          {
            path: '/assemblies/:id',
            element: <AssemblyDetails />,
          },
          {
            path: '/assemblies/:id/edit',
            element: <AssemblyForm />,
          },
          
          // Operator Dashboard
          {
            path: '/assemblies/:id/operate',
            element: <OperatorDashboard />,
          },
          
          // QR Codes
          {
            path: '/qr-codes',
            element: <QRCodesList />,
          },
        ],
      },
    ],
  },
])
```

**Setup em main.tsx:**

```typescript
// src/main.tsx
import { RouterProvider } from 'react-router-dom'
import { router } from '@/lib/router'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)
```

---

## 7.5 CRUD Pattern - Exemplo Completo (Condominiums)

### 7.5.1 `src/features/condominiums/hooks/useCondominiums.ts` - Custom Hooks

```typescript
/**
 * TanStack Query hooks for Condominiums CRUD.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/components/ui/use-toast'
import type { components } from '@/types/api'

type CondominiumResponse = components['schemas']['CondominiumResponse']
type CondominiumCreate = components['schemas']['CondominiumCreate']
type CondominiumUpdate = components['schemas']['CondominiumUpdate']
type CondominiumListResponse = components['schemas']['CondominiumListResponse']

// List condominiums (with pagination)
export function useCondominiums(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['condominiums', { page, pageSize }],
    queryFn: () =>
      api.get<CondominiumListResponse>('/api/v1/condominiums', {
        page,
        page_size: pageSize,
      }),
  })
}

// Get single condominium
export function useCondominium(id: number) {
  return useQuery({
    queryKey: ['condominiums', id],
    queryFn: () => api.get<CondominiumResponse>(`/api/v1/condominiums/${id}`),
    enabled: !!id,
  })
}

// Create condominium
export function useCreateCondominium() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: (data: CondominiumCreate) =>
      api.post<CondominiumResponse>('/api/v1/condominiums', data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['condominiums'] })
      toast({
        title: 'Success',
        description: 'Condominium created successfully',
      })
    },
    
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.data?.detail || 'Failed to create condominium',
        variant: 'destructive',
      })
    },
  })
}

// Update condominium
export function useUpdateCondominium(id: number) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: (data: CondominiumUpdate) =>
      api.put<CondominiumResponse>(`/api/v1/condominiums/${id}`, data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['condominiums'] })
      queryClient.invalidateQueries({ queryKey: ['condominiums', id] })
      toast({
        title: 'Success',
        description: 'Condominium updated successfully',
      })
    },
    
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.data?.detail || 'Failed to update condominium',
        variant: 'destructive',
      })
    },
  })
}

// Delete condominium
export function useDeleteCondominium() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/condominiums/${id}`),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['condominiums'] })
      toast({
        title: 'Success',
        description: 'Condominium deleted successfully',
      })
    },
    
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.data?.detail || 'Failed to delete condominium',
        variant: 'destructive',
      })
    },
  })
}
```

---

### 7.5.2 `src/features/condominiums/pages/CondominiumsList.tsx` - List Page (CÓDIGO COMPLETO)

```typescript
/**
 * Condominiums list page with table and pagination.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCondominiums, useDeleteCondominium } from '../hooks/useCondominiums'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function CondominiumsList() {
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  
  const { data, isLoading, error } = useCondominiums(page)
  const deleteMutation = useDeleteCondominium()
  
  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId)
      setDeleteId(null)
    }
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Error loading condominiums</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Condominiums</h1>
          <p className="text-muted-foreground">
            Manage your condominiums
          </p>
        </div>
        
        <Button asChild>
          <Link to="/condominiums/new">
            <Plus className="mr-2 h-4 w-4" />
            New Condominium
          </Link>
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[300px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[80px]" /></TableCell>
                </TableRow>
              ))
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No condominiums found. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((condo) => (
                <TableRow key={condo.id}>
                  <TableCell className="font-medium">{condo.name}</TableCell>
                  <TableCell>{condo.address}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link to={`/condominiums/${condo.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(condo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {data.items.length} of {data.total} condominiums
          </p>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= data.total_pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              condominium.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

---

Continuando no próximo bloco com CondominiumForm, Features que seguem o pattern, e o restante...

Quer que eu continue agora?


### 7.5.3 `src/features/condominiums/pages/CondominiumForm.tsx` - Form Page (CÓDIGO COMPLETO)

```typescript
/**
 * Condominium form (create/edit) with validation.
 */
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useCondominium,
  useCreateCondominium,
  useUpdateCondominium,
} from '../hooks/useCondominiums'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'

const condominiumSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  address: z.string().min(1, 'Address is required'),
})

type CondominiumFormData = z.infer<typeof condominiumSchema>

export default function CondominiumForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id
  
  const { data: condominium, isLoading } = useCondominium(Number(id))
  const createMutation = useCreateCondominium()
  const updateMutation = useUpdateCondominium(Number(id))
  
  const form = useForm<CondominiumFormData>({
    resolver: zodResolver(condominiumSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  })
  
  // Populate form when editing
  useEffect(() => {
    if (condominium) {
      form.reset({
        name: condominium.name,
        address: condominium.address,
      })
    }
  }, [condominium, form])
  
  const onSubmit = (data: CondominiumFormData) => {
    if (isEditing) {
      updateMutation.mutate(data, {
        onSuccess: () => navigate('/condominiums'),
      })
    } else {
      createMutation.mutate(data, {
        onSuccess: () => navigate('/condominiums'),
      })
    }
  }
  
  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate('/condominiums')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Condominiums
        </Button>
        
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? 'Edit Condominium' : 'New Condominium'}
        </h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Condominium Information</CardTitle>
          <CardDescription>
            Fill in the details below
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Condomínio Exemplo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Rua Exemplo, 123 - São Paulo, SP"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {isEditing ? 'Update' : 'Create'} Condominium
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/condominiums')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 7.6 Features que Seguem CRUD Pattern

As seguintes features seguem o **mesmo pattern** do exemplo Condominiums acima. Diferenças específicas são destacadas:

### 7.6.1 Assemblies

**Diferenças do padrão:**

1. **Status Badges:**
```typescript
// src/features/assemblies/components/StatusBadge.tsx
const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  finished: { label: 'Finished', variant: 'outline' },
}

<Badge variant={statusConfig[status].variant}>
  {statusConfig[status].label}
</Badge>
```

2. **Workflow Buttons:**
```typescript
// Na lista de assemblies
{assembly.status === 'draft' && (
  <Button onClick={() => startAssembly(assembly.id)}>
    Start Assembly
  </Button>
)}

{assembly.status === 'in_progress' && (
  <Button onClick={() => finishAssembly(assembly.id)}>
    Finish Assembly
  </Button>
)}
```

3. **Relação com Condomínio:**
```typescript
// No formulário de assembleia
<FormField
  name="condominium_id"
  render={({ field }) => (
    <Select onValueChange={field.onChange} value={String(field.value)}>
      <SelectTrigger>
        <SelectValue placeholder="Select condominium" />
      </SelectTrigger>
      <SelectContent>
        {condominiums?.items.map(c => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
/>
```

---

### 7.6.2 QR Codes

**Diferenças do padrão:**

1. **Geração em Lote:**
```typescript
// src/features/qr-codes/components/GenerateQRDialog.tsx
const [quantity, setQuantity] = useState(10)

const generateMutation = useGenerateQRCodes()

const handleGenerate = () => {
  generateMutation.mutate({ quantity })
}

<Input
  type="number"
  min={1}
  max={100}
  value={quantity}
  onChange={(e) => setQuantity(Number(e.target.value))}
/>
```

2. **Conteúdo do QR Code (URL completa):**
```typescript
// src/lib/qr-url.ts
export function buildVotingUrl(token: string): string {
  const configuredBase = import.meta.env.VITE_PUBLIC_APP_URL?.trim()
  const base = configuredBase && configuredBase.length > 0
    ? configuredBase
    : window.location.origin

  const normalizedBase = base.replace(/\/+$/, '')
  return `${normalizedBase}/vote/${token}`
}

<QRCodeCanvas value={buildVotingUrl(qr.token)} />
```

3. **Download de QR Code:**
```typescript
const canvas = document.getElementById(`qr-canvas-${qr.id}`) as HTMLCanvasElement
const link = document.createElement('a')
link.href = canvas.toDataURL('image/png')
link.download = `qr-${String(qr.visual_number).padStart(3, '0')}.png`
link.click()
```

4. **Visual Number Display:**
```typescript
// Exibir número visual formatado
<span className="font-mono text-lg">
  {String(qr.visual_number).padStart(3, '0')}
</span>
```

---

### 7.6.3 Agendas

**Diferenças do padrão:**

1. **Drag-and-Drop Ordering:**
```typescript
// Usar @dnd-kit/core para reordenar pautas
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={agendas} strategy={verticalListSortingStrategy}>
    {agendas.map(agenda => (
      <SortableAgendaItem key={agenda.id} agenda={agenda} />
    ))}
  </SortableContext>
</DndContext>
```

2. **Nested com Options:**
```typescript
// Formulário de agenda com opções
const [options, setOptions] = useState([
  { option_text: 'Sim', display_order: 1 },
  { option_text: 'Não', display_order: 2 },
])

<div className="space-y-2">
  {options.map((opt, idx) => (
    <div key={idx} className="flex gap-2">
      <Input
        value={opt.option_text}
        onChange={(e) => updateOption(idx, e.target.value)}
      />
      <Button onClick={() => removeOption(idx)}>Remove</Button>
    </div>
  ))}
  <Button onClick={addOption}>Add Option</Button>
</div>
```

---

## 7.7 Voting Interface (COMPLETO - Crítico/Público)

### 7.7.1 `src/features/voting/pages/VotingPage.tsx` - Tela de Votação (CÓDIGO COMPLETO)

```typescript
/**
 * Voting page - accessed via QR code (public route).
 * Mobile-first design for condôminos.
 */
import { useParams } from 'react-router-dom'
import { useVoting } from '../hooks/useVoting'
import { VoteCard } from '../components/VoteCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'

export default function VotingPage() {
  const { token } = useParams<{ token: string }>()
  
  const {
    assembly,
    agenda,
    units,
    hasVoted,
    isLoading,
    error,
    submitVote,
    isSubmitting,
  } = useVoting(token!)
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }
  
  if (error || !assembly) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Invalid QR code or assembly not found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Assembly finished
  if (assembly.status === 'finished') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Assembly Finished
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This assembly has been finished. Thank you for participating!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Already voted
  if (hasVoted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Vote Recorded!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your vote has been successfully recorded.
            </p>
            <p className="text-sm text-muted-foreground">
              Wait for the next agenda item.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // No open agenda
  if (!agenda) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Waiting...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{assembly.title}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(assembly.assembly_date).toLocaleString()}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Your Units:</p>
              <div className="flex flex-wrap gap-2">
                {units.map(unit => (
                  <Badge key={unit.id} variant="outline">
                    {unit.unit_number}
                  </Badge>
                ))}
              </div>
            </div>
            
            <p className="text-center text-muted-foreground">
              Waiting for next voting item...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Voting open!
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{assembly.title}</p>
              <CardTitle>{agenda.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {agenda.description && (
              <p className="text-muted-foreground">{agenda.description}</p>
            )}
            
            <div>
              <p className="text-sm font-medium mb-2">Voting for units:</p>
              <div className="flex flex-wrap gap-2">
                {units.map(unit => (
                  <Badge key={unit.id} variant="secondary">
                    {unit.unit_number} - {unit.owner_name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <VoteCard
          agenda={agenda}
          onVote={submitVote}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
```

---

### 7.7.2 `src/features/voting/components/VoteCard.tsx` - Vote Options (CÓDIGO COMPLETO)

```typescript
/**
 * Vote card with options (radio buttons).
 */
import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import type { components } from '@/types/api'

type Agenda = components['schemas']['AgendaResponse'] // Assumindo que existe

interface VoteCardProps {
  agenda: Agenda
  onVote: (optionId: number) => void
  isSubmitting: boolean
}

export function VoteCard({ agenda, onVote, isSubmitting }: VoteCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>('')
  
  const handleSubmit = () => {
    if (selectedOption) {
      onVote(Number(selectedOption))
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select your vote</CardTitle>
      </CardHeader>
      
      <CardContent>
        <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
          <div className="space-y-3">
            {agenda.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer"
              >
                <RadioGroupItem value={String(option.id)} id={String(option.id)} />
                <Label
                  htmlFor={String(option.id)}
                  className="flex-1 cursor-pointer text-base"
                >
                  {option.option_text}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={!selectedOption || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Vote'}
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

### 7.7.3 `src/features/voting/hooks/useVoting.ts` - Voting Logic (CÓDIGO COMPLETO)

```typescript
/**
 * Voting hook with retry logic (3 attempts).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/components/ui/use-toast'
import type { components } from '@/types/api'

type VoteRequest = components['schemas']['VoteRequest']

export function useVoting(qrToken: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  // Fetch assembly + current agenda status
  const { data, isLoading, error } = useQuery({
    queryKey: ['voting', qrToken],
    queryFn: () => api.get(`/api/v1/voting/status/${qrToken}`),
    refetchInterval: 5000, // Poll every 5 seconds for agenda updates
  })
  
  // Submit vote mutation with retry
  const voteMutation = useMutation({
    mutationFn: (voteData: VoteRequest) =>
      api.post('/api/v1/voting/vote', voteData),
    
    // 3 retries with exponential backoff (já configurado no queryClient)
    retry: 3,
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voting', qrToken] })
      toast({
        title: 'Vote recorded!',
        description: 'Your vote has been successfully submitted.',
      })
    },
    
    onError: (error: any, _variables, context) => {
      // Show error after all retries failed
      toast({
        title: 'Vote failed',
        description: error.data?.detail || 'Please try again.',
        variant: 'destructive',
      })
    },
  })
  
  const submitVote = (optionId: number) => {
    voteMutation.mutate({
      qr_token: qrToken,
      agenda_id: data?.agenda?.id,
      option_id: optionId,
    })
  }
  
  return {
    assembly: data?.assembly,
    agenda: data?.agenda,
    units: data?.units || [],
    hasVoted: data?.has_voted || false,
    isLoading,
    error,
    submitVote,
    isSubmitting: voteMutation.isPending,
  }
}
```

---

Vou parar aqui e continuar com Check-in, Operator Dashboard, SSE e Testing no próximo bloco.

Está ficando muito extenso. **Quer que eu continue ou prefere que eu finalize e organize agora?**

Estimativa: Faltam ~40% da Seção 7 (Check-in, Operator, SSE, CSV, Testing, Utils).


---

## 7.8 Check-in Interface (COMPLETO - Crítico)

### 7.8.1 `src/features/checkin/pages/CheckinPage.tsx` - Check-in Page (CÓDIGO COMPLETO)

```typescript
/**
 * Check-in page - QR scanner + manual input + unit selection.
 * Mobile-first design for operators.
 */
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { QRScanner } from '../components/QRScanner'
import { UnitSelector } from '../components/UnitSelector'
import { AttendanceList } from '../components/AttendanceList'
import { useCheckin } from '../hooks/useCheckin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { QrCode, Hash } from 'lucide-react'

export default function CheckinPage() {
  const { assemblyId } = useParams<{ assemblyId: string }>()
  const [manualNumber, setManualNumber] = useState('')
  const [selectedQRCode, setSelectedQRCode] = useState<any>(null)
  
  const {
    assembly,
    availableQRCodes,
    assignedUnits,
    attendance,
    assignQRCode,
    unassignQRCode,
    isLoading,
  } = useCheckin(Number(assemblyId))
  
  const handleQRScan = (token: string) => {
    // Find QR code by token
    const qrCode = availableQRCodes?.find(qr => qr.token === token)
    if (qrCode) {
      setSelectedQRCode(qrCode)
    }
  }
  
  const handleManualSubmit = () => {
    const qrCode = availableQRCodes?.find(
      qr => qr.visual_number === Number(manualNumber)
    )
    if (qrCode) {
      setSelectedQRCode(qrCode)
      setManualNumber('')
    }
  }
  
  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Check-in</h1>
        <p className="text-muted-foreground">{assembly?.title}</p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: QR Scanner + Manual Input */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="scanner">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="scanner">
                    <QrCode className="mr-2 h-4 w-4" />
                    Scanner
                  </TabsTrigger>
                  <TabsTrigger value="manual">
                    <Hash className="mr-2 h-4 w-4" />
                    Manual
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="scanner" className="space-y-4">
                  <QRScanner onScan={handleQRScan} />
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-4">
                  <div className="space-y-2">
                    <Label>QR Code Number</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Enter number (e.g., 001)"
                        value={manualNumber}
                        onChange={(e) => setManualNumber(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                      />
                      <Button onClick={handleManualSubmit}>
                        Submit
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Unit Selection */}
          {selectedQRCode && (
            <UnitSelector
              assemblyId={Number(assemblyId)}
              qrCode={selectedQRCode}
              onAssign={(unitIds, isProxy) => {
                assignQRCode(selectedQRCode.id, unitIds, isProxy)
                setSelectedQRCode(null)
              }}
              onCancel={() => setSelectedQRCode(null)}
            />
          )}
        </div>
        
        {/* Right: Attendance List */}
        <AttendanceList
          attendance={attendance}
          onUnassign={unassignQRCode}
        />
      </div>
    </div>
  )
}
```

---

### 7.8.2 `src/features/checkin/components/QRScanner.tsx` - QR Scanner (CÓDIGO COMPLETO)

```typescript
/**
 * QR Code scanner component using html5-qrcode.
 */
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Camera, CameraOff } from 'lucide-react'

interface QRScannerProps {
  onScan: (token: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const elementId = 'qr-reader'
  
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop()
      }
    }
  }, [])
  
  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode(elementId)
      scannerRef.current = scanner
      
      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Extract token from URL or use directly
          const token = decodedText.includes('/vote/')
            ? decodedText.split('/vote/')[1]
            : decodedText
          
          onScan(token)
          stopScanning()
        },
        (error) => {
          // Ignore decode errors (normal when no QR in view)
        }
      )
      
      setIsScanning(true)
    } catch (error) {
      console.error('Failed to start scanner:', error)
      alert('Failed to access camera. Please check permissions.')
    }
  }
  
  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
      setIsScanning(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div
        id={elementId}
        className="rounded-lg border overflow-hidden"
        style={{ minHeight: '250px' }}
      />
      
      <Button
        onClick={isScanning ? stopScanning : startScanning}
        variant={isScanning ? 'destructive' : 'default'}
        className="w-full"
      >
        {isScanning ? (
          <>
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Scanning
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </>
        )}
      </Button>
    </div>
  )
}
```

---

### 7.8.3 `src/features/checkin/components/UnitSelector.tsx` - Unit Selection (CÓDIGO COMPLETO)

```typescript
/**
 * Unit selector with "select all by owner" shortcut.
 */
import { useState, useEffect } from 'react'
import { useAssemblyUnits } from '../hooks/useCheckin'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface UnitSelectorProps {
  assemblyId: number
  qrCode: any
  onAssign: (unitIds: number[], isProxy: boolean) => void
  onCancel: () => void
}

export function UnitSelector({ assemblyId, qrCode, onAssign, onCancel }: UnitSelectorProps) {
  const [selectedUnits, setSelectedUnits] = useState<number[]>([])
  const [isProxy, setIsProxy] = useState(false)
  
  const { data: units } = useAssemblyUnits(assemblyId)
  
  // Group units by owner
  const unitsByOwner = units?.reduce((acc, unit) => {
    const owner = unit.owner_name
    if (!acc[owner]) acc[owner] = []
    acc[owner].push(unit)
    return acc
  }, {} as Record<string, any[]>)
  
  const toggleUnit = (unitId: number) => {
    setSelectedUnits(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    )
  }
  
  const selectAllByOwner = (owner: string) => {
    const ownerUnitIds = unitsByOwner?.[owner]?.map(u => u.id) || []
    setSelectedUnits(prev => {
      const allSelected = ownerUnitIds.every(id => prev.includes(id))
      if (allSelected) {
        return prev.filter(id => !ownerUnitIds.includes(id))
      } else {
        return [...new Set([...prev, ...ownerUnitIds])]
      }
    })
  }
  
  const handleSubmit = () => {
    if (selectedUnits.length > 0) {
      onAssign(selectedUnits, isProxy)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Select Units</span>
          <Badge variant="secondary">
            QR #{String(qrCode.visual_number).padStart(3, '0')}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {Object.entries(unitsByOwner || {}).map(([owner, ownerUnits]) => (
          <div key={owner} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">{owner}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectAllByOwner(owner)}
              >
                {ownerUnits.every(u => selectedUnits.includes(u.id))
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>
            
            <div className="space-y-2 pl-4">
              {ownerUnits.map((unit) => (
                <div key={unit.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`unit-${unit.id}`}
                    checked={selectedUnits.includes(unit.id)}
                    onCheckedChange={() => toggleUnit(unit.id)}
                  />
                  <Label htmlFor={`unit-${unit.id}`} className="flex-1 cursor-pointer">
                    <span className="font-medium">{unit.unit_number}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      ({unit.ideal_fraction}%)
                    </span>
                  </Label>
                </div>
              ))}
            </div>
            
            <Separator />
          </div>
        ))}
        
        {/* Proxy checkbox */}
        <div className="flex items-center space-x-2 pt-4 border-t">
          <Checkbox
            id="is-proxy"
            checked={isProxy}
            onCheckedChange={(checked) => setIsProxy(checked === true)}
          />
          <Label htmlFor="is-proxy" className="cursor-pointer">
            This is a proxy (procuração)
          </Label>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={selectedUnits.length === 0}
          className="flex-1"
        >
          Assign ({selectedUnits.length} units)
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

### 7.8.4 `src/features/checkin/components/AttendanceList.tsx` - Real-time Attendance

```typescript
/**
 * Real-time attendance list with quorum indicator.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { X } from 'lucide-react'

interface AttendanceListProps {
  attendance: any[]
  onUnassign: (assignmentId: number) => void
}

export function AttendanceList({ attendance, onUnassign }: AttendanceListProps) {
  const totalFraction = attendance.reduce((sum, a) => sum + a.total_fraction, 0)
  const quorumReached = totalFraction >= 50
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Attendance</span>
          <Badge variant={quorumReached ? 'default' : 'secondary'}>
            {totalFraction.toFixed(2)}% present
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Quorum (50%)</span>
            <span className="font-medium">{totalFraction.toFixed(2)}%</span>
          </div>
          <Progress value={totalFraction} max={100} />
          {quorumReached && (
            <p className="text-sm text-green-600">✓ Quorum reached!</p>
          )}
        </div>
        
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {attendance.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No check-ins yet
            </p>
          ) : (
            attendance.map((item) => (
              <div
                key={item.assignment_id}
                className="flex items-start justify-between rounded-lg border p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      QR #{String(item.qr_visual_number).padStart(3, '0')}
                    </Badge>
                    {item.is_proxy && (
                      <Badge variant="secondary">Proxy</Badge>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    {item.units.map((unit: any) => (
                      <p key={unit.id} className="text-sm">
                        <span className="font-medium">{unit.unit_number}</span>
                        <span className="text-muted-foreground ml-2">
                          {unit.owner_name} ({unit.ideal_fraction}%)
                        </span>
                      </p>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Total: {item.total_fraction.toFixed(2)}%
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUnassign(item.assignment_id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 7.9 Operator Dashboard (COMPLETO - Complexo)

### 7.9.1 `src/features/operator/pages/OperatorDashboard.tsx` - Dashboard (CÓDIGO COMPLETO)

```typescript
/**
 * Operator control panel with real-time updates via SSE.
 */
import { useParams } from 'react-router-dom'
import { useRealtimeAssembly } from '@/hooks/useRealtimeAssembly'
import { AgendaControl } from '../components/AgendaControl'
import { VoteMonitor } from '../components/VoteMonitor'
import { QuorumIndicator } from '../components/QuorumIndicator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Users } from 'lucide-react'

export default function OperatorDashboard() {
  const { assemblyId } = useParams<{ assemblyId: string }>()
  
  const {
    assembly,
    currentAgenda,
    agendas,
    quorum,
    attendance,
    votes,
    isConnected,
  } = useRealtimeAssembly(Number(assemblyId))
  
  if (!assembly) {
    return <div className="p-8">Loading assembly...</div>
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{assembly.title}</h1>
          <p className="text-muted-foreground">
            {new Date(assembly.assembly_date).toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={assembly.status === 'in_progress' ? 'default' : 'secondary'}>
            {assembly.status}
          </Badge>
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? '● Live' : '○ Disconnected'}
          </Badge>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quorum</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quorum?.present_fraction.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {quorum?.is_reached ? 'Reached ✓' : 'Not reached'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendees</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendance?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Check-ins completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Agenda</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentAgenda ? `#${currentAgenda.display_order}` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentAgenda?.title || 'No active agenda'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="control">
        <TabsList>
          <TabsTrigger value="control">Agenda Control</TabsTrigger>
          <TabsTrigger value="votes">Vote Monitor</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="control" className="space-y-4">
          <AgendaControl
            assemblyId={Number(assemblyId)}
            agendas={agendas || []}
            currentAgenda={currentAgenda}
          />
        </TabsContent>
        
        <TabsContent value="votes" className="space-y-4">
          {currentAgenda ? (
            <VoteMonitor
              agenda={currentAgenda}
              votes={votes || []}
              attendance={attendance || []}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No active agenda. Open an agenda to start voting.
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="attendance" className="space-y-4">
          <QuorumIndicator
            quorum={quorum}
            attendance={attendance || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

Continuando no próximo bloco com VoteMonitor, AgendaControl, SSE hooks e o restante...


### 7.9.2 `src/features/operator/components/VoteMonitor.tsx` - Vote Monitoring (CÓDIGO COMPLETO)

```typescript
/**
 * Real-time vote monitoring with invalidation.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useInvalidateVote } from '../hooks/useOperator'

interface VoteMonitorProps {
  agenda: any
  votes: any[]
  attendance: any[]
}

export function VoteMonitor({ agenda, votes, attendance }: VoteMonitorProps) {
  const invalidateMutation = useInvalidateVote()
  
  // Calculate results
  const optionResults = agenda.options.map((option: any) => {
    const optionVotes = votes.filter(v => v.option_id === option.id && v.is_valid)
    const voteCount = optionVotes.length
    const fractionSum = optionVotes.reduce((sum, v) => sum + v.ideal_fraction, 0)
    
    return {
      option,
      voteCount,
      fractionSum,
      percentage: (fractionSum / 100) * 100, // Assuming 100% total
    }
  })
  
  // Units that haven't voted
  const votedUnitIds = votes.filter(v => v.is_valid).map(v => v.unit_id)
  const unvotedUnits = attendance.flatMap(a => 
    a.units.filter((u: any) => !votedUnitIds.includes(u.id))
  )
  
  return (
    <div className="space-y-6">
      {/* Results by Option */}
      <Card>
        <CardHeader>
          <CardTitle>Live Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {optionResults.map(({ option, voteCount, fractionSum, percentage }) => (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{option.option_text}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {voteCount} votes
                  </span>
                  <Badge variant="outline">
                    {fractionSum.toFixed(2)}%
                  </Badge>
                </div>
              </div>
              <Progress value={percentage} max={100} />
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Pending Votes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending Votes ({unvotedUnits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unvotedUnits.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-green-600">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              All present units have voted!
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {unvotedUnits.map((unit: any) => (
                <div
                  key={unit.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div>
                    <p className="font-medium text-sm">{unit.unit_number}</p>
                    <p className="text-xs text-muted-foreground">{unit.owner_name}</p>
                  </div>
                  <Badge variant="secondary">{unit.ideal_fraction}%</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Votes (for invalidation) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Votes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {votes
              .filter(v => v.is_valid)
              .slice(-10)
              .reverse()
              .map((vote) => (
                <div
                  key={vote.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {vote.unit_number} → {vote.option_text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(vote.voted_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => invalidateMutation.mutate(vote.id)}
                  >
                    Invalidate
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### 7.9.3 `src/features/operator/components/AgendaControl.tsx` - Agenda Management

```typescript
/**
 * Agenda control - open/close agendas, add new ones.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Square, Plus } from 'lucide-react'
import { useOpenAgenda, useCloseAgenda } from '../hooks/useOperator'

interface AgendaControlProps {
  assemblyId: number
  agendas: any[]
  currentAgenda: any | null
}

export function AgendaControl({ assemblyId, agendas, currentAgenda }: AgendaControlProps) {
  const openMutation = useOpenAgenda()
  const closeMutation = useCloseAgenda()
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Agendas</CardTitle>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Agenda
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {agendas.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No agendas yet. Add your first agenda item.
          </p>
        ) : (
          agendas.map((agenda) => (
            <div
              key={agenda.id}
              className={`flex items-center justify-between rounded-lg border p-4 ${
                currentAgenda?.id === agenda.id ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">#{agenda.display_order}</Badge>
                  <Badge variant={
                    agenda.status === 'open' ? 'default' :
                    agenda.status === 'closed' ? 'secondary' :
                    'outline'
                  }>
                    {agenda.status}
                  </Badge>
                </div>
                <p className="font-medium">{agenda.title}</p>
                {agenda.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {agenda.description}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                {agenda.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => openMutation.mutate({ assemblyId, agendaId: agenda.id })}
                    disabled={!!currentAgenda}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                )}
                
                {agenda.status === 'open' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => closeMutation.mutate({ assemblyId, agendaId: agenda.id })}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Close
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 7.10 Real-time (SSE) Hooks (COMPLETO - Complexo)

### 7.10.1 `src/hooks/useSSE.ts` - Generic SSE Hook (CÓDIGO COMPLETO)

```typescript
/**
 * Generic Server-Sent Events (SSE) hook with auto-reconnect.
 */
import { useEffect, useRef, useState, useCallback } from 'react'

interface UseSSEOptions {
  onMessage?: (event: MessageEvent) => void
  onOpen?: () => void
  onError?: (error: Event) => void
  reconnect?: boolean
  reconnectInterval?: number
}

export function useSSE(url: string, options: UseSSEOptions = {}) {
  const {
    onMessage,
    onOpen,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
  } = options
  
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  
  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return // Already connected
    }
    
    const eventSource = new EventSource(url, { withCredentials: true })
    eventSourceRef.current = eventSource
    
    eventSource.onopen = () => {
      setIsConnected(true)
      onOpen?.()
    }
    
    eventSource.onmessage = (event) => {
      onMessage?.(event)
    }
    
    eventSource.onerror = (error) => {
      setIsConnected(false)
      onError?.(error)
      
      eventSource.close()
      
      // Auto-reconnect
      if (reconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, reconnectInterval)
      }
    }
  }, [url, onMessage, onOpen, onError, reconnect, reconnectInterval])
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])
  
  useEffect(() => {
    connect()
    return disconnect
  }, [connect, disconnect])
  
  return {
    isConnected,
    disconnect,
    reconnect: connect,
  }
}
```

---

### 7.10.2 `src/hooks/useRealtimeAssembly.ts` - Assembly SSE Hook (CÓDIGO COMPLETO)

```typescript
/**
 * Real-time assembly hook - integrates SSE with TanStack Query.
 */
import { useSSE } from './useSSE'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useRealtimeAssembly(assemblyId: number) {
  const queryClient = useQueryClient()
  
  // Fetch initial data
  const { data: assembly } = useQuery({
    queryKey: ['assemblies', assemblyId],
    queryFn: () => api.get(`/api/v1/assemblies/${assemblyId}`),
  })
  
  const { data: agendas } = useQuery({
    queryKey: ['assemblies', assemblyId, 'agendas'],
    queryFn: () => api.get(`/api/v1/assemblies/${assemblyId}/agendas`),
  })
  
  const { data: quorum } = useQuery({
    queryKey: ['assemblies', assemblyId, 'quorum'],
    queryFn: () => api.get(`/api/v1/assemblies/${assemblyId}/quorum`),
  })
  
  const { data: attendance } = useQuery({
    queryKey: ['assemblies', assemblyId, 'attendance'],
    queryFn: () => api.get(`/api/v1/assemblies/${assemblyId}/attendance`),
  })
  
  // Connect to SSE
  const { isConnected } = useSSE(
    `${API_BASE_URL}/api/v1/assemblies/${assemblyId}/stream`,
    {
      onMessage: (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'vote_update':
            // Invalidate votes and results
            queryClient.invalidateQueries({
              queryKey: ['assemblies', assemblyId, 'votes'],
            })
            queryClient.invalidateQueries({
              queryKey: ['assemblies', assemblyId, 'results'],
            })
            break
          
          case 'checkin_update':
            // Invalidate attendance and quorum
            queryClient.invalidateQueries({
              queryKey: ['assemblies', assemblyId, 'attendance'],
            })
            queryClient.invalidateQueries({
              queryKey: ['assemblies', assemblyId, 'quorum'],
            })
            break
          
          case 'agenda_update':
            // Invalidate agendas
            queryClient.invalidateQueries({
              queryKey: ['assemblies', assemblyId, 'agendas'],
            })
            break
          
          case 'heartbeat':
            // Keep connection alive
            break
        }
      },
      
      onOpen: () => {
        console.log('SSE connected')
      },
      
      onError: (error) => {
        console.error('SSE error:', error)
      },
    }
  )
  
  // Find current open agenda
  const currentAgenda = agendas?.find((a: any) => a.status === 'open') || null
  
  // Fetch current agenda votes if open
  const { data: votes } = useQuery({
    queryKey: ['assemblies', assemblyId, 'agendas', currentAgenda?.id, 'votes'],
    queryFn: () =>
      api.get(`/api/v1/assemblies/${assemblyId}/agendas/${currentAgenda.id}/votes`),
    enabled: !!currentAgenda,
    refetchInterval: 5000, // Fallback polling
  })
  
  return {
    assembly,
    agendas,
    currentAgenda,
    quorum,
    attendance,
    votes,
    isConnected,
  }
}
```

---

## 7.11 CSV Import (Frontend)

### 7.11.1 `src/features/assemblies/components/CSVImport.tsx` - CSV Import Component

```typescript
/**
 * CSV import with preview and validation.
 */
import { useState } from 'react'
import { useCSVPreview, useCSVImport } from '../hooks/useCSVImport'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Upload } from 'lucide-react'
import { CSVPreviewTable } from './CSVPreviewTable'

interface CSVImportProps {
  assemblyId: number
  onSuccess: () => void
}

export function CSVImport({ assemblyId, onSuccess }: CSVImportProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  const previewMutation = useCSVPreview(assemblyId)
  const importMutation = useCSVImport(assemblyId)
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      
      const formData = new FormData()
      formData.append('file', selectedFile)
      previewMutation.mutate(formData)
    }
  }
  
  const handleImport = () => {
    if (file) {
      const formData = new FormData()
      formData.append('file', file)
      importMutation.mutate(formData, {
        onSuccess: () => {
          setOpen(false)
          setFile(null)
          onSuccess()
        },
      })
    }
  }
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Import Units from CSV
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Units</DialogTitle>
            <DialogDescription>
              Upload a CSV file with unit information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
            </div>
            
            {previewMutation.data && (
              <>
                {previewMutation.data.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Validation Errors:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {previewMutation.data.errors.map((error: string, i: number) => (
                          <li key={i} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                {previewMutation.data.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Warnings:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {previewMutation.data.warnings.map((warning: string, i: number) => (
                          <li key={i} className="text-sm">{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                <CSVPreviewTable rows={previewMutation.data.preview} />
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                !previewMutation.data ||
                previewMutation.data.errors.length > 0 ||
                importMutation.isPending
              }
            >
              {importMutation.isPending ? 'Importing...' : 'Import Units'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

---

## 7.12 Utilities & Helpers

### 7.12.1 `src/lib/utils.ts` - Utility Functions

```typescript
/**
 * Utility functions (cn, etc.)
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

### 7.12.2 `src/lib/formatters.ts` - Formatters

```typescript
/**
 * Formatting utilities (dates, CPF/CNPJ, etc.)
 */
import { format, parseISO } from 'date-fns'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy')
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy HH:mm')
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '')
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function formatCPFCNPJ(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  return cleaned.length === 11 ? formatCPF(value) : formatCNPJ(value)
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}
```

---

### 7.12.3 `src/lib/validators.ts` - Custom Validators

```typescript
/**
 * Validation utilities (CPF/CNPJ validation)
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) {
    return false
  }
  
  // Validate check digits
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned.charAt(10))) return false
  
  return true
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')
  
  if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) {
    return false
  }
  
  // Validate check digits
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i]
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned.charAt(12))) return false
  
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i]
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned.charAt(13))) return false
  
  return true
}
```

---

### 7.12.4 `src/hooks/useDebounce.ts` - Debounce Hook

```typescript
/**
 * Debounce hook for search inputs.
 */
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])
  
  return debouncedValue
}
```

---

Continuo no próximo bloco com Testing e finalização da Seção 7.


## 7.13 Testing (Frontend)

### 7.13.1 `tests/setup.ts` - Vitest Setup

```typescript
/**
 * Vitest test setup and global configuration.
 */
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}
```

---

### 7.13.2 `vitest.config.ts` - Vitest Configuration

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

### 7.13.3 Exemplo de Teste - `tests/features/auth/LoginPage.test.tsx`

```typescript
/**
 * Login page tests.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
)

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />, { wrapper: Wrapper })
    
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })
  
  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginPage />, { wrapper: Wrapper })
    
    const submitButton = screen.getByRole('button', { name: /login/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
      expect(screen.getByText(/password must be at least/i)).toBeInTheDocument()
    })
  })
  
  it('submits form with valid credentials', async () => {
    const user = userEvent.setup()
    render(<LoginPage />, { wrapper: Wrapper })
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    // Form validation passes (API call would be mocked in real test)
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })
})
```

---

### 7.13.4 Exemplo de Teste - `tests/features/voting/VotingPage.test.tsx`

```typescript
/**
 * Voting page tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import VotingPage from '@/features/voting/pages/VotingPage'
import * as apiClient from '@/lib/api-client'

// Mock API client
vi.mock('@/lib/api-client')

const mockAssemblyData = {
  assembly: {
    id: 1,
    title: 'Assembly 2024',
    status: 'in_progress',
  },
  agenda: {
    id: 1,
    title: 'Approve Budget',
    options: [
      { id: 1, option_text: 'Yes' },
      { id: 2, option_text: 'No' },
    ],
  },
  units: [
    { id: 1, unit_number: '101', owner_name: 'John Doe', ideal_fraction: 10 },
  ],
  has_voted: false,
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={['/vote/test-token']}>
      <Routes>
        <Route path="/vote/:token" element={children} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>
)

describe('VotingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.api.get).mockResolvedValue(mockAssemblyData)
  })
  
  it('displays assembly and agenda information', async () => {
    render(<VotingPage />, { wrapper: Wrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Assembly 2024')).toBeInTheDocument()
      expect(screen.getByText('Approve Budget')).toBeInTheDocument()
    })
  })
  
  it('displays voting options', async () => {
    render(<VotingPage />, { wrapper: Wrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Yes')).toBeInTheDocument()
      expect(screen.getByText('No')).toBeInTheDocument()
    })
  })
  
  it('submits vote when option selected', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient.api.post).mockResolvedValue({})
    
    render(<VotingPage />, { wrapper: Wrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Yes')).toBeInTheDocument()
    })
    
    const yesOption = screen.getByText('Yes')
    await user.click(yesOption)
    
    const submitButton = screen.getByRole('button', { name: /submit vote/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(apiClient.api.post).toHaveBeenCalledWith(
        '/api/v1/voting/vote',
        expect.objectContaining({
          option_id: 1,
        })
      )
    })
  })
  
  it('shows "already voted" message when has_voted is true', async () => {
    vi.mocked(apiClient.api.get).mockResolvedValue({
      ...mockAssemblyData,
      has_voted: true,
    })
    
    render(<VotingPage />, { wrapper: Wrapper })
    
    await waitFor(() => {
      expect(screen.getByText(/vote recorded/i)).toBeInTheDocument()
    })
  })
})
```

---

### 7.13.5 Exemplo de Teste - `tests/hooks/useAuth.test.ts`

```typescript
/**
 * useAuth hook tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import * as apiClient from '@/lib/api-client'

vi.mock('@/lib/api-client')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('provides login function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(typeof result.current.login).toBe('function')
    expect(result.current.isLoggingIn).toBe(false)
  })
  
  it('calls API on login', async () => {
    vi.mocked(apiClient.api.post).mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    })
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    result.current.login({
      email: 'test@example.com',
      password: 'password',
    })
    
    await waitFor(() => {
      expect(apiClient.api.post).toHaveBeenCalledWith(
        '/api/v1/auth/login',
        {
          email: 'test@example.com',
          password: 'password',
        }
      )
    })
  })
  
  it('provides logout function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(typeof result.current.logout).toBe('function')
    expect(result.current.isLoggingOut).toBe(false)
  })
})
```

---

### 7.13.6 Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test tests/features/auth/LoginPage.test.tsx

# Watch mode
npm run test -- --watch

# UI mode
npm run test -- --ui
```

**Cobertura alvo:** ~60% para MVP (focar em features críticas: auth, voting, check-in)

---

## 7.14 Layout Components

### 7.14.1 `src/components/layout/Layout.tsx` - Main Layout

```typescript
/**
 * Main application layout with header and sidebar.
 */
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

---

### 7.14.2 `src/components/layout/Header.tsx` - Header

```typescript
/**
 * Application header with user menu.
 */
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut } from 'lucide-react'

export function Header() {
  const { user, logout } = useAuth()
  
  return (
    <header className="border-b bg-white px-8 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assembly Voting</h1>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

---

### 7.14.3 `src/components/layout/Sidebar.tsx` - Sidebar Navigation

```typescript
/**
 * Sidebar navigation with menu items.
 */
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Calendar,
  QrCode,
  FileText,
} from 'lucide-react'

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/condominiums', label: 'Condominiums', icon: Building2 },
  { to: '/assemblies', label: 'Assemblies', icon: Calendar },
  { to: '/qr-codes', label: 'QR Codes', icon: QrCode },
]

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <FileText className="h-6 w-6 text-primary" />
        <span className="ml-2 text-lg font-semibold">Assembly System</span>
      </div>
      
      <nav className="space-y-1 p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
```

---

## 7.15 Considerações Finais

### Responsive Design Strategy

**Mobile-first approach:**
- Voting page otimizada para mobile (principal interface dos condôminos)
- Check-in com scanner QR otimizado para tablets
- Operator dashboard responsivo (desktop preferred, mas funciona em tablet)
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:` (Tailwind defaults)

**Pattern:**
```typescript
// Mobile first, então estilos base são mobile
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
</div>
```

---

### Loading States Strategy

**Skeleton loaders para melhor UX:**
```typescript
import { Skeleton } from '@/components/ui/skeleton'

{isLoading ? (
  <Skeleton className="h-8 w-[200px]" />
) : (
  <p>{data.title}</p>
)}
```

---

### Error Handling Strategy

**Toast para feedback:**
```typescript
import { useToast } from '@/components/ui/use-toast'

const { toast } = useToast()

toast({
  title: 'Success',
  description: 'Operation completed',
})

toast({
  title: 'Error',
  description: 'Something went wrong',
  variant: 'destructive',
})
```

**Error boundaries para crashes:**
```typescript
// src/components/ErrorBoundary.tsx (usar React Error Boundary)
```

---

### Acessibilidade

- Todos os componentes Shadcn/ui já têm acessibilidade (ARIA labels, keyboard nav)
- Formulários com labels corretos
- Cores com contraste adequado (WCAG AA)
- Focus visible em todos elementos interativos

---

### Performance

**Code splitting com lazy loading:**
```typescript
const CondominiumsList = lazy(() => import('@/features/condominiums/pages/CondominiumsList'))
```

**TanStack Query caching:**
- 5 minutos staleTime padrão
- Cache persiste entre navegações

**SSE para real-time:**
- Mais eficiente que polling
- Reconexão automática

---

### Environment Variables

**`.env.example`:**
```bash
# API URL (backend)
VITE_API_URL=http://localhost:8000

# Optional: Sentry DSN for error tracking
# VITE_SENTRY_DSN=

# Optional: Analytics
# VITE_ANALYTICS_ID=
```

**Nota:** Variáveis de ambiente devem começar com `VITE_` para serem expostas no frontend.

---

## Fim da Seção 7

**Próximas seções:**
- Seção 8: Testing Strategy (estratégia geral, CI/CD)
- Seção 9: Deployment (Vercel, Render, Neon)
- Seção 10: Roadmap de Implementação

---

[Voltar ao Índice](README.md)
