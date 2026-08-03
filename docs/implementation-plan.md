# Plano de implementação — Perchance Forest Diorama

**Projeto:** `perchance-forest-diorama`  
**Spec:** `docs/hd-2d-perchance-scene-spec.md`  
**Status:** execução iniciada; Fases 1 e 2 parcialmente implementadas; publicação Pages preparada  
**Data:** 2026-08-03

## 1. Objetivo e limites

Implementar uma demo técnica interativa de uma floresta autoral em diorama 2.5D, carregada por um bundle Vite externo dentro de um gerador Perchance. O MVP deve provar geração/cache de assets 2D, composição Three.js, atmosfera leve e narrativa em turnos controlada explicitamente pelo jogador.

Este repositório é o projeto de implementação. `perchance-test` permanece somente como referência histórica da bridge e da documentação operacional; não deve voltar a receber a implementação da cena.

Ficam fora deste plano: mapa extenso, combate, pathfinding, multiplayer, modelos 3D complexos, sprite sheets confiáveis, animação quadro a quadro, TTS, áudio adaptativo e pós-processamento pesado.

## 2. Contexto atual

O scaffold existente já possui:

- Vite + TypeScript estrito, `npm ci`, `npm run typecheck`, `npm run build` e `npm run check`;
- bundle ES único `dist/main.bundle.js`, com CSS embutido para o loader externo;
- resolução inicial de `window.root`/`window.parent.root`;
- adapters tipados para `root.ai` e `root.image`;
- manifesto inicial de seis assets e opções versionadas;
- contrato de cache ainda sem implementação;
- configuração de entidades e runtime Three.js mínimo;
- máquina de estados narrativa básica;
- shell de UI responsivo com diagnóstico local.

A normalização e o IndexedDB real já foram iniciados, assim como bridge observável, fallback WebGL e testes unitários. Ainda faltam a fila de geração, montagem das texturas, camadas/effects, narrativa completa, controles, CI de Pages e validação no Preview.

## 3. Princípios de execução

1. **Preservar a fronteira Perchance:** Lists importa somente os plugins; o bundle não duplica plugin code.
2. **Validar antes de abstrair:** confirmar no Preview a forma aceita de `root.image`, especialmente `removeBackground`, e os formatos reais de retorno.
3. **Uma chamada por vez:** serializar geração de imagens e permitir somente uma chamada narrativa por ação do jogador.
4. **Estados observáveis:** toda operação deve ter estado inicial, progresso textual, sucesso, erro terminal e recuperação.
5. **Cache versionado:** nome do asset não basta; usar cena, versão, prompt e opções na chave.
6. **Falhar honestamente:** bridge indisponível, WebGL ausente ou asset obrigatório sem cache não podem parecer uma cena pronta.
7. **Código determinístico no cliente:** a IA pode produzir texto e emoção da whitelist, mas não pode mover entidades, criar personagens ou disparar geração.
8. **Nenhum segredo no cliente/log:** não persistir ou registrar tokens, cookies, headers, chaves ou URLs transitórias de desafio.

## 4. Sequência de implementação

### Fase 0 — Higiene do repositório e decisões de produto

- Manter a spec canônica em `docs/hd-2d-perchance-scene-spec.md`.
- Registrar neste repositório as decisões de nome/personalidade dos personagens, avatar, paleta, intenções, hotspots, schema narrativo e limite de histórico.
- Conferir que `perchance-test` não é importado como dependência nem alterado pela implementação.
- Adicionar `.github/workflows/build-and-deploy.yml` ao novo repo quando o bundle local estiver estável.

**Saída:** decisões pendentes resolvidas ou explicitamente mantidas como defaults do MVP; repositórios separados.

**Progresso:** concluída a separação documental e o scaffold inicial; a spec está canônica neste repositório.

### Fase 1 — Bridge e observabilidade confiáveis

Arquivos principais: `src/bridge/perchance-root.ts`, `src/bridge/plugin-adapter.ts`, `src/ui/*`.

