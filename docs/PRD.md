# PRD - Sistema de Votação para Assembleias de Condomínio

**Versão:** 1.0  
**Data:** 18 de Janeiro de 2026  
**Status:** Aprovado para Desenvolvimento

---

## 1. Visão Geral do Produto

### 1.1 Objetivo

Desenvolver um sistema web completo para gerenciamento de assembleias de condomínio, focando inicialmente no módulo de **Sistema de Votação**, que permitirá a realização de votações eletrônicas presenciais de forma ágil, transparente e em conformidade com a legislação brasileira (Lei 14.309/2022).

### 1.2 Problema a Resolver

Assembleias de condomínio tradicionalmente enfrentam diversos desafios:
- Votações manuais lentas e propensas a erros
- Dificuldade em atingir quórum necessário
- Falta de transparência nos resultados
- Processo trabalhoso de contagem de votos proporcionais às frações ideais
- Geração manual de documentos (atas, lista de presença, relatórios)
- Dificuldade de gestão quando há múltiplas procurações

### 1.3 Solução Proposta

Sistema multi-tenant que permite administradoras de condomínio gerenciar assembleias com:
- Votação eletrônica via QR Code (presencial)
- Cálculo automático baseado em frações ideais
- Controle de presença e procurações
- Atualizações em tempo real
- Geração automática de relatórios em PDF

### 1.4 Público-Alvo

- **Primário:** Administradoras de condomínios
- **Secundário:** Síndicos e secretários de assembleia
- **Terciário:** Condôminos participantes

### 1.5 Escopo do MVP (v1.0)

**Incluído:**
- Módulo de Votação Presencial
- Gestão multi-tenant (múltiplas administradoras)
- Sistema de QR Codes reutilizáveis
- Check-in e controle de presença
- Votação com frações ideais
- Geração de relatórios em PDF

**Não Incluído (v2.0 - Futuro):**
- Módulo de Criação de Apresentações
- Módulo de Registro de Ata
- Votação virtual/remota
- Sistema de auditoria e logs completo
- Integração com sistemas de gestão condominial

---

## 2. Requisitos Funcionais

### 2.1 Gestão de Usuários e Acessos

#### RF-001: Cadastro de Administradora
- Sistema deve permitir cadastro de administradoras com:
  - Nome da empresa
  - Email (único)
  - Senha (hash bcrypt)
- Cada administradora é um tenant isolado

#### RF-002: Gestão de Operadores
- Administradora pode criar usuários operadores com:
  - Nome
  - Email (único no sistema)
  - Senha
  - Role: operator
- Operadores têm acesso apenas às assembleias vinculadas a eles

#### RF-003: Autenticação
- Login via email e senha
- JWT token com duração de 7 dias
- Refresh token para renovação
- Diferentes níveis de acesso:
  - Admin (property_manager): acesso total ao tenant
  - Operator (assembly_operator): acesso apenas às assembleias vinculadas

### 2.2 Gestão de Condomínios

#### RF-004: Cadastro de Condomínio
- Administradora pode criar condomínios com:
  - Nome
  - Endereço completo
- Condomínios pertencem a uma única administradora

#### RF-005: Listagem de Condomínios
- Dashboard exibe todos os condomínios da administradora
- Acesso rápido às assembleias de cada condomínio

### 2.3 Gestão de Assembleias

#### RF-006: Criação de Assembleia
- Admin pode criar assembleia com:
  - Título
  - Condomínio (seleção)
  - Data da assembleia
  - Local
  - Tipo (Ordinária/Extraordinária)
  - Operador responsável (opcional - se vazio, admin opera)

#### RF-007: Importação de Unidades
- Upload de arquivo CSV com estrutura:
  ```
  unit_number,owner_name,ideal_fraction,cpf_cnpj
  ```
- Validações obrigatórias:
  - Arquivo CSV válido
  - 4 colunas obrigatórias presentes
  - unit_number sem duplicatas
  - ideal_fraction numérico > 0
  - cpf_cnpj em formato válido (CPF ou CNPJ)
  - Alerta se soma de frações ≠ 100% (não bloqueia)
- Preview das primeiras 10 linhas antes de confirmar
- Mensagens de erro específicas por linha em caso de falha
- Dados são snapshot imutável da assembleia

#### RF-008: Cadastro de Pautas
- Cadastro manual de pautas com:
  - Título
  - Descrição
  - Ordem (pode ser reorganizada via drag-and-drop)
  - Opções de voto (múltiplas escolhas)
- Permite adicionar novas pautas durante a assembleia

#### RF-009: Dashboard de Assembleias
- Listagem de próximas assembleias (ordenadas por data)
- Filtros: todas, rascunho, em andamento, encerradas
- Botão "Nova Assembleia" no dashboard principal

### 2.4 Sistema de QR Codes

#### RF-010: Geração de QR Codes
- Admin pode gerar QR Codes com:
  - Token único (UUID v4 - imprevisível)
  - Número visual sequencial (para organização física)
  - URL: `https://app.com/vote/{token}`
- Gerar múltiplos QR Codes de uma vez
- Download individual (PNG) ou lote (PDF)

#### RF-011: Gestão de QR Codes
- Listagem de QR Codes com filtros:
  - Status: Ativos (padrão) / Desativados / Todos
  - Status de uso: Em uso / Disponíveis
