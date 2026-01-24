# 1. Visão Geral & Contexto

**Status:** ✅ Completo

---

## 1.1 Resumo Executivo

**Sistema de Votação para Assembleias de Condomínio** é uma solução SaaS multi-tenant desenvolvida para administradoras de condomínios gerenciarem assembleias presenciais com votação eletrônica via QR Code.

**Problema resolvido:**
- Assembleias presenciais com votação manual (mão alzada ou cédula) são lentas, propensas a erros e difíceis de auditar
- Controle de quórum em tempo real é manual e trabalhoso
- Geração de atas e relatórios é demorada e suscetível a erros

**Solução proposta:**
- Check-in digital via QR Code reutilizável por assembleia
- Votação eletrônica via smartphone (condôminos acessam via QR)
- Cálculo automático de resultados por unidades e frações ideais
- Dashboard em tempo real para operadores
- Geração automática de relatórios PDF

**Diferencial:**
- Simplicidade: condôminos não precisam instalar apps nem fazer cadastro
- Conformidade legal: segue lei de condomínios brasileira (voto secreto para condôminos, auditoria para operadores)
- Custo-benefício: deploy em free tiers inicialmente

---

## 1.2 Objetivos da v1.0 (MVP)

**Incluído nesta versão:**

✅ **Módulo de Votação Presencial Completo:**
- Gerenciamento de condomínios e assembleias
- Geração e distribuição de QR Codes reutilizáveis
- Check-in digital com scanner QR ou input manual
- Votação eletrônica em pautas (agendas)
- Dashboard de controle para operadores
- Cálculo automático de resultados e quórum
- Geração de relatórios PDF (presença, resultados, ata completa)
- Real-time updates via Server-Sent Events

✅ **Multi-tenancy:**
- Isolamento total entre administradoras
- Gerenciamento de múltiplos condomínios por tenant
- Usuários com roles (property_manager, assembly_operator)

✅ **Conformidade Legal:**
- Voto secreto para condôminos (não identificável no momento da votação)
- Auditoria completa para operadores (histórico de votos com timestamps)
- Histórico imutável (votos invalidados mantidos para auditoria)

**Não incluído (v2.0+):**
- ❌ Módulo de Apresentações (criação de slides para assembleia)
- ❌ Módulo de Ata (redação colaborativa durante assembleia)
- ❌ Votação remota/virtual (apenas presencial no MVP)
- ❌ Notificações push/email automáticas
- ❌ Integração com sistemas de gestão condominial

---

## 1.3 Público-Alvo do Documento

**Este documento técnico (SPEC) é destinado a:**

**Primário:**
- **Você (desenvolvedor)** - implementação do sistema
- **Claude Code/Codex** - assistente de código que lerá este SPEC

**Secundário:**
- Desenvolvedores futuros que darão manutenção
- Tech leads revisando arquitetura
- DevOps configurando infraestrutura

**Não é destinado a:**
- Usuários finais (administradoras ou condôminos)
- Stakeholders não-técnicos
- Documentação de vendas/marketing

**Formato:**
- Especificação técnica detalhada
- Código completo para features críticas/complexas
- Patterns replicáveis para features repetitivas
- Referências file-by-file para Claude Code

**Abordagem:**
Este SPEC segue uma abordagem **tática e imperativa**:
- "Crie o arquivo `X` com este código..."
- "Use este pattern para..."
- "Configure assim..."

Não é um documento de discussão ou exploração de alternativas (essas decisões já foram tomadas e estão documentadas na Seção 2).

---

## 1.4 Escopo e Limitações

### Escopo Funcional

**Dentro do escopo:**
- Gestão completa de assembleias presenciais
- Votação eletrônica em tempo real
- Check-in digital com QR Code
- Controle de quórum automático
- Geração de relatórios PDF
- Dashboard de operação em tempo real

**Fora do escopo (MVP):**
- Votação remota/online (requer outras preocupações de segurança)
- Módulo de apresentações (v2.0)
- Módulo de ata (v2.0)
- Integração com outros sistemas
- App mobile nativo (web mobile-first é suficiente)

### Escopo Técnico

**Tecnologias cobertas:**
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- Backend: Python 3.11+, FastAPI, SQLAlchemy, Alembic
- Database: PostgreSQL 14+
- Deploy: Vercel (frontend), Render (backend), Neon (database)

**Não coberto:**
- Infraestrutura on-premise
- Kubernetes/container orchestration complexa
- Mobile apps nativos (iOS/Android)
- Outros databases (MySQL, MongoDB, etc.)

### Limitações Conhecidas (MVP)

**Técnicas:**
- SSE tem limite de ~6 conexões simultâneas por browser (ok para operadores, condôminos usam polling via reload)
- Free tier Neon: 0.5 GB storage, 3 GB transfer (suficiente para ~50 assembleias/mês)
- Free tier Render: 750h/mês, sleep após inatividade (ok para MVP)

**Funcionais:**
- Sem recuperação de senha no MVP (admin reseta)
- Sem notificações automáticas (operador comunica manualmente)
- Sem suporte a múltiplas assembleias simultâneas no mesmo condomínio
- QR Codes não podem ser reutilizados entre assembleias (um QR = uma assembleia)

**Próximas versões abordarão:**
- Módulo de apresentações
- Módulo de ata
- Votação remota
- Notificações automáticas
- Integração com sistemas externos

---

## 1.5 Como Usar Este SPEC

**Para Implementação:**

```
1. Leia esta seção (1) para contexto geral
2. Leia Seção 2 para entender decisões técnicas
3. Leia Seção 10 (Roadmap) para ordem de implementação
4. Siga seções 5-7 file-by-file:
   - Seção 5: Database Schema
   - Seção 6: Backend Implementation
   - Seção 7: Frontend Implementation
5. Configure deploy conforme Seção 9
6. Implemente testes conforme Seção 8
```

**Para Claude Code:**

```bash
# Exemplo de prompts efetivos:
"Leia 05-database-schema.md seção 5.6.11 e crie a tabela votes"
"Implemente conforme 06-backend-implementation.md seção 6.7 (Voting System)"
"Crie o componente seguindo 07-frontend-implementation.md seção 7.7"
```

**Para Revisão:**
- Use o índice no README.md
- Cada seção é independente e pode ser lida isoladamente
- Seções técnicas (5-7) contêm código completo

**Para Manutenção:**
- Este documento deve ser atualizado quando arquitetura mudar
- Mantenha o SPEC sincronizado com o código implementado
- Use git para versionar mudanças no SPEC

---

[Voltar ao Índice](README.md)
