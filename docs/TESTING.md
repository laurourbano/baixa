# Testes

Este projeto usa `vitest` para testes unitários e `playwright` para testes de integração.

## Executar os testes

```bash
npm test
# ou executar unitários
npm run test:unit
# executar integração (Playwright)
npm run test:integration
```

## Observações

- O Playwright exige que o ambiente esteja configurado para executar navegadores (instale os navegadores via `npx playwright install` se necessário).
- Os testes existentes estão em `tests/unit/` e `tests/integration/`.