- Ações disponíveis:
  - Desativar (apenas se disponível, não em uso)
  - Reativar (se desativado)
  - Download
- QR Codes pertencem à administradora (reutilizáveis em assembleias)

#### RF-012: Layout de Impressão
- PDF para impressão em cartões físicos
- Tamanho: 10cm x 7cm
- Conteúdo: QR Code + número visual
- Múltiplos cartões por página A4

### 2.5 Check-in e Controle de Presença

#### RF-013: Vinculação de QR Code
- Operador pode vincular QR Code às unidades via:
  - **Opção A:** Scanner de câmera (mobile/desktop)
  - **Opção B:** Input manual do número visual (ex: "005")
- Após identificar QR Code, exibe lista de unidades para vincular

#### RF-014: Seleção de Unidades
- Interface com checkboxes para selecionar unidades
- Busca/filtro por número ou nome do proprietário
- **Atalho:** Botão "Selecionar todas de [Proprietário]"
  - Marca automaticamente todas as unidades do mesmo proprietário
- Toggle "É procuração?" para marcar unidades representadas por procurador

#### RF-015: Lista de Presença
- Exibição em tempo real de:
  - QR Code usado
  - Unidades vinculadas
  - Nome do proprietário
  - Fração ideal total
  - Indicação (P) se for procuração
- Ações por registro:
  - Desvincular QR Code
  - Editar unidades vinculadas

#### RF-016: Resumo de Quórum
- Card/sidebar com:
  - QR Codes em uso
  - Unidades presentes
  - Fração ideal presente (%)
  - Indicador visual se quórum atingido (≥ 50%)

### 2.6 Sistema de Votação

#### RF-017: Controle de Pautas
- Operador pode:
  - Abrir pauta (uma por vez)
  - Fechar pauta (após votação)
  - Pular pautas (ordem flexível)
  - Adicionar novas pautas durante assembleia
  - Editar pauta aberta (título, descrição, opções)
  - Cancelar/reabrir pauta (se necessário)

#### RF-018: Tela de Votação (Condômino)
- Acesso via escaneamento de QR Code
- Exibe:
  - Nome da assembleia
  - Unidades vinculadas ao QR Code
- Estados possíveis:
  - **Aguardando:** "Aguardando próxima votação..."
  - **Votação aberta:** Título, descrição, opções (radio buttons)
  - **Votado:** "Voto registrado com sucesso!"
  - **Encerrada:** "Assembleia encerrada. Obrigado!"

#### RF-019: Regras de Votação
- Cada unidade pode votar apenas **1 vez por pauta**
- Constraint de banco: UNIQUE(agenda_id, assembly_unit_id)
- Voto é imutável após confirmação
- Múltipla escolha com seleção única (radio button)
- Votação só permitida se pauta estiver aberta

#### RF-020: Cálculo de Votos
- Sistema calcula automaticamente:
  - Total de votos por opção (contagem de unidades)
  - Percentual por opção baseado em unidades votantes
  - Percentual por opção baseado em frações ideais
- Exemplo:
  - Opção A: 25 votos (55.6% das unidades, 38.2% da fração ideal)

#### RF-021: Monitoramento em Tempo Real
- Painel do operador atualiza automaticamente:
  - Contador de votos: "23/45 unidades votaram"
  - Lista de unidades que faltam votar
  - Status de conexão
- Tecnologia: Server-Sent Events (SSE) ou WebSockets

#### RF-022: Invalidação de Votos
- Operador pode:
  - Cancelar voto específico de uma unidade
  - Permite que unidade vote novamente
- Usado em casos de erro ou solicitação do condômino

### 2.7 Geração de Relatórios

#### RF-023: Lista de Presença (PDF)
- Conteúdo:
  - Header: Nome do condomínio, título da assembleia, data, local, tipo
  - Resumo:
    - Total de unidades do condomínio
    - Unidades presentes
    - Fração ideal presente (%)
    - Quórum atingido (✓/✗)
  - Tabela ordenada:
    - Unidade | Proprietário | Fração Ideal | Procuração
    - Indicação (P) para unidades com procuração
  - Footer: Data de geração, total de páginas

#### RF-024: Resultado Detalhado por Pauta (PDF)
- Um documento por pauta contendo:
  - Header: Condomínio, assembleia, número e título da pauta
  - Descrição da pauta
  - Resumo da votação:
    - Total de unidades presentes
    - Unidades que votaram
    - Fração ideal total votante
  - Resultado por opção:
    - Votos absolutos
    - Percentual sobre unidades
    - Percentual sobre frações ideais
  - **Voto Nominal (visível apenas para operador):**
    - Tabela: Unidade | Proprietário | Fração | Voto
    - Todas as unidades que votaram
  - Footer: Campo para "Resultado: APROVADO/REPROVADO" (preenchimento manual)

#### RF-025: Relatório Geral da Assembleia (PDF)
- Resumo executivo com:
  - Header: Condomínio, assembleia, data, local, tipo
  - Informações gerais:
    - Quórum de instalação
    - Nome do operador
    - Duração (calculada automaticamente)
  - Resumo das pautas (tabela):
    - Número | Título da Pauta | Resultado Principal
  - Participação:
    - Unidades presentes
    - Procurações (quantidade e %)
    - Taxa de votação média