- Evoluir o resolver para inspeção lazy repetível, não apenas uma fotografia no primeiro mount.
- Exibir build SHA, module URL, origem do root, disponibilidade de `root.ai`/`root.image` e erro seguro.
- Preservar o receiver ao fazer bind dos plugins.
- Diferenciar `bridge-unavailable`, erro de chamada e erro de serviço.
- Criar uma pequena camada de eventos limitada/deduplicada.
- Não realizar chamadas de plugin no boot.
- Adicionar fallback visual quando `WebGLRenderer` não puder ser criado.

**Progresso:** resolver lazy, inspeção repetível, bind do receiver, diagnóstico assíncrono, fallback visual de WebGL, callbacks de perda/restauração de contexto e cleanup de mount implementados. A validação final no Preview ainda está pendente.

**Gate:** no Preview, os imports abaixo estão salvos e o diagnóstico identifica corretamente cada capacidade, sem mock:

```perchance
ai = {import:ai-text-plugin}
image = {import:text-to-image-plugin}
```

### Fase 2 — Contratos de assets, normalização e cache

Arquivos novos/alterados: `src/assets/asset-manifest.ts`, `asset-normalizer.ts`, `asset-cache.ts`.

- Fixar o manifesto com `sceneId`, `sceneVersion`, `promptVersion`, prompt capturado uma única vez, negative prompt, resolução, seed, guidance e `removeBackground` por categoria.
- Implementar normalização de `dataUrl`, `canvas`, string/data URL e, se observado, saída via iframe para um formato interno único.
- Converter a representação normalizada em `Blob` quando possível e criar `ObjectURL` apenas durante o uso.
- Implementar IndexedDB com schema versionado, store de assets e índices/chaves compostas.
- Oferecer `get`, `put`, remoção individual, limpeza da versão/cena e limpeza total.
- Tratar quota/persistência como degradação: manter o asset em memória e informar o diagnóstico.
- Nunca armazenar dados de autenticação ou desafio.

**Progresso:** normalização cross-realm de data URL, canvas, image, URL remota e retorno String-like implementada; cache IndexedDB versionado com limpeza, tratamento de quota e estado de persistência implementado; Vitest, `happy-dom` e `fake-indexeddb` estão isolados em devDependencies e cobertos por 11 testes. A validação de todos os formatos efetivamente observados no Preview ainda está pendente.

**Gate:** testes de unidade cobrem chave, hit/miss, invalidação, limpeza e normalização de cada forma de retorno observada.

### Fase 3 — Fila de preparação e geração de imagem

Arquivos novos/alterados: `src/assets/asset-queue.ts`, `src/ui/preparation-panel.ts`, adapter de imagem.

- Procurar o cache antes de enfileirar cada asset.
- Enfileirar somente os obrigatórios ausentes: fundo, player, character A e character B; props/foreground são opcionais dentro do orçamento de 4–8 gerações.
- Processar sequencialmente, com cancelamento entre itens e sem interromper uma chamada já iniciada.
- Expor estados `queued`, `generating`, `normalizing`, `caching`, `ready` e `error`.
- Validar no Preview a assinatura string + opções e/ou objeto completo; escolher a forma confirmada, sem assumir equivalência.
- Usar `removeBackground: true` somente em personagens/props/overlays; não usar no fundo.
- Preservar o asset anterior até o novo resultado estar normalizado e salvo.
- Bloquear a cena narrativa se um asset obrigatório falhar sem fallback válido; permitir degradação somente para opcionais.

**Gate:** com IndexedDB vazio, uma preparação faz no máximo 4–8 chamadas lógicas, em fila, com retry explícito e diagnóstico de cada etapa; reabrir usa o cache sem chamadas redundantes.

### Fase 4 — Cena Three.js e composição 2.5D

Arquivos novos/alterados: `scene-runtime.ts`, `layers.ts`, `characters.ts`, `effects.ts`, `scene-config.ts`.

