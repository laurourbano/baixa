# Instruções para Desenvolvimento de Código com IA

## 1. PROMPT MODELO (Setup do Projeto)

Antes de gerar código, preencha:

- **STACK:** [Linguagem/Framework/Banco/Versões]
- **ESCOPO:** [O que faz, público-alvo, dispositivos em 3 frases]
- **REGRAS DE NEGÓCIO:** [2-5 regras críticas impeditivas]
- **ACESSIBILIDADE:** [WCAG AA/AAA | axe-core]
- **OFFLINE-FIRST:** [Sim/Não]
- **TELEMETRIA:** [Sim/Não]

## 2. REGRAS DE CÓDIGO & FRUGALIDADE

- **Variáveis descritivas completas:** Proibido siglas/abreviações obscuras (ex: `userSubscriptionStatus` e não `subStat`).
- **Web APIs nativas primeiro:** Preferência absoluta por APIs nativas estáveis (ex: `structuredClone`, `Intl`, `AbortController`, `fetch`, `URLSearchParams`) antes de instalar dependências NPM.
- **NPM:** Instalar pacotes de terceiros apenas com justificativa detalhada de no mínimo 50 caracteres.

## 3. ESTADO, REATIVIDADE & IMUTABILIDADE

- **Fluxo unidirecional:** Estado estritamente imutável. Toda alteração deve criar novas referências de dados.
- **Reatividade nativa:** Use primitivos nativos da stack escolhida (ex: Signals, Hooks, Stores). Jamais use reatividade bidirecional.
- **Estado global mínimo:** Comece com estado local; só eleve se múltiplos componentes distantes precisarem.

## 4. DESENVOLVIMENTO PARALELO (Mocking MSW)

- **Offline-First:** Interceptação obrigatória de requisições no nível de rede usando padrões como MSW (Mock Service Worker).
- Desacoplamento total de deploys de back-end. Testes de integração devem usar os mesmos mocks.

## 5. TELEMETRIA E OBSERVABILIDADE

- **ErrorHandler global:** Captura e formatação de exceções não tratadas em segundo plano.
- **Web Vitals assíncronos:** Captura de LCP, FID, CLS via `requestIdleCallback` ou `PerformanceObserver` sem impactar a thread de renderização principal.

## 6. ARQUITETURA EVOLUTIVA EM 3 CAMADAS

A simplicidade do MVP não deve gerar barreiras físicas para o crescimento futuro. Divisão clara em 3 camadas:

1. **UI (Apresentação):** Componentes visuais puros, sem lógica de estado ou chamadas externas.
2. **Lógica (Orquestração):** Estado, hooks, reatividade e regras de fluxo de UI.
3. **Serviço (Infraestrutura):** Chamadas de API, cache, adapters de dados e transformações.
   _Permite migração suave para Feature-Sliced Design (FSD) ou Domain-Driven Design (DDD) apenas reorganizando diretórios ou adicionando subcamadas._

## 7. TESTES & CONTROLE DE DÍVIDA TÉCNICA

- **Pirâmide de testes:** Unitários (cobertura lógica >80%) -> Integração (MSW) -> E2E (Playwright/Cypress em fluxos críticos).
- **Boy Scout Rule:** Sempre deixe o código melhor e mais testado do que encontrou.
- **Marcação explícita:** Rastreie débitos conhecidos com `// [DEBT: descrição]`.

## 8. GIT, CI & AUTOMATION

- **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `test:`, `chore:`.
- **Commits atômicos e reversíveis:** 1 commit = 1 alteração lógica testada isoladamente.
- **CI Gates:** Execução automatizada e bloqueante de linter, testes unitários, testes de cobertura e acessibilidade (axe-core).

## 9. REGRA FINAL - SAÍDA DA IA

A IA deve retornar apenas:

1. Código limpo, pronto para produção.
2. Referências numeradas a este Cheat Sheet (ex: `[3] Estado unidirecional`).
3. Confiança técnica: "Código pronto para produção, sem dívida."
4. Estimativa de tokens consumidos na resposta.
   _Zero explicações teóricas, introduções ou conversas genéricas._