#### RF-026: Tecnologia de PDFs
- Backend: Python + WeasyPrint
- Templates em HTML + CSS (Jinja2)
- Suporta tabelas complexas, headers/footers, quebras de página
- PDFs profissionais prontos para registro em cartório

### 2.8 Segurança

#### RF-027: Isolamento Multi-Tenant
- Todas as queries incluem filtro por property_manager_id
- Impossível acessar dados de outra administradora
- Schemas PostgreSQL separados ou coluna discriminadora

#### RF-028: Validação de QR Codes
- Mensagens específicas ao escanear:
  - Token inválido: "QR Code inválido"
  - Token não vinculado: "Aguardando check-in. Procure o secretário"
  - Sem pauta aberta: "Nenhuma votação em andamento"
  - Assembleia encerrada: "Esta assembleia foi encerrada"
  - QR Code desativado: "QR Code desativado. Procure o administrador"

#### RF-029: Proteções de Segurança
- CORS configurado apenas para domínios autorizados
- Rate limiting (evita spam de votação)
- Tokens UUID v4 (imprevisíveis)
- HTTPS obrigatório em produção
- Sanitização de inputs (SQL injection, XSS)
- Senhas com hash bcrypt

---

## 3. Requisitos Não-Funcionais

### 3.1 Performance

**RNF-001:** O sistema deve suportar pelo menos 200 usuários votando simultaneamente sem degradação de performance.

**RNF-002:** Atualizações em tempo real devem ter latência máxima de 2 segundos.

**RNF-003:** Geração de PDFs deve levar no máximo 10 segundos para assembleias com até 500 unidades.

### 3.2 Disponibilidade

**RNF-004:** Sistema deve ter disponibilidade de 99% durante horários de assembleia (18h-23h, fins de semana).

**RNF-005:** Sistema deve funcionar com degradação graciosa se internet estiver instável:
- Retry automático de votos (3 tentativas)
- Feedback claro ao usuário sobre status de envio
- Alertas ao operador sobre votos pendentes

### 3.3 Usabilidade

**RNF-006:** Interface deve ser responsiva e funcionar em:
- Desktop (Chrome, Firefox, Safari, Edge)
- Tablets (iPad, Android)
- Smartphones (iOS 14+, Android 10+)

**RNF-007:** Tela de votação deve ter fonte mínima de 16px para acessibilidade.

**RNF-008:** Scanner de QR Code deve funcionar em ambientes com iluminação variável.

**RNF-009:** Processo de check-in deve levar no máximo 30 segundos por condômino.

### 3.4 Escalabilidade

**RNF-010:** Arquitetura deve suportar crescimento para:
- 100+ administradoras
- 1000+ condomínios
- 10.000+ assembleias anuais

**RNF-011:** Banco de dados deve suportar retenção de dados históricos de pelo menos 5 anos.

### 3.5 Segurança e Privacidade

**RNF-012:** Sistema deve estar em conformidade com LGPD:
- Consentimento explícito para uso de dados
- Direito de exclusão de dados pessoais
- Criptografia de dados sensíveis em trânsito e em repouso

**RNF-013:** Senhas devem seguir padrão mínimo:
- Mínimo 8 caracteres
- Hash bcrypt com salt

**RNF-014:** Sessões inativas devem expirar após 30 minutos de inatividade.

### 3.6 Manutenibilidade

**RNF-015:** Código deve ter cobertura de testes de pelo menos 70%.

**RNF-016:** Documentação técnica deve estar atualizada e incluir:
- Setup de desenvolvimento
- Arquitetura do sistema
- Guia de deploy
- Troubleshooting comum

---

## 4. Modelo de Dados

### 4.1 Entidades Principais

#### property_managers (administradoras)
```
id                  UUID PRIMARY KEY
name                VARCHAR(255) NOT NULL
email               VARCHAR(255) UNIQUE NOT NULL
password_hash       VARCHAR(255) NOT NULL
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

#### users (usuários do sistema)
```
id                  UUID PRIMARY KEY
property_manager_id UUID FK -> property_managers.id
name                VARCHAR(255) NOT NULL
email               VARCHAR(255) UNIQUE NOT NULL
password_hash       VARCHAR(255) NOT NULL
role                ENUM('admin', 'operator') NOT NULL
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

INDEX(property_manager_id)
INDEX(email)
```

#### condominiums (condomínios)
```
id                  UUID PRIMARY KEY
property_manager_id UUID FK -> property_managers.id
name                VARCHAR(255) NOT NULL
address             TEXT
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

INDEX(property_manager_id)
```

#### assemblies (assembleias)
```
id                  UUID PRIMARY KEY
condominium_id      UUID FK -> condominiums.id
title               VARCHAR(255) NOT NULL
assembly_date       DATE NOT NULL
location            VARCHAR(255)
type                ENUM('ordinary', 'extraordinary') NOT NULL
status              ENUM('draft', 'in_progress', 'closed') DEFAULT 'draft'
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

INDEX(condominium_id)
INDEX(assembly_date)
INDEX(status)
```

#### assembly_operators (operadores por assembleia)
```
id                  UUID PRIMARY KEY
assembly_id         UUID FK -> assemblies.id
user_id             UUID FK -> users.id
created_at          TIMESTAMP DEFAULT NOW()