- Criar grupos explícitos `farBackground`, `midBackground`, `playLayer`, `lightLayer`, `foreground` e `effects`.
- Carregar as texturas normalizadas sem recriar assets por frame; configurar alpha, color space e filtros por categoria.
- Montar planos/sprites com posição, escala, anchor e z declarados no manifesto.
- Mostrar fundo, avatar e dois personagens; duplicar props com escala/espelhamento/tonalização moderados.
- Adicionar fog, partículas limitadas, gradientes de luz, atmosfera e vinheta leve.
- Implementar `requestAnimationFrame` com objetos pré-alocados, `visibilitychange`, `prefers-reduced-motion`, modo econômico e redução mobile.
- Aplicar bounce/respiração sutil apenas aos personagens; não animar a composição estrutural.
- Projetar posições Three.js para balões DOM sem deixar efeitos cobrirem os controles.
- Implementar `dispose()` de texturas, materiais, geometrias e object URLs em substituições/regenerações.

**Gate:** cena legível em desktop/mobile, com camadas corretas, três personagens, atmosfera e fallback de WebGL/asset sem spinner infinito.

### Fase 5 — Máquina narrativa, prompt e parser

Arquivos novos/alterados: `narrative/state-machine.ts`, `director-prompt.ts`, `response-parser.ts`, `ui/dialogue-ui.ts`.

- Expandir estados para boot, preparação, espera de intenção, entrada, narração, turno pronto, erro e gerenciamento de cache.
- Permitir transições somente por eventos explícitos; uma ação enviada não pode ser duplicada enquanto estiver narrando.
- Construir prompt compacto com resumo do mundo, fichas dos três personagens, estado, histórico limitado, intenção, fala e idioma esperado.
- Chamar `root.ai` apenas após envio explícito do jogador, com callbacks de início/chunks/final quando suportados e `stopSequences: ["END_TURN"]` como proteção auxiliar.
- Parsear o formato delimitado `[CHARACTER_X emotion=...]`, com whitelist de personagens e emoções.
- Limitar falas, tamanho total e histórico; tratar marcações desconhecidas como texto seguro.
- Nunca renderizar HTML/JS vindo do modelo nem aceitar comandos de movimento/criação de entidade; renderizar texto via `textContent`/nós DOM seguros, nunca por `innerHTML` com conteúdo do modelo.
- Em parsing inválido, exibir texto seguro ou oferecer retry controlado e voltar a estado recuperável.

**Gate:** intenção + texto produzem no máximo uma chamada; chunks aparecem quando disponíveis; a UI termina em `turn-ready` e fica parada até nova ação.

### Fase 6 — UI, interação e gerenciamento operacional

Arquivos novos/alterados: `ui/app-shell.ts`, `preparation-panel.ts`, `dialogue-ui.ts`, `settings-ui.ts`, `diagnostics-ui.ts`, `styles.css`.

- Habilitar as intenções finais e ao menos três hotspots/ações.
- Adicionar textarea, envio, confirmação/avanço, balões por personagem e estado de geração.
- Adicionar regeneração individual com foco, teclado, toque, tooltip e confirmação adequada.
- Adicionar `Regenerate all assets`, cancelamento entre itens e rollback/preservação do cache anterior.
- Adicionar limpeza de cache e status de quota/persistência.
- Garantir foco, labels, `aria-live`, áreas de toque e ausência de dependência exclusiva de hover.
- Adaptar composição para viewport vertical e efeitos reduzidos.

**Gate:** fluxo completo do usuário funciona sem chamadas concorrentes e sem avanço automático de diálogo.

### Fase 7 — Publicação, testes de integração e aceite

