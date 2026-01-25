# Frontend Guidelines (web/)

## Escopo
Este diretorio contem o frontend Vite/React. Estado atual: scaffold inicial.

## Comandos Principais
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`

## Organizacao do Codigo
- Seguir `docs/07-frontend-implementation.md`.
- Features em `src/features/`, componentes em `src/components/`.
- Manter paths e naming consistentes com o SPEC.

## Configuracao
- Variaveis de ambiente devem iniciar com `VITE_`.
- API URL: `VITE_API_URL` aponta para o backend no Render.

## Deploy
- Vercel com `Root Directory: web` e output `dist`.
- Deploy automatico no push para `main`.

## Testes
- Ainda nao ha suite de testes. Adicionar quando iniciar features.