UNIQUE(assembly_id, user_id)
INDEX(assembly_id)
INDEX(user_id)
```

#### assembly_units (unidades - snapshot por assembleia)
```
id                  UUID PRIMARY KEY
assembly_id         UUID FK -> assemblies.id
unit_number         VARCHAR(50) NOT NULL
owner_name          VARCHAR(255) NOT NULL
ideal_fraction      DECIMAL(5,2) NOT NULL CHECK (ideal_fraction > 0)
cpf_cnpj            VARCHAR(18) NOT NULL
is_present          BOOLEAN DEFAULT FALSE
is_proxy            BOOLEAN DEFAULT FALSE
created_at          TIMESTAMP DEFAULT NOW()

INDEX(assembly_id)
INDEX(unit_number)
```

#### agendas (pautas)
```
id                  UUID PRIMARY KEY
assembly_id         UUID FK -> assemblies.id
order_index         INTEGER NOT NULL
title               VARCHAR(255) NOT NULL
description         TEXT
status              ENUM('pending', 'open', 'closed') DEFAULT 'pending'
opened_at           TIMESTAMP
closed_at           TIMESTAMP
created_at          TIMESTAMP DEFAULT NOW()

INDEX(assembly_id)
INDEX(order_index)
INDEX(status)
```

#### vote_options (opções de voto)
```
id                  UUID PRIMARY KEY
agenda_id           UUID FK -> agendas.id
text                VARCHAR(255) NOT NULL
order_index         INTEGER NOT NULL
created_at          TIMESTAMP DEFAULT NOW()

INDEX(agenda_id)
```

#### votes (votos)
```
id                  UUID PRIMARY KEY
agenda_id           UUID FK -> agendas.id
assembly_unit_id    UUID FK -> assembly_units.id
vote_option_id      UUID FK -> vote_options.id
voted_at            TIMESTAMP DEFAULT NOW()

UNIQUE(agenda_id, assembly_unit_id)
INDEX(agenda_id)
INDEX(assembly_unit_id)
```

#### qr_codes
```
id                  UUID PRIMARY KEY
token               UUID UNIQUE NOT NULL
visual_number       INTEGER NOT NULL
property_manager_id UUID FK -> property_managers.id
is_active           BOOLEAN DEFAULT TRUE
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