- Workflow criado em `.github/workflows/build-and-deploy.yml` com `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, configuração Pages e deploy de `dist`; falta apenas configurar o remote/Pages e executar o primeiro push.
- Confirmar bundle único, MIME JavaScript, URL pública e SHA injetado.
- Checklist criado em `docs/perchance-preview-checklist.md`; testar no Preview com `?rev=FULL_COMMIT_SHA` após o primeiro deploy.
- Adotar uma infraestrutura de testes leve antes dos testes unitários (preferencialmente Vitest, se aprovado como dependência do novo projeto) e executar testes de parser, state machine, normalizer, cache e fila; mocks de plugins ficam restritos aos testes unitários.
- Fazer teste real sem mock para bridge, geração e Turnstile; classificar warnings Cloudflare somente pelo estado terminal.
- Executar matriz manual: cache vazio/cheio, regeneração, falha de serviço, quota, resize, toque, teclado, aba oculta e reduced motion.
- Atualizar README e diagnóstico com limitações observadas no runtime real.

**Gate de aceite:** todos os checkboxes da spec nas seções bundle, assets, cena, narrativa e operação estão evidenciados por teste ou observação documentada.

## 5. Dependências e ordem crítica

```text
bridge observável
  -> contrato/normalizer
  -> IndexedDB
  -> fila de assets
  -> textura/camadas Three.js
  -> UI de preparação
  -> prompt/parser/state machine
  -> diálogo e controles
  -> publicação/Preview/aceite
```

A narrativa pode ser desenvolvida com dados fixos antes de a geração real estar pronta, mas não deve ser conectada ao plugin até que o contrato da bridge e a máquina de estados estejam testados. A cena pode usar placeholders apenas em testes locais; o Preview real não deve substituir silenciosamente assets ou plugins por mocks.

## 6. Checklist de validação por etapa

### Local

```bash
npm ci
npm run typecheck
npm run build
npm run check
```

Confirmar `dist/main.bundle.js` único, sem chunks inesperados, CSS embutido e SHA de build visível. Quando a infraestrutura de testes for adicionada, incluir também `npm test` (ou script equivalente) no check de CI.

### Preview Perchance

1. Salvar os dois imports no Lists.
2. Publicar o bundle e usar a URL com SHA completo.
3. Confirmar montagem, root e plugins antes de gerar.
4. Validar primeiro uma chamada de texto e uma de imagem manualmente.
5. Confirmar a assinatura de `removeBackground` e a representação real do retorno.
6. Repetir com cache vazio, cache preenchido e regeneração.
7. Validar narrativa, streaming, parser e parada entre turnos.
8. Registrar somente erros seguros, nunca tokens/cookies/headers.

## 7. Riscos e respostas

| Risco | Resposta no plano |
| --- | --- |
| `root` aparece depois do mount | inspeção lazy repetível e diagnóstico atualizado |
| assinatura/retorno do plugin muda | adapter + normalizer observáveis e contrato confirmado no Preview |
| Turnstile/CORS gera ruído | classificar por evento terminal, não por warning isolado |
| falha WebGL/mobile | fallback visual e modo degradado |
| quota IndexedDB | erro visível, asset em memória e limpeza explícita |
| resultado visual ruim | regeneração manual, sem alegação de avaliação automática |
| inconsistência entre gerações | um asset base por personagem e orçamento limitado |
| resposta narrativa inválida | parser whitelist, limites, texto seguro e retry |
| chamadas duplicadas/custo | fila serial, botões desabilitados e state machine |
| cache antigo após deploy | SHA completo em `?rev=` e build visível |

## 8. Critério de pronto do MVP

O MVP estará pronto quando um usuário puder abrir o gerador, observar a bridge, preparar ou reutilizar os assets, ver a floresta em camadas com atmosfera, escolher uma intenção, escrever e enviar uma fala, receber uma reação limitada em balões, confirmar o turno e escolher a próxima ação — sem loop automático, sem chamadas redundantes e com recuperação visível para falhas de bridge, serviço, cache ou renderização.

Qualquer requisito que dependa de qualidade visual subjetiva deve ser marcado como revisão humana/regeneração, nunca como validação automática do modelo.
