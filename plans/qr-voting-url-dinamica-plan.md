# Plano: QR Code com URL de Votação Dinâmica + Atualização de Documentação

## Resumo
Corrigir a regra funcional para que o QR Code carregue uma URL completa de votação (`/vote/{token}`), em vez de apenas o token bruto, permitindo acesso direto pela câmera nativa do celular.
A base da URL será dinâmica por ambiente usando `VITE_PUBLIC_APP_URL`, com fallback para `window.location.origin`.

## 1) Atualização de documentação (primeiro passo)

### Arquivos a atualizar
1. `/Users/robertsantos/www/delibera/docs/PRD.md`
2. `/Users/robertsantos/www/delibera/docs/04-setup-ambiente.md`
3. `/Users/robertsantos/www/delibera/docs/07-frontend-implementation.md`
4. `/Users/robertsantos/www/delibera/docs/09-deployment.md`

### Mudanças documentais detalhadas
1. **PRD (`RF-010` e fluxo do condômino)**
- Deixar explícito que o conteúdo do QR é **URL completa de votação**:
  - formato: `{APP_BASE_URL}/vote/{token}`
- Explicitar que `token` continua UUID único e que a URL é apenas a representação para acesso.
- Incluir nota de ambiente:
  - local: `http://localhost:5173/vote/{token}`
  - produção: `https://app.seudominio.com/vote/{token}`

2. **Setup de ambiente**
- Adicionar variável:
  - `VITE_PUBLIC_APP_URL=http://localhost:5173` (local)
- Explicar regra de fallback:
  - se ausente, frontend usa `window.location.origin`.

3. **Frontend implementation**
- Registrar que preview/download do QR usa URL completa.
- Registrar helper de montagem de URL e saneamento de barra final (`.../`).

4. **Deployment**
- Incluir `VITE_PUBLIC_APP_URL` nas variáveis de deploy (staging/prod).
- Exemplo de valor em produção.

## 2) Plano de implementação técnica

### 2.1 Interface pública / contratos alterados
1. **Novo env no frontend**
- `VITE_PUBLIC_APP_URL` (string, opcional)
- Sem mudanças de contrato de API backend.

2. **Regra de geração de payload do QR**
- Antes: `token`
- Depois: `https://.../vote/{token}`

### 2.2 Arquivos de código a alterar
1. `/Users/robertsantos/www/delibera/web/src/features/qr-codes/pages/QRCodesList.tsx`
2. `/Users/robertsantos/www/delibera/web/src/types/api.ts` (somente se precisar documentação de tipo/comentário; sem quebra de interface)
3. Novo util recomendado:
- `/Users/robertsantos/www/delibera/web/src/lib/qr-url.ts`

### 2.3 Implementação decisão-completa
1. Criar util `buildVotingUrl(token: string): string` em `qr-url.ts`:
- Ler `import.meta.env.VITE_PUBLIC_APP_URL`.
- Se existir:
  - validar/sanitizar (trim espaços, remover barra final).
  - usar como base.
- Se não existir:
  - usar `window.location.origin`.
- Retornar `${base}/vote/${token}`.

2. Na listagem/preview/download de QR (`QRCodesList.tsx`):
- Onde hoje `QRCodeCanvas` recebe `qrCode.token`, passar `buildVotingUrl(qrCode.token)`.
- Em preview textual, mostrar a URL final (mantendo token em coluna técnica se desejado).

3. Compatibilidade e robustez:
- Não alterar token persistido no banco.
- Não alterar endpoints de check-in/votação.
- Não alterar schema SQL.

4. Observabilidade mínima:
- Se `VITE_PUBLIC_APP_URL` estiver inválida, fallback silencioso para `window.location.origin`.

## 3) Casos de teste e cenários de validação

### 3.1 Testes automatizados (frontend)
1. Teste unitário de util (`qr-url`):
- com `VITE_PUBLIC_APP_URL` definido sem barra final.
- com barra final.
- sem env (fallback origin).
- token UUID válido.

2. Teste de componente (opcional, se já houver infra):
- `QRCodesList` renderiza `QRCodeCanvas` com URL contendo `/vote/{token}`.

### 3.2 Validação manual (obrigatória)
1. Local:
- `VITE_PUBLIC_APP_URL=http://localhost:5173`
- Gerar/visualizar QR.
- Escanear com câmera nativa.
- Confirmar abertura em `http://localhost:5173/vote/{token}`.

2. Produção/staging:
- Configurar `VITE_PUBLIC_APP_URL` do ambiente.
- Repetir escaneamento.
- Confirmar domínio correto (não localhost, não domínio interno de admin, se diferente).

3. Regressão:
- Check-in por token continua funcional.
- Download PNG continua funcional.
- Página `/vote/:token` continua recebendo token no path.

## 4) Critérios de aceite
1. QR escaneado na câmera nativa abre diretamente a rota de votação.
2. URL do QR muda corretamente por ambiente via `VITE_PUBLIC_APP_URL`.
3. Sem mudanças no token armazenado em banco.
4. Build frontend passa.
5. Documentação atualizada e consistente com o comportamento real.

## 5) Assunções e defaults escolhidos
1. **Escolha de arquitetura:** `VITE_PUBLIC_APP_URL` + fallback `window.location.origin`.
2. Backend permanece sem retornar URL completa (mantém token UUID).
3. QR representa URL de acesso, não identidade mutável do token.
4. Não haverá migração de banco para esta entrega.