INDEX(property_manager_id)
INDEX(token)
INDEX(visual_number)
INDEX(is_active)
```

### 4.2 Relacionamentos

- property_managers 1:N users
- property_managers 1:N condominiums
- property_managers 1:N qr_codes
- condominiums 1:N assemblies
- assemblies 1:N assembly_units (snapshot imutável)
- assemblies 1:N agendas
- assemblies N:N users (através de assembly_operators)
- agendas 1:N vote_options
- agendas 1:N votes
- votes N:1 assembly_units
- votes N:1 vote_options

---

## 5. Stack Tecnológica

### 5.1 Frontend

**Framework:** React 18 + TypeScript  
**Build Tool:** Vite  
**Routing:** React Router v6  
**Styling:** Tailwind CSS + Shadcn/ui  
**State Management:** Zustand ou Context API  
**Data Fetching:** TanStack Query (React Query)  
**Real-time:** EventSource (SSE)  
**QR Code:** qrcode.react (geração) + html5-qrcode (scanner)  
**Forms:** React Hook Form + Zod (validação)

### 5.2 Backend

**Framework:** Python 3.11+ + FastAPI  
**ORM:** SQLAlchemy  
**Migrations:** Alembic  
**Validation:** Pydantic  
**Authentication:** python-jose (JWT) + passlib (bcrypt)  
**PDF Generation:** WeasyPrint  
**Template Engine:** Jinja2  
**Real-time:** SSE (Server-Sent Events)  
**CSV Processing:** pandas + python-csv

### 5.3 Banco de Dados

**Database:** PostgreSQL 14+  
**Hosting:** Neon (plano gratuito para começar)  
**Backup:** Snapshots diários automatizados

### 5.4 Deploy e Infraestrutura

**Frontend:** Vercel (plano gratuito)  
**Backend:** Render (plano gratuito com sleep)  
**CI/CD:** GitHub Actions  
**Monitoramento:** Sentry (erro tracking)  
**Analytics:** Plausible ou Posthog

### 5.5 Custo Estimado

**Fase Inicial (MVP):**
- Frontend: $0/mês (Vercel free)
- Backend: $0/mês (Render free com sleep)
- Database: $0/mês (Neon free tier)
- **Total: $0/mês**

**Produção (após primeiros clientes):**
- Frontend: $0/mês (Vercel free ainda suficiente)
- Backend: $7/mês (Render sem sleep)
- Database: $19/mês (Neon sem sleep, 10GB)
- **Total: ~$26/mês**

---

## 6. Casos de Uso Principais

### 6.1 CU-001: Criar Nova Assembleia

**Ator:** Administrador  
**Pré-condição:** Usuário autenticado como admin  

**Fluxo Principal:**
1. Admin acessa dashboard
2. Clica em "Nova Assembleia"
3. Preenche formulário:
   - Título
   - Seleciona condomínio
   - Define data e local
   - Escolhe tipo (ordinária/extraordinária)
   - Seleciona operador (opcional)
4. Faz upload de CSV com unidades
5. Sistema valida planilha e exibe preview
6. Admin confirma importação
7. Admin cadastra pautas manualmente
8. Salva assembleia como rascunho
9. Publica assembleia

**Fluxo Alternativo 5a:** Erro na planilha
- Sistema exibe lista de erros por linha
- Admin corrige planilha e faz novo upload

**Pós-condição:** Assembleia criada e pronta para execução

### 6.2 CU-002: Realizar Check-in de Condômino

**Ator:** Operador (secretário)  
**Pré-condição:** Assembleia em andamento, QR Codes impressos  

**Fluxo Principal (Scanner):**
1. Operador acessa painel da assembleia
2. Abre aba "Check-in"
3. Clica "Abrir Câmera"
4. Condômino apresenta QR Code físico
5. Sistema escaneia e identifica automaticamente
6. Sistema exibe unidades do proprietário
7. Operador clica "Selecionar todas de [Proprietário]"
8. Se for procuração, ativa toggle "É procuração?"
9. Confirma vinculação
10. Sistema marca unidades como presentes

**Fluxo Alternativo (Desktop - Input Manual):**
3. Operador digita número visual do QR Code (ex: "005")
4. Sistema identifica e carrega unidades
5. Continua do passo 7

**Fluxo Alternativo (Procuração Múltipla):**
6. Sistema exibe todas as unidades da assembleia
7. Operador seleciona manualmente unidades de proprietários diferentes
8. Ativa toggle "É procuração?"
9. Continua do passo 9

**Pós-condição:** Unidades marcadas como presentes, QR Code vinculado

### 6.3 CU-003: Conduzir Votação de Pauta

**Ator:** Operador  
**Pré-condição:** Check-in concluído, condôminos presentes  

**Fluxo Principal:**
1. Operador acessa aba "Votação"
2. Seleciona pauta na lista
3. Clica "Abrir Votação"
4. Sistema notifica todas as telas de votação em tempo real
5. Condôminos veem pauta no celular/totem
6. Condôminos selecionam opção e confirmam voto
7. Sistema atualiza contador "X/Y votaram" em tempo real
8. Operador monitora lista de faltantes
9. Quando todos votarem (ou quando decidir), operador clica "Fechar Votação"
10. Sistema calcula e exibe resultado
11. Resultado pode ser projetado no telão

**Fluxo Alternativo 6a:** Voto duplicado
- Sistema impede e exibe mensagem "Você já votou nesta pauta"

**Fluxo Alternativo 8a:** Condômino votou errado
- Operador pode invalidar voto específico
- Condômino vota novamente

**Pós-condição:** Pauta votada e resultado calculado

### 6.4 CU-004: Gerar Relatórios da Assembleia

**Ator:** Operador  
**Pré-condição:** Assembleia encerrada ou em andamento  

**Fluxo Principal:**
1. Operador acessa aba "Relatórios"
2. Visualiza preview de:
   - Lista de presença
   - Resultados por pauta
   - Relatório geral
3. Clica em "Baixar PDF" do relatório desejado
4. Backend gera PDF via WeasyPrint
5. Sistema retorna arquivo para download
6. Operador pode imprimir ou enviar por email

**Pós-condição:** PDFs gerados e disponíveis para download

### 6.5 CU-005: Votar em Pauta (Condômino)

**Ator:** Condômino  
**Pré-condição:** Check-in realizado, pauta aberta  

**Fluxo Principal:**
1. Condômino escaneia QR Code físico com celular
2. Sistema abre tela de votação automaticamente
3. Condômino vê:
   - Nome da assembleia
   - Suas unidades vinculadas
   - Pauta aberta com descrição
   - Opções de voto
4. Condômino seleciona opção (radio button)
5. Clica "Confirmar Voto"
6. Sistema valida e registra voto
7. Exibe "Voto registrado com sucesso!"
8. Aguarda próxima pauta

**Fluxo Alternativo 3a:** Nenhuma pauta aberta
- Exibe "Aguardando próxima votação..."

**Fluxo Alternativo 6a:** Conexão falhou
- Sistema tenta reenviar automaticamente (3x)
- Exibe feedback "Enviando... tentativa 2/3"
- Se falhar, pede para chamar secretário

**Pós-condição:** Voto registrado no sistema

---

## 7. Jornadas de Usuário

### 7.1 Jornada do Administrador

**Antes da Assembleia:**
1. Login no sistema
2. Cria novo condomínio (se ainda não existe)
3. Cria nova assembleia
4. Faz upload da planilha de unidades
5. Cadastra pautas
6. Se necessário, cria usuário operador e vincula à assembleia
7. Gera QR Codes e imprime cartões
8. Publica assembleia

**Durante a Assembleia:**
- Pode acompanhar remotamente se não estiver operando
- Monitora estatísticas gerais

**Após a Assembleia:**
- Revisa relatórios gerados pelo operador
- Arquiva documentação

### 7.2 Jornada do Operador

**Preparação:**
1. Login no sistema
2. Acessa assembleia do dia
3. Verifica lista de unidades importadas
4. Organiza QR Codes físicos

**Durante a Assembleia:**
1. Realiza check-in conforme condôminos chegam
2. Monitora quórum
3. Abre primeira pauta quando quórum atingido
4. Monitora votação em tempo real
5. Fecha pauta quando apropriado
6. Repete para todas as pautas
7. Gera relatórios ao final

**Após a Assembleia:**
1. Encerra assembleia no sistema
2. Baixa PDFs para registro
3. Envia documentos aos responsáveis

### 7.3 Jornada do Condômino

**Chegada:**
1. Apresenta-se ao secretário
2. Recebe QR Code físico vinculado às suas unidades

**Durante Votação:**
1. Escaneia QR Code quando pauta abre
2. Lê descrição da pauta
3. Vota na opção desejada
4. Aguarda próxima pauta
5. Repete até fim da assembleia

**Saída:**
1. Devolve QR Code ao secretário (opcional)
2. Aguarda disponibilização de ata

---

## 8. Fluxos de Dados

### 8.1 Fluxo de Importação de Unidades

```
1. Admin faz upload de CSV
   ↓
