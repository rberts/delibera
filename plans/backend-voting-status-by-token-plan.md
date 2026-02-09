# Plano: Correção Backend para Fluxo Público de Votação por QR Code

## Resumo
Implementar no backend o suporte completo ao fluxo público de votação por QR Code, fechando o gap atual que impede o frontend `/vote/:token` de funcionar sem autenticação de usuário.
Escopo principal:
1. criar `GET /api/v1/voting/status/{token}` com respostas alinhadas ao PRD;
2. tornar `POST /api/v1/voting/vote` público por `qr_token` (sem JWT);
3. manter isolamento multi-tenant e regras de votação já existentes;
4. adicionar testes de integração para status + voto público.

## Mudanças de API/Interfaces (públicas)

### 1) Novo endpoint
`GET /api/v1/voting/status/{qr_token}`

#### Objetivo
Entregar o estado da sessão pública de votação para o QR informado.

#### Resposta 200 (contrato)
```json
{
  "assembly": {
    "id": 1,
    "title": "Assembleia X",
    "status": "in_progress|draft|finished|cancelled",
    "assembly_date": "2026-02-10T19:00:00Z",
    "location": "Salao",
    "assembly_type": "ordinary|extraordinary"
  },
  "agenda": {
    "id": 10,
    "title": "Pauta Y",
    "description": "...",
    "status": "open",
    "display_order": 1,
    "options": [
      { "id": 100, "agenda_id": 10, "option_text": "Sim", "display_order": 1 },
      { "id": 101, "agenda_id": 10, "option_text": "Nao", "display_order": 2 }
    ]
  } | null,
  "units": [
    { "id": 501, "unit_number": "101", "owner_name": "Maria" }
  ],
  "has_voted": false
}
```

#### Regras de erro (decisão fechada: “Detalhes PRD”)
- QR inválido/token inexistente: `404` com detalhe `"QR Code inválido"`
- QR desativado: `400` com detalhe `"QR Code desativado. Procure o administrador"`
- QR não vinculado para a assembleia em contexto de votação: `400` com detalhe `"Aguardando check-in. Procure o secretário"`
- Sem pauta aberta: **não é erro**; retorna `200` com `agenda: null`

### 2) Ajuste endpoint existente
`POST /api/v1/voting/vote`

#### Mudança
Remover dependência de autenticação (`get_current_tenant` via cookie JWT) e operar como endpoint público por QR token.

#### Regra de tenant/isolamento
Resolver `tenant_id` a partir do próprio `qr_token` (lookup em `qr_codes`) e repassar ao serviço de votação.

#### Segurança/validação mantidas
- agenda precisa estar `open`
- QR precisa estar `active`
- QR precisa estar vinculado à assembleia da agenda
- unidade não pode votar 2x na mesma pauta
- opção precisa pertencer à pauta

## Arquivos a alterar

### Backend Voting
1. `api/app/features/voting/schemas.py`
- Adicionar schemas para status público:
  - `VotingStatusUnitResponse`
  - `VotingStatusResponse` (assembly, agenda|null, units, has_voted)

2. `api/app/features/voting/service.py`
- Adicionar helper para resolver QR válido e tenant por token.
- Adicionar função `get_voting_status(qr_token)` com lógica:
  - validar QR/token;
  - localizar assignment vigente;
  - carregar assembleia;
  - localizar agenda aberta (se houver);
  - listar unidades vinculadas;
  - calcular `has_voted` para a agenda aberta.
- Ajustar `cast_vote` para receber `tenant_id` resolvido no router (sem JWT).

3. `api/app/features/voting/router.py`
- Novo `GET /status/{qr_token}` público.
- Alterar `POST /vote` para público, removendo dependências de auth/tenant JWT.
- Resolver tenant por token antes de chamar service.

### Exceções/mensagens
4. `api/app/core/exceptions.py` (se necessário)
- Adicionar exceções explícitas para mensagens PRD de QR inválido/desativado/não vinculado, mantendo padronização.

### Testes
5. Novo arquivo de integração sugerido:
- `api/tests/integration/test_voting_status_router.py`
- E ajuste em testes existentes se necessário:
  - `api/tests/integration/test_voting_service.py`
  - `api/tests/e2e/test_assembly_flow.py` (se dependências mudarem)

### Documentação técnica (backend)
6. `docs/06-backend-implementation.md`
- Registrar endpoint de status por token e voto público por QR.

## Lógica detalhada (decisão completa)

### A) Resolução de contexto por token
1. Buscar QR por `token`.
2. Se inexistente -> `404 QR Code inválido`.
3. Se `status=inactive` -> `400 QR Code desativado...`.
4. Se válido:
- usar `tenant_id` do QR como fonte de verdade para isolamento.

### B) Status da votação por token
1. Buscar assignment ativo para o QR.
2. Se não houver assignment -> `400 Aguardando check-in...`.
3. Buscar assembleia da assignment.
4. Buscar agenda `status=open` para a assembleia (ordem por `display_order`/`opened_at`).
5. Montar `units` com `assembly_unit_id`, `unit_number`, `owner_name`.
6. Calcular `has_voted`:
- se `agenda == null`: `false`
- se agenda aberta: `exists vote(valid) for agenda + any assigned unit`.
7. Retornar payload completo.

### C) Voto público
1. `POST /vote` recebe `qr_token`, `agenda_id`, `option_id`.
2. Router resolve tenant por `qr_token`.
3. Service `cast_vote` roda validações já existentes.
4. Retorna `201` com resumo dos votos criados.
5. Mantém notificação SSE (`notify_vote_cast`) como está.

## Testes e cenários

### Testes de integração mínimos
1. `GET /status/{token}` com QR válido + check-in + pauta aberta:
- `200`, agenda preenchida, `has_voted=false`.
2. Após `POST /vote`, chamar status:
- `has_voted=true`.
3. `GET /status/{token}` com QR válido + check-in + sem pauta aberta:
- `200`, `agenda=null`.
4. `GET /status/{token}` com token inexistente:
- `404` detalhe PRD.
5. `GET /status/{token}` com QR inativo:
- `400` detalhe PRD.
6. `GET /status/{token}` sem check-in:
- `400` detalhe PRD.
7. `POST /vote` sem cookie JWT e com token válido:
- deve funcionar (`201`).
8. `POST /vote` duplicado:
- `400` (regra de voto duplicado).

### Validação manual via Swagger
1. Criar QR (`POST /qr-codes`), assembly, agenda e abrir pauta.
2. Fazer check-in (`POST /checkin/.../checkin`) com `qr_token`.
3. Chamar `GET /voting/status/{token}` e validar payload.
4. Chamar `POST /voting/vote` sem autenticação de morador.
5. Revalidar status (`has_voted=true`).
6. Testar mensagens de erro com token inválido/inativo/sem assignment.

## Critérios de aceite
1. Frontend `/vote/:token` deixa de cair em erro para token válido com check-in.
2. Endpoint de status existe e responde conforme contrato esperado do frontend.
3. `POST /voting/vote` funciona sem JWT e mantém regras de domínio.
4. Mensagens de erro seguem semântica do PRD.
5. Testes de integração cobrindo fluxo público passam.

## Assunções e defaults escolhidos
1. O fluxo de condômino é público por QR token (sem login JWT).
2. Multi-tenant será resolvido pelo `tenant_id` do QR token.
3. “Sem pauta aberta” é estado funcional (`agenda=null`), não erro.
4. O endpoint retorna uma única agenda aberta (regra de negócio atual: uma por vez).
5. Não há migração de banco nesta correção.