2. Backend recebe arquivo
   ↓
3. Validação de formato e estrutura
   ↓
4. Parse linha por linha
   ↓
5. Validação de dados:
   - unit_number duplicado?
   - ideal_fraction válido?
   - cpf_cnpj formato correto?
   ↓
6a. Se erros: retorna lista de erros
6b. Se OK: salva em assembly_units
   ↓
7. Frontend exibe preview
   ↓
8. Admin confirma
   ↓
9. Dados persistidos (snapshot da assembleia)
```

### 8.2 Fluxo de Votação em Tempo Real

```
OPERADOR                    BACKEND                     VOTANTE
   |                           |                           |
   |--"Abrir Pauta #1"-------->|                           |
   |                           |                           |
   |                           |--Update DB (status=open)->|
   |                           |                           |
   |                           |--SSE: nova_pauta--------->|
   |                           |                           |
   |                           |                    Exibe pauta
   |                           |                           |
   |                           |<----"Confirmar Voto"------|
   |                           |                           |
   |                  Valida voto                          |
   |                           |                           |
   |                  Salva em DB                          |
   |                           |                           |
   |<--SSE: novo_voto----------|                           |
   |                           |                           |
Atualiza contador             |--Sucesso------------------>|
   |                           |                           |
   |                           |                   Exibe confirmação
   |                           |                           |
   |--"Fechar Pauta"---------->|                           |
   |                           |                           |
   |                   Calcula resultado                   |
   |                           |                           |
   |<--Resultado---------------|                           |
   |                           |                           |
Exibe resultado               |--SSE: pauta_fechada------>|
   |                           |                           |
   |                           |                    Remove opções
```

### 8.3 Fluxo de Geração de PDF

```
1. Operador clica "Baixar PDF"
   ↓
2. Backend recebe requisição
   ↓
3. Busca dados do banco:
   - Assembleia
   - Unidades presentes
   - Votos
   - Resultados
   ↓
4. Renderiza template Jinja2
   ↓
5. WeasyPrint converte HTML → PDF
   ↓
6. Retorna arquivo para frontend
   ↓
7. Browser inicia download
```

---

## 9. Wireframes Conceituais

### 9.1 Dashboard Admin

```
┌─────────────────────────────────────────────────────┐
│  LOGO                        [Meu Perfil] [Sair]    │
├─────────────────────────────────────────────────────┤
│  Dashboard  |  Condomínios  |  Usuários  |  QR Codes│
├─────────────────────────────────────────────────────┤
│                                                      │
│  Próximas Assembleias           [+ Nova Assembleia] │
│  ┌──────────────────────────────────────────────┐   │
│  │ 20/01/2026 - Condomínio Sunset                │   │
│  │ Assembleia Ordinária Anual                    │   │
│  │ Status: Rascunho           [Editar] [Abrir]  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 25/01/2026 - Residencial Harmonia            │   │
│  │ Assembleia Extraordinária                     │   │
│  │ Status: Publicada          [Ver] [Operar]    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Meus Condomínios                  [+ Novo Condomínio]│
│  ┌────────────────┐  ┌────────────────┐            │
│  │ Condomínio A   │  │ Condomínio B   │            │
│  │ 150 unidades   │  │ 80 unidades    │            │
│  │ 5 assembleias  │  │ 3 assembleias  │            │
│  └────────────────┘  └────────────────┘            │
└─────────────────────────────────────────────────────┘
```

### 9.2 Painel do Operador - Aba Votação

```
┌─────────────────────────────────────────────────────┐
│  Assembleia Ordinária 2026 - Condomínio Sunset      │
│  20/01/2026 - 19h00 - Salão de Festas              │
│                                   [Encerrar Assembleia]│
├─────────────────────────────────────────────────────┤
│  [Check-in]  [Votação]  [Relatórios]                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Pauta #1: Aprovação de Contas 2025                │
│  Status: ABERTA        Votaram: 45/45 (100%)        │
│  ┌──────────────────────────────────────────────┐   │
│  │ Unidades que faltam votar: (nenhuma)         │   │
│  └──────────────────────────────────────────────┘   │
│  [Fechar Votação] [Cancelar Pauta]                  │
│                                                      │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  Pauta #2: Eleição de Síndico                       │
│  Status: PENDENTE                                   │
│  [Abrir Votação] [Editar]                           │
│                                                      │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  Pauta #3: Obra na Piscina                          │
│  Status: PENDENTE                                   │
│  [Abrir Votação] [Editar]                           │
│                                                      │
│  [+ Adicionar Nova Pauta]                           │
└─────────────────────────────────────────────────────┘
```

### 9.3 Tela de Votação (Mobile)

```
┌──────────────────────┐
│ Assembleia Ordinária │
│ Condomínio Sunset    │
│                      │
│ Suas unidades:       │
│ 101, 102             │
├──────────────────────┤
│                      │
│ Pauta #1             │
│ Aprovação de Contas  │
│ 2025                 │
│                      │
│ Descrição:           │
│ Aprovar as contas... │
│                      │
│ ┌──────────────────┐ │
│ │  ○ Sim           │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │  ○ Não           │ │
│ └──────────────────┘ │
│                      │
│ [Confirmar Voto]     │
│                      │
└──────────────────────┘
```

---

## 10. Roadmap

### 10.1 Fase 1: MVP - Sistema de Votação Presencial (v1.0)
**Prazo:** 3-4 meses  
**Objetivo:** Lançar módulo de votação presencial funcional

**Sprint 1-2 (4 semanas):** Setup e Autenticação
- Setup do projeto (frontend + backend)
- Autenticação e autorização
- Gestão de usuários (admin + operadores)
- Multi-tenancy básico

**Sprint 3-4 (4 semanas):** Gestão de Condomínios e Assembleias
- CRUD de condomínios
- CRUD de assembleias
- Importação de planilha CSV
- Cadastro de pautas

**Sprint 5-6 (4 semanas):** QR Codes e Check-in
- Geração de QR Codes
- Gestão de QR Codes (ativar/desativar)
- Interface de check-in (scanner + manual)
- Vinculação de unidades
- Lista de presença em tempo real

**Sprint 7-8 (4 semanas):** Sistema de Votação
- Interface de votação (condômino)
- Controle de pautas (operador)
- Votação com frações ideais
- Real-time via SSE
- Invalidação de votos

**Sprint 9-10 (4 semanas):** Relatórios e Ajustes
- Geração de PDFs (lista de presença, resultados, relatório geral)
- Testes end-to-end
- Ajustes de UX
- Documentação

**Sprint 11-12 (4 semanas):** Beta Testing e Launch
- Testes com condomínios reais
- Correções de bugs
- Performance optimization
- Deploy em produção

### 10.2 Fase 2: Melhorias e Votação Virtual (v2.0)
**Prazo:** 2-3 meses após v1.0  
**Objetivo:** Expandir para votação remota

**Features:**
- Votação virtual (condôminos votam de casa)
- Assembleia híbrida (presencial + virtual simultâneo)
- Videoconferência integrada
- Chat entre participantes
- Sistema de auditoria completo
- Logs detalhados de ações
- Backup automático de dados

### 10.3 Fase 3: Módulos Adicionais (v3.0)
**Prazo:** A definir  
**Objetivo:** Completar suite de gestão de assembleias

**Módulo de Apresentações:**
- Criação de slides de prestação de contas
- Templates pré-definidos
- Importação de planilhas financeiras
- Gráficos automáticos

**Módulo de Ata:**
- Editor de ata integrado
- Geração automática baseada em votações
- Assinaturas digitais
- Integração com cartórios (opcional)

**Integrações:**
- Sistemas de gestão condominial (Superlógica, uCondo, etc.)
- WhatsApp (convocações e lembretes)
- Email marketing
- Armazenamento em nuvem (Google Drive, Dropbox)

---

## 11. Riscos e Mitigações

### 11.1 Riscos Técnicos

**R-001: Internet instável durante assembleia**
- **Impacto:** Alto
- **Probabilidade:** Média
- **Mitigação:** 
  - Retry automático de votos
  - Feedback claro ao usuário
  - Plano B: votação manual em caso extremo

**R-002: Performance degradada com muitos usuários simultâneos**
- **Impacto:** Alto
- **Probabilidade:** Baixa
- **Mitigação:**
  - Testes de carga antes do launch
  - Infraestrutura escalável (serverless quando possível)
  - Monitoramento em tempo real (Sentry)

**R-003: Falha na geração de PDFs**
- **Impacto:** Médio
- **Probabilidade:** Baixa
- **Mitigação:**
  - Testes extensivos com diferentes volumes de dados
  - Timeout adequado na geração
  - Opção de regenerar PDFs

### 11.2 Riscos de Negócio

**R-004: Resistência à adoção de tecnologia**
- **Impacto:** Alto
- **Probabilidade:** Média
- **Mitigação:**
  - UX extremamente simples e intuitiva
  - Treinamento para operadores
  - Suporte dedicado no lançamento
  - Demonstrações práticas

**R-005: Concorrência com sistemas estabelecidos**
- **Impacto:** Médio
- **Probabilidade:** Alta
- **Mitigação:**
  - Foco em diferenciais (facilidade de uso, custo, suporte)
  - Integração com sistemas existentes
  - Pricing competitivo

**R-006: Mudanças na legislação**
- **Impacto:** Alto
- **Probabilidade:** Baixa
- **Mitigação:**
  - Monitoramento de mudanças legais
  - Arquitetura flexível para adaptações
  - Consultoria jurídica especializada

### 11.3 Riscos de Segurança

**R-007: Vazamento de dados de votação**
- **Impacto:** Crítico
- **Probabilidade:** Baixa
- **Mitigação:**
  - Criptografia de dados sensíveis
  - Testes de penetração
  - Auditorias de segurança regulares
  - Conformidade com LGPD

**R-008: Fraude em votações**
- **Impacto:** Crítico
- **Probabilidade:** Baixa
- **Mitigação:**
  - QR Codes únicos e imprevisíveis
  - Constraint de voto único por unidade/pauta
  - Logs de auditoria (v2.0)
  - Possibilidade de invalidar votações suspeitas

---

## 12. Métricas de Sucesso

### 12.1 KPIs de Produto

**Adoção:**
- Número de administradoras cadastradas
- Número de condomínios ativos
- Número de assembleias realizadas/mês
- Taxa de retenção mensal

**Engajamento:**
- Taxa de participação média em assembleias (meta: >60%)
- Tempo médio de check-in por condômino (meta: <30s)
- Taxa de conclusão de votações (meta: >95%)

**Performance:**
- Uptime do sistema (meta: >99%)
- Latência média de votos (meta: <2s)
- Tempo de geração de PDFs (meta: <10s)

**Qualidade:**
- Taxa de erro em votações (meta: <1%)
- NPS (Net Promoter Score) (meta: >50)
- Tickets de suporte/assembleia (meta: <2)

### 12.2 KPIs de Negócio

**Receita:**
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- Churn rate (meta: <5%/mês)

**Crescimento:**
- Taxa de crescimento mensal de usuários
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- LTV/CAC ratio (meta: >3)

---

## 13. Glossário

**Administradora:** Empresa que gerencia múltiplos condomínios e suas assembleias.

**Assembleia:** Reunião de condôminos para deliberar sobre assuntos do condomínio.

**Assembleia Ordinária:** Assembleia regular, realizada anualmente, para aprovação de contas e eleição de síndico.

**Assembleia Extraordinária:** Assembleia convocada para tratar de assuntos urgentes ou específicos.

**Condomínio:** Conjunto de unidades habitacionais com áreas comuns compartilhadas.

**Fração Ideal:** Percentual de propriedade de cada unidade sobre as áreas comuns do condomínio. Usado para cálculo de votos proporcionais.

**Multi-tenant:** Arquitetura onde múltiplos clientes (tenants) usam a mesma instância do sistema, com dados completamente isolados.

**Operador:** Usuário responsável por conduzir a assembleia (secretário ou síndico).

**Pauta:** Item específico a ser votado na assembleia.

**Procuração:** Documento que permite um condômino representar outro(s) na assembleia.

**Property Manager:** Termo em inglês para administradora (usado no código).

**QR Code:** Código de barras bidimensional usado para autenticação e votação.

**Quórum:** Percentual mínimo de presença necessário para validar uma assembleia ou votação específica.

**Snapshot:** Cópia imutável dos dados em um momento específico. Assembleias armazenam snapshots de unidades.

**SSE (Server-Sent Events):** Tecnologia para comunicação em tempo real do servidor para o cliente.

**Unidade:** Apartamento, casa ou loja dentro do condomínio.

---

## 14. Anexos

### 14.1 Exemplo de CSV de Importação

```csv
unit_number,owner_name,ideal_fraction,cpf_cnpj
101,João Silva,2.5,123.456.789-00
102,João Silva,2.5,123.456.789-00
103,Maria Santos,3.0,987.654.321-00
104,Pedro Costa Ltda,2.8,45.678.901/0001-23
105,Ana Oliveira,2.2,111.222.333-44
201,Carlos Souza,3.5,555.666.777-88
202,Patricia Lima,2.7,999.888.777-66
203,Roberto Alves,2.8,123.987.456-00
```

### 14.2 Exemplo de Template de Pauta

**Título:** Aprovação de Contas do Exercício 2025

**Descrição:**
Aprovar as contas apresentadas pelo síndico referentes ao exercício de 2025, incluindo:
- Receitas totais: R$ 250.000,00
- Despesas totais: R$ 245.000,00
- Saldo atual: R$ 5.000,00

**Opções:**
1. Sim - Aprovar as contas
2. Não - Rejeitar as contas

---

**Título:** Eleição de Síndico para o Biênio 2026-2027

**Descrição:**
Escolher o síndico que administrará o condomínio pelos próximos 2 anos.

**Opções:**
1. João Silva - Unidade 101
2. Maria Santos - Unidade 103
3. Carlos Souza - Unidade 201

---

**Título:** Aprovação de Obra na Piscina

**Descrição:**
Aprovar reforma completa da piscina com orçamento de R$ 80.000,00, incluindo:
- Troca de revestimento
- Modernização do sistema de filtragem
- Nova iluminação LED
Prazo de execução: 60 dias

**Opções:**
1. Sim - Aprovar a obra com o orçamento apresentado
2. Não - Rejeitar a proposta
3. Aprovar, mas solicitar novo orçamento

### 14.3 Referências Legais

- **Lei 14.309/2022:** Permite realização de assembleias virtuais e híbridas
- **Código Civil (Lei 10.406/2002):**
  - Art. 1.335: Direitos do condômino (incluindo direito de voto)
  - Art. 1.350: Convocação de assembleias ordinárias
  - Art. 1.354-A: Assembleias eletrônicas
- **Lei 4.591/1964:**
  - Art. 24: Quóruns de votação
  - § 3º: Votos proporcionais às frações ideais
- **LGPD (Lei 13.709/2018):** Proteção de dados pessoais

### 14.4 Contatos do Projeto

**Product Owner:** [Nome]  
**Tech Lead:** [Nome]  
**UX Designer:** [Nome]  
**Desenvolvedor Backend:** [Nome]  
**Desenvolvedor Frontend:** [Nome]

---

**Fim do PRD - Sistema de Votação para Assembleias de Condomínio v1.0**
