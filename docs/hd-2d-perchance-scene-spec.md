# Especificação — Cenário HD-2D autoral com Perchance

**Arquivo:** `docs/hd-2d-perchance-scene-spec.md`  
**Status:** especificação inicial fechada para MVP, com extensões futuras registradas  
**Data:** 2026-08-03  
**Repositório-base:** `perchance-forest-diorama`  
**Tipo de entrega:** contrato de produto e arquitetura para o MVP; o scaffold inicial já foi criado neste repositório e a implementação funcional será feita em fases

## 1. Resumo executivo

Criar uma cena autoral de floresta/trilha com estética inspirada em **HD-2D**: cenário com sensação de diorama tridimensional, camadas em profundidade, iluminação e atmosfera dinâmicas, e personagens/objetos produzidos como imagens 2D transparentes.

A cena será carregada em um gerador Perchance por meio do padrão já validado neste repositório:

- o painel **Lists** importa os plugins Perchance;
- o painel **HTML/CSS/JS** importa um bundle Vite externo publicado no GitHub Pages;
- o bundle resolve `root.ai` e `root.image` em runtime;
- o plugin de imagem gera o cenário e os personagens;
- o plugin de texto produz as falas quando o jogador envia uma ação;
- o jogador controla o ritmo e nunca existe um loop autônomo de diálogos.

O MVP é uma **demo técnica interativa**, não um jogo completo. O objetivo é provar conjuntamente:

1. geração e cache de assets 2D;
2. composição de um cenário 2.5D em Three.js;
3. transparência via `removeBackground`;
4. efeitos atmosféricos leves;
5. avatar do jogador e dois personagens controlados pela IA;
6. narrativa em turnos com texto livre e intenção escolhida;
7. ausência de loop automático de falas;
8. eficiência aceitável em desktop e mobile;
9. observabilidade das etapas Perchance, geração, cache e narrativa.

---

## 2. Direção criativa

### 2.1 Referência visual

A referência fornecida é uma cena de floresta de *Octopath Traveler*:

<https://static0.cbrimages.com/wordpress/wp-content/uploads/2024/08/forest-travel-octopath-traveler.jpg?q=49&fit=contain&w=3840&h=1920&dpr=2>

Ela será usada para estudar composição, não para reutilizar personagens, nomes, assets ou identidade visual protegida. O MVP deve ser **autoral** mesmo sendo um experimento visual privado.

Características a reproduzir de forma original:

- sensação de diorama e profundidade;
- caminho ou clareira como foco da cena;
- contraste entre personagens pequenos e natureza monumental;
- floresta densa com foreground, plano jogável e fundo;
- luz filtrada entre árvores;
- névoa, partículas e atmosfera;
- personagens 2D sobre um ambiente com organização espacial 3D;
- composição cinematográfica com foco seletivo sugerido, sem depender de pós-processamento pesado.

Não usar o nome de uma franquia, personagem ou região como prompt de produção. Os prompts devem descrever propriedades visuais genéricas e autorais.

### 2.2 Cena do MVP

A primeira cena será uma **tela única de floresta autoral com pontos de decisão narrativa**. Não haverá mapa grande nem exploração contínua.

Composição proposta:

```text
┌──────────────────────────────────────────────┐
│ background distante: copa, luz, neblina      │
│                                              │
│ midground: trilha, árvores e personagens     │
│             player + character A + B         │
│                                              │
│ foreground: folhas/galhos translúcidos       │
│             partículas e luz                  │
├──────────────────────────────────────────────┤
│ narrativa: falas, intenção, entrada do player│
└──────────────────────────────────────────────┘
```

A cena deve conter pelo menos:

- uma trilha ou clareira principal;
- um elemento ambiental de interesse;
- dois personagens de IA posicionados separadamente;
- um avatar visual do jogador;
- ao menos três ações narrativas possíveis;
- camadas de foreground que criem profundidade sem bloquear a interface;
- névoa e partículas leves;
- uma fonte de luz atmosférica ou feixe simulado.

### 2.3 Direção de arte dos prompts

O vocabulário visual base deve ser consistente entre os prompts:

- `original HD-2D JRPG-inspired diorama`
- `authorial fantasy forest trail`
- `rich painted environment`
- `crisp 2D pixel-art-inspired character sprite`
- `cinematic filtered sunlight`
- `layered depth`
- `warm and cool atmospheric contrast`
- `clean silhouette`
- `no text, no watermark, no logo`

Essas expressões são uma direção de arte, não uma garantia do modelo. Os prompts de produção devem manter um **style prefix** comum e variar apenas o papel do asset, a paleta local e sua função na composição.

Para transparência de personagens e objetos recortados, o prompt deve pedir explicitamente:

- personagem/objeto isolado;
- corpo inteiro quando aplicável;
- silhueta legível;
- pose neutra;
- ausência de cenário, chão, sombra projetada e objetos conectados;
- `transparent background` como intenção do prompt;
- uso de `removeBackground: true` na chamada do plugin.

O resultado do plugin continua sendo considerado não determinístico. O sistema oferece regeneração manual e não promete validação automática de qualidade visual.

---

## 3. Escopo funcional do MVP

### 3.1 Fluxo principal do usuário

1. O usuário abre o gerador Perchance.
2. O bundle externo monta a aplicação.
3. A aplicação resolve e exibe o estado de `root`, `root.ai` e `root.image`.
4. A aplicação procura os assets da cena no IndexedDB.
5. Para cada asset ausente, solicita geração ao plugin de imagem.
6. A tela exibe progresso por asset, sem fingir que a geração é instantânea.
7. Após a preparação, a cena Three.js aparece.
8. O jogador escolhe uma intenção narrativa.
9. O jogador escreve uma fala livre.
10. O jogador envia a ação.
11. O diretor narrativo chama `root.ai` para produzir a próxima reação controlada.
12. A resposta é exibida em balão, com streaming quando suportado.
13. A IA pode informar uma emoção limitada para cada personagem.
14. O jogador decide a próxima ação; o sistema não dispara o próximo turno sozinho.

### 3.2 Interações mínimas

O MVP deve oferecer:

- seleção de intenção narrativa;
- entrada de texto livre do jogador;
- envio explícito da ação;
- botão para avançar/confirmar após a resposta;
- balão de fala por personagem;
- estado de geração visível;
- hotspots ou escolhas narrativas para ao menos três ações;
- regeneração de asset pelo ícone discreto sobre o asset;
- configuração para regenerar todos os assets;
- configuração para limpar o cache local;
- adaptação básica para mouse, teclado e toque;
- diagnóstico resumido da bridge e do build.

A cena não deve avançar automaticamente durante a geração inicial. O usuário pode interromper a preparação entre assets, mas uma geração já iniciada deve aguardar o terminal do plugin; o asset anterior permanece preservado durante uma regeneração.

### 3.3 Ritmo narrativo

A unidade narrativa é um turno iniciado pelo jogador:

```text
idle
  -> player selects intent
  -> player writes message
  -> player submits
  -> director generates controlled response
  -> response streams/displays
  -> turn finishes
  -> player chooses next action
```

Não implementar polling de falas, timers que avancem a conversa, resposta automática ao terminar uma fala ou geração de uma sequência ilimitada de personagens.

O botão de envio deve ficar desabilitado durante a geração. O botão de avanço só fica disponível após o estado terminal da resposta.

---

## 4. Escopo de geração de assets

### 4.1 Responsabilidade do plugin de imagem

O plugin `text-to-image-plugin` será responsável por gerar imagens 2D para:

- fundo/cenário base;
- elementos ambientais recortados;
- avatar do jogador;
- personagem de IA A;
- personagem de IA B;
- eventuais variações visuais aprovadas para a cena.

A chamada JavaScript deve passar por um adapter do bundle. A documentação local demonstra tanto a forma de prompt string com opções no segundo argumento quanto a forma de objeto usada pelo protótipo; a assinatura efetivamente aceita com `removeBackground` deve ser confirmada no Preview antes de virar contrato.

Forma preferencial a validar para assets recortados:

```typescript
const result = await root.image(prompt, {
  negativePrompt,
  resolution,
  seed,
  guidanceScale,
  hideGalleryButtons: true,
  removeBackground: true,
});
```

O adapter pode manter uma segunda forma compatível se o runtime observado exigir objeto completo:

```typescript
const result = await root.image({
  prompt,
  negativePrompt,
  resolution,
  seed,
  guidanceScale,
  hideGalleryButtons: true,
  removeBackground: true,
});
```

Não assumir que ambas as formas são equivalentes sem teste. Para assets de fundo, `removeBackground` não deve ser usado. Para personagens e props isolados, deve ser usado quando o resultado esperado for uma textura transparente.

O resultado deve ser tratado de forma adaptável, pois a documentação local descreve um valor string-like com propriedades adicionais:

- `result.dataUrl`;
- `result.canvas`;
- `result.iframe`;
- `result.inputs`;
- a própria string/data URL.

A implementação deverá normalizar o retorno para um formato interno de asset antes de entregar a textura ao Three.js.

### 4.2 Responsabilidade do código

O código será responsável por:

- definir prompts estáveis e versionados;
- chamar o plugin de forma sequencial e observável;
- manter a identidade exata do prompt utilizado;
- extrair `dataUrl`, canvas ou representação equivalente;
- converter e persistir o resultado em IndexedDB;
- carregar a textura em Three.js;
- posicionar, escalar e ordenar os assets;
- duplicar árvores/props com transformações diferentes;
- fazer idle/bounce/respiração;
- alterar luz, neblina e partículas;
- mostrar ações de regeneração;
- tratar falha de rede/serviço e estado de espera;
- impedir chamadas redundantes ao reabrir a cena;
- manter a narrativa finita e controlada por ação do jogador.

### 4.3 O que não deve ser delegado ao plugin de imagem

O plugin não será tratado como responsável por:

- compor a cena em camadas com coordenadas conhecidas;
- gerar uma cena interativa ou semanticamente navegável;
- garantir consistência entre personagens e gerações;
- produzir animação confiável;
- remover artefatos de alpha além do que o próprio `removeBackground` fornecer;
- julgar automaticamente se uma imagem ficou boa;
- compreender a posição de hotspots;
- manter estado de jogo;
- produzir um sprite sheet confiável para o MVP;
- decidir regras narrativas ou disparar eventos diretamente.

### 4.4 Orçamento inicial de assets

O alvo do MVP é **4–8 gerações lógicas de assets** por preparação de cena, mantendo a carga e a latência sob controle.

Orçamento recomendado:

| Asset | Quantidade inicial | Tratamento |
|---|---:|---|
| Fundo panorâmico | 1 | Imagem landscape, sem transparência |
| Elemento ambiental recortado principal | 1–2 | Árvore, rocha ou vegetação; pode ser duplicado no cenário |
| Overlay/foreground | 0–1 | Folhagem ou galho com alpha; opcional caso a composição do fundo resolva |
| Avatar do jogador | 1 | Imagem vertical com alpha |
| Personagem IA A | 1 | Imagem vertical com alpha |
| Personagem IA B | 1 | Imagem vertical com alpha |
| Variações opcionais | 0–2 | Somente se o orçamento e a consistência permitirem |

As árvores e props podem ser reutilizados em múltiplas posições com escala, rotação limitada, espelhamento e tonalização moderada. Não duplicar o mesmo asset de forma obviamente idêntica em primeiro plano.

### 4.5 Resolução e opções

Resoluções compatíveis com a documentação local devem ser respeitadas. A recomendação inicial é:

- fundo: `768x512`;
- personagens/props: `512x768` ou `512x512`, conforme enquadramento;
- `guidanceScale`: valor inicial 7;
- `seed`: `-1` para geração inicial variada, com seed efetivo registrado quando exposto;
- `negativePrompt`: sempre excluir texto, marca d’água, molduras, cenário acoplado e artefatos incompatíveis com a função do asset;
- `hideGalleryButtons: true` para a experiência embutida.

Os valores exatos devem ser registrados no manifesto de assets e não espalhados pela lógica de renderização.

### 4.6 Poses e estados visuais

O desejo artístico é ter duas ou três poses/estados por personagem. Porém, gerar 2–3 imagens para cada um dos três personagens ultrapassa o orçamento inicial de 4–8 assets e aumenta o risco de inconsistência.

Decisão do MVP:

- cada personagem começa com **um asset base transparente**;
- o asset visual permanece estático e imóvel na composição;
- somente um bounce/respiração muito sutil pode ser aplicado ao personagem como animação ociosa;
- emoção altera o balão e, no máximo, a intensidade de uma microanimação previamente definida;
- uma segunda imagem de reação é opcional e só entra se couber no orçamento;
- sprite sheets e três poses independentes por personagem ficam para uma fase futura.

Assim, o sistema preserva estados visuais lógicos sem obrigar a uma quantidade excessiva de chamadas ao serviço. Parallax de câmera, rotação de sprites, deslocamento por ponteiro e troca de pose não são requisitos do MVP.

---

## 5. Pipeline de assets e cache

### 5.1 Geração automática

A geração acontece automaticamente na abertura da cena quando um asset não existe no cache local.

A aplicação deve apresentar:

- asset atual;
- etapa (`queued`, `generating`, `normalizing`, `caching`, `ready`, `error`);
- progresso textual, sem prometer percentual falso;
- erro terminal quando o plugin não conclui;
- opção de tentar novamente;
- quantidade de requisições pendentes.

As chamadas devem ser serializadas ou passar por uma fila com concorrência muito baixa. O plugin é server-backed, pode exigir verificação Cloudflare/Turnstile e possui limites de requisições. Não disparar todas as gerações em paralelo sem necessidade.

### 5.2 Chave de cache

Cada registro do IndexedDB deve ser identificado, no mínimo, por:

```text
sceneId
sceneVersion
assetId
promptVersion
promptHash
pluginOptionsHash
```

O cache precisa distinguir alterações no prompt, na resolução, no modelo de composição e na versão da cena. Um asset antigo não deve ser considerado válido apenas porque possui o mesmo nome.

### 5.3 IndexedDB

Usar IndexedDB, não `localStorage`, porque imagens podem ser maiores e devem ser armazenadas como `Blob` ou formato binário equivalente quando possível.

O armazenamento deve permitir:

- salvar asset normalizado;
- recuperar por chave estável;
- salvar metadados seguros;
- invalidar uma versão de cena;
- apagar um asset individual;
- limpar todo o cache por ação do usuário;
- informar quando o navegador não possui espaço suficiente;
- continuar a sessão usando o asset em memória após falha de persistência, quando possível.

Não armazenar tokens, cookies, headers de autorização ou dados de desafio. O cache deve conter somente os assets e metadados necessários para reproduzir a cena.

### 5.4 Regeneração individual

Cada asset gerado deve ter uma ação de regeneração discreta, exibida em hover no desktop e por toque/controle acessível no mobile.

Requisitos:

- ícone pequeno, com tooltip curto;
- não ocupar o foco visual da cena;
- solicitar confirmação apenas quando isso evitar uma ação acidental cara;
- descartar o asset atual somente depois de a nova geração ter sido resolvida, ou manter rollback temporário;
- usar o mesmo prompt por padrão;
- permitir seed novo quando a intenção for variar o resultado;
- atualizar o cache apenas após sucesso;
- refletir o novo asset na cena sem recarregar toda a aplicação.

O sistema não deve alegar que avaliou a qualidade da imagem. A regeneração é a estratégia explícita para lidar com resultado visual inadequado.

### 5.5 Regeneração total

Adicionar uma configuração **Regenerate all assets** que:

- invalide os registros atuais da cena;
- preserve a configuração narrativa e a identidade da cena;
- regenere os assets de forma sequencial;
- mostre o custo operacional de repetir a preparação;
- permita cancelar a fila entre assets, respeitando uma geração já em andamento;
- não apague o cache anterior antes de existir uma estratégia de rollback ou confirmação.

---

## 6. Arquitetura de renderização

### 6.1 Stack escolhida

MVP:

- TypeScript;
- Vite;
- Three.js empacotado pelo Vite;
- WebGLRenderer;
- `OrthographicCamera` como câmera inicial;
- planos 3D e sprites/texturas 2D;
- DOM/CSS para interface, balões, controles e progresso;
- IndexedDB para cache;
- GitHub Actions + GitHub Pages para publicação do bundle.

A escolha de Three.js é compatível com a intenção do usuário de ter cenário 3D com assets 2D, mas o MVP não deve introduzir modelos 3D complexos. O “3D” inicial será um diorama formado por planos, profundidade, câmera, composição espacial e efeitos.

A câmera ortográfica mantém a escala dos sprites mais previsível e ajuda a preservar uma leitura de pixel art. Uma câmera perspectiva poderá ser avaliada posteriormente se a cena exigir distorção de profundidade mais evidente.

### 6.2 Estrutura de camadas

A cena deve separar grupos Three.js com profundidade explícita:

1. `farBackground`
   - fundo gerado;
   - gradiente/atmosfera distante;
   - parallax mínimo.
2. `midBackground`
   - árvores e massas ambientais duplicadas;
   - silhuetas e neblina intermediária.
3. `playLayer`
   - avatar do jogador;
   - personagens de IA;
   - objetos de interação;
   - balões podem permanecer no DOM e acompanhar coordenadas projetadas.
4. `lightLayer`
   - planos/quadriculados de gradiente para luz;
   - partículas luminosas.
5. `foreground`
   - folhas, galhos e overlays transparentes;
   - parallax maior;
   - não pode cobrir permanentemente os personagens ou controles.
6. `effects`
   - fog, poeira, folhas, vaga-lumes e vinheta;
   - atualizados no loop sem recriar objetos.

### 6.3 Texturas

Para a leitura HD-2D/pixel-art:

- preservar alpha;
- desabilitar mipmaps quando apropriado;
- usar `NearestFilter` para sprites que precisem de pixelização nítida;
- testar `LinearFilter` em fundos pintados se o resultado ficar mais natural;
- evitar interpolação diferente entre assets sem uma decisão visual consciente;
- manter o `colorSpace` e a exposição consistentes;
- não redimensionar imagens repetidamente por frame.

A política de filtro deve ser configurável por categoria de asset: fundo, props e personagem.

### 6.4 Profundidade e posicionamento

Cada entidade deve possuir um manifesto com:

```typescript
{
  id: string;
  layer: "far" | "mid" | "play" | "foreground";
  position: { x: number; y: number; z: number };
  scale: number;
  anchor: { x: number; y: number };
  interactive?: boolean;
  characterId?: string;
}
```

A ordem visual não deve depender de adivinhar a ordem de carregamento das imagens. O z-index lógico e a camada devem ser declarados.

### 6.5 Loop de animação

Usar `requestAnimationFrame` e reutilizar objetos alocados. Não criar partículas, arrays ou texturas novas dentro do loop.

Animações obrigatórias do MVP:

- bounce/respiração suave nos personagens;
- oscilação mínima de luz ou máscara atmosférica;
- partículas de névoa/poeira/vaga-lumes;
- movimento muito sutil de gradiente de luz;
- bounce/respiração mínimo nos personagens.

Não animar foreground, árvores, props, câmera ou posição dos personagens no MVP. A profundidade deve resultar da composição fixa dos planos, da escala, da iluminação e da névoa.

Animações devem pausar ou reduzir sua frequência quando:

- a aba estiver oculta;
- o dispositivo solicitar redução de movimento;
- a aplicação estiver em fase pesada de geração;
- o usuário ativar modo econômico.

Respeitar `prefers-reduced-motion`.

### 6.6 Efeitos

Os efeitos iniciais serão simulados com recursos leves:

- `THREE.Fog` ou equivalente para profundidade atmosférica;
- `THREE.Points`/`BufferGeometry` para partículas;
- gradientes radiais em planos transparentes para luz;
- overlay de vinheta em CSS ou Three.js;
- leve variação de opacidade e posição para névoa;
- bloom real não é requisito do MVP e deve ser evitado inicialmente para reduzir peso e custo de GPU.

---

## 7. Modelo narrativo

### 7.1 Elenco

A cena terá três assets de personagem:

1. **Player** — personagem do usuário, visualmente presente, fala enviada por texto livre.
2. **Character A** — personagem de IA com identidade e emoção próprias.
3. **Character B** — personagem de IA com identidade e emoção próprias.

O jogador não escolhe necessariamente entre múltiplos protagonistas no MVP; ele controla o ritmo, a intenção e a fala do avatar configurado.

### 7.2 Intenções

O jogador escolhe uma intenção antes de enviar sua fala. A lista inicial deve ser curta e explícita, por exemplo:

- `Observe`;
- `Ask`;
- `Warn`;
- `Comfort`;
- `Follow`;
- `Challenge`.

A intenção não substitui o texto livre; ela fornece uma âncora para a resposta do diretor narrativo.

### 7.3 Chamada do plugin de texto

O plugin será importado no Lists como:

```perchance
ai = {import:ai-text-plugin}
```

O bundle chamará `root.ai` somente após a ação do jogador, usando instrução que inclua:

- resumo compacto do estado da cena;
- relação dos personagens;
- histórico limitado de turnos;
- intenção selecionada;
- fala exata do jogador;
- idioma esperado;
- regras de formato da resposta;
- emoção permitida em lista fechada;
- instrução para terminar após uma resposta controlada.

O idioma da resposta será orientado pela própria fala do jogador: instruir o modelo a responder no mesmo idioma detectado na mensagem do jogador. Não adicionar uma camada extra de classificação ou tradução no MVP.

As opções relevantes podem incluir:

```typescript
const result = await root.ai({
  instruction,
  startWith,
  hideStartWith: false,
  stopSequences: ["END_TURN"],
  endButtons: "none",
  onStart,
  onChunk,
  onFinish,
});
```

A implementação não deve depender apenas de `stopSequences`. O controle principal é a máquina de estados: uma chamada por ação, uma resposta terminal, retorno ao estado de espera do jogador.

### 7.4 Contrato de saída narrativa

A saída desejada deve ser curta e delimitada, para permitir parsing seguro. O diretor pode produzir texto e emoção, por exemplo:

```text
[CHARACTER_A emotion=concerned]
The path is not as quiet as it looks.

[CHARACTER_B emotion=alert]
We should keep moving.

[END_TURN]
```

O parser deve:

- reconhecer somente emoções em uma whitelist;
- rejeitar ou reduzir marcações desconhecidas a texto seguro;
- limitar quantidade de falas;
- limitar tamanho total da resposta;
- impedir que a IA execute JavaScript, HTML arbitrário ou comandos;
- transformar cada reação em uma estrutura interna antes de renderizar.

Se o parsing falhar, exibir a resposta como texto seguro ou solicitar regeneração controlada, sem deixar a interface travada.

### 7.5 Emoções

A IA poderá indicar emoção, mas somente entre estados fechados, por exemplo:

```text
neutral
curious
concerned
happy
sad
angry
surprised
alert
```

A emoção altera apenas:

- pose/transformação idle;
- cor ou intensidade do balão;
- microanimação do personagem;
- iluminação local opcional.

A IA não poderá mover entidades arbitrariamente, criar novos personagens, alterar o mapa ou disparar chamadas de imagem.

### 7.6 Histórico

Manter apenas o contexto necessário para a cena:

- resumo fixo do mundo;
- ficha compacta dos três personagens;
- estado atual da cena;
- últimos turnos dentro de um limite definido;
- fala atual do jogador;
- intenção atual.

O histórico deve ser limitado em tamanho para controlar latência e custo. O bundle não deve enviar tokens, credenciais ou dados privados de plataforma no prompt.

---

## 8. UI e acessibilidade

### 8.1 Separação entre cena e interface

Three.js renderiza o diorama. O DOM/CSS renderiza:

- painel de preparação;
- progresso de assets;
- balões de fala;
- seletor de intenção;
- textarea de fala;
- botões de enviar, confirmar e regenerar;
- configurações de cache;
- estados de erro e diagnóstico.

Isso evita usar o canvas para todo o texto e facilita responsividade, foco de teclado e acessibilidade.

### 8.2 Desktop e mobile

A cena deve funcionar em desktop e mobile:

- layout responsivo;
- controles touch para hotspots e regenerate;
- textarea utilizável sem zoom excessivo;
- botões com área de toque adequada;
- camera fit baseada no viewport;
- resolução lógica limitada;
- efeitos degradáveis por dispositivo;
- orientação vertical suportada com composição adaptada;
- sem depender exclusivamente de hover.

A ação de regenerar deve ter alternativa acessível por foco/teclado e toque. Tooltip não pode ser a única forma de comunicar sua função.

### 8.3 Estados de interface

Estados mínimos:

```text
booting
bridge-unavailable
preparing-assets
asset-ready
asset-error
scene-ready
waiting-for-intent
waiting-for-player-input
narrating
turn-ready
cache-management
fatal-error
```

Todos os estados devem possuir uma mensagem visível e uma saída possível. Nunca deixar spinner infinito sem informação ou botão de recuperação.

---

## 9. Bridge Perchance e publicação

### 9.1 Lists

Usar apenas:

```perchance
ai = {import:ai-text-plugin}
image = {import:text-to-image-plugin}
```

Não duplicar a implementação dos plugins no bundle.

### 9.2 Loader do bundle

No HTML/CSS/JS do gerador:

```html
<script type="module">
  import "https://fahell.github.io/perchance-forest-diorama/main.bundle.js?rev=e841d64a6efbec49d7eceaebf4746f16911b4262";
</script>
```

O `?rev=FULL_COMMIT_SHA` é obrigatório para a disciplina de cache. Após cada push, aguardar o deploy e atualizar a revisão no gerador.

### 9.3 Requisitos do bundle

- um bundle ES estável;
- sem chunks inesperados no primeiro carregamento;
- Three.js empacotado pelo Vite;
- commit de build visível na aplicação;
- diagnóstico da URL do módulo;
- tratamento lazy de `window.root`/`window.parent.root`;
- `root.ai` e `root.image` verificados antes de qualquer chamada;
- logs limitados e sem tokens sensíveis.

### 9.4 Diagnóstico

Exibir no modo de desenvolvimento ou em painel recolhível:

- build commit;
- module URL;
- origem do root;
- disponibilidade de `root.ai`;
- disponibilidade de `root.image`;
- status do cache;
- etapa do asset atual;
- representação recebida (`dataUrl`, `canvas`, string etc.);
- estado narrativo;
- último erro seguro.

Não registrar:

- tokens Turnstile;
- cookies;
- headers de autorização;
- senhas;
- chaves de API;
- URLs de desafio com segredos transitórios.

---

## 10. Performance e confiabilidade

### 10.1 Orçamento inicial

Metas práticas do MVP:

- no máximo 4–8 assets gerados na preparação padrão;
- chamadas de imagem em fila, sem explosão de concorrência;
- uma chamada de texto por ação do jogador;
- uma única instância de renderer e câmera;
- nenhum asset recriado dentro do loop;
- partículas em quantidade limitada;
- cena com resolução lógica fixa e escala responsiva;
- modo reduzido para mobile e `prefers-reduced-motion`;
- sem pós-processamento pesado obrigatório.

### 10.2 Gargalos conhecidos

- geração de imagem é remota e pode exigir Turnstile;
- geração de texto pode aguardar verificação e streaming;
- plugins possuem limites de concorrência e filas;
- Data URLs podem consumir memória;
- IndexedDB possui quota variável;
- celulares possuem limites de GPU/RAM menores;
- a mesma imagem repetida pode denunciar o padrão visual da composição;
- `removeBackground` pode deixar halos ou recortes imperfeitos;
- o modelo pode não preservar identidade entre gerações.

### 10.3 Estratégias

- cache local por versão e hash;
- reuso de props com variações de transformação;
- fundo estático gerado uma vez;
- personagem base persistido;
- assets carregados sob demanda apenas quando necessário;
- `dispose()` de texturas/materials antigos após regeneração;
- fila serial para geração;
- eventos deduplicados e log limitado;
- pausa de animação quando a aba está oculta;
- redução de partículas em telas pequenas;
- fallback visual de erro para asset, sem esconder o diagnóstico.

### 10.4 Fallback de geração

O plugin já possui seu próprio tratamento de falhas de geração e o cliente não deve tentar reproduzir ou contornar a lógica interna do serviço.

O cliente deve:

- aguardar a conclusão ou falha terminal;
- exibir a mensagem segura retornada;
- oferecer tentativa novamente;
- preservar o asset anterior quando uma regeneração falhar;
- nunca substituir silenciosamente o bridge real por mock durante o teste Perchance.

Se um asset obrigatório falhar na preparação inicial e não existir versão válida no cache, a cena não deve fingir que está completa: permanecer em `asset-error`, indicar o asset afetado e oferecer `Retry`. A composição pode exibir somente o diagnóstico e os assets já prontos, mas a interação narrativa fica bloqueada até que fundo, avatar e os dois personagens estejam disponíveis. Um prop opcional pode ser omitido e registrado como degradação não fatal.

---

## 11. Critérios de aceite

### 11.1 Bundle e bridge

- [ ] `npm ci` e `npm run check` funcionam no repositório do projeto.
- [ ] O bundle é publicado no GitHub Pages.
- [ ] O loader usa o SHA completo na query.
- [ ] A aplicação monta no Preview do Perchance.
- [ ] `root`, `root.ai` e `root.image` têm status visível.
- [ ] Falha de bridge não é confundida com falha de serviço.

### 11.2 Assets

- [ ] A abertura procura primeiro no IndexedDB.
- [ ] Assets ausentes são gerados automaticamente.
- [ ] A fila não dispara todas as gerações simultaneamente.
- [ ] O fundo é carregado sem alpha obrigatório.
- [ ] Personagens e props recortados usam `removeBackground: true`.
- [ ] O retorno `dataUrl`/`canvas`/string é normalizado.
- [ ] O asset é exibido como textura Three.js.
- [ ] O cache pode ser limpo.
- [ ] Um asset pode ser regenerado individualmente.
- [ ] Existe regeneração de todos os assets.
- [ ] Falha de regeneração preserva o asset anterior.

### 11.3 Cena

- [ ] A floresta autoral é dividida em camadas de profundidade.
- [ ] O cenário usa planos/objetos Three.js com assets 2D.
- [ ] Os três personagens aparecem na composição.
- [ ] O cenário permanece legível em desktop e mobile.
- [ ] Há parallax ou deslocamento de câmera sutil.
- [ ] Há névoa e partículas.
- [ ] Há luz/atmosfera dinâmica simulada.
- [ ] Personagens têm bounce/respiração.
- [ ] Efeitos não bloqueiam os controles nem os balões.
- [ ] `prefers-reduced-motion` é respeitado.

### 11.4 Narrativa

- [ ] O jogador escolhe uma intenção.
- [ ] O jogador escreve uma fala livre.
- [ ] Uma ação explícita dispara uma chamada a `root.ai`.
- [ ] A resposta aparece em balões.
- [ ] Streaming é exibido quando `onChunk` estiver disponível.
- [ ] O idioma da resposta acompanha o idioma da fala do jogador.
- [ ] A resposta é encerrada em um estado terminal.
- [ ] A IA pode indicar apenas emoções permitidas.
- [ ] O jogador escolhe a próxima ação.
- [ ] Não há loop automático de falas.
- [ ] O botão de envio não permite chamadas concorrentes acidentais.

### 11.5 Operação

- [ ] Eventos de geração, cache, bridge e narrativa aparecem no diagnóstico.
- [ ] Tokens e credenciais nunca aparecem no log.
- [ ] O projeto distingue ruído Cloudflare de erro terminal da aplicação.
- [ ] O comportamento com cache antigo pode ser identificado pelo build SHA.
- [ ] Existe documentação do prompt e da versão do asset.

---

## 12. Fora do escopo do MVP

- mapa extenso com múltiplas telas;
- pathfinding ou colisão complexa;
- combate;
- inventário;
- multiplayer;
- sincronização em servidor próprio;
- modelos 3D de personagens;
- cenário 3D modelado em Blender;
- sprite sheets confiáveis gerados por IA;
- animação quadro a quadro completa;
- avaliação automática de qualidade visual por visão computacional;
- moderação narrativa adicional além do comportamento padrão do plugin;
- TTS, música dinâmica ou trilha sonora adaptativa;
- pós-processamento bloom/DOF pesado como requisito;
- geração de assets em massa em paralelo;
- dependência de uma API externa de armazenamento além do GitHub Pages para o bundle.

---

## 13. Evoluções futuras

Depois do MVP, considerar:

1. câmera perspectiva e parallax mais forte;
2. tiles e props adicionais pré-gerados;
3. variações de clima e horário;
4. segunda/terceira pose de cada personagem;
5. sprite sheets preparadas manualmente a partir de assets aprovados;
6. edição/revisão de prompts pelo usuário;
7. exportação de uma cena gerada para um manifesto persistente;
8. múltiplas cenas e transições;
9. mapa explorável com hotspots espaciais;
10. sistema de memória narrativa resumida;
11. eventos de cena controlados por uma whitelist maior;
12. áudio e efeitos sonoros;
13. Web Worker para preparação ou normalização de assets;
14. testes automatizados do parser narrativo e do cache;
15. avaliação assistida de alpha/halos, sem afirmar que o modelo validou composição;
16. comparação entre Three.js, PixiJS e canvas 2D para cenas maiores.

---

## 14. Estrutura de módulos sugerida

A implementação futura deve manter responsabilidades separadas, aproximadamente assim:

```text
src/
  main.ts                 # bootstrap e montagem
  bridge/
    perchance-root.ts     # resolução lazy do root
    plugin-adapter.ts     # normalização de ai/image
  assets/
    asset-manifest.ts     # prompts, opções e versões
    asset-queue.ts        # fila de geração
    asset-normalizer.ts   # dataUrl/canvas/string -> formato interno
    asset-cache.ts        # IndexedDB
  scene/
    scene-config.ts       # composição e posições
    scene-runtime.ts      # renderer, camera e resize
    layers.ts             # grupos de profundidade
    characters.ts         # sprites e estados emocionais
    effects.ts            # fog, partículas e luz
  narrative/
    state-machine.ts      # turnos e estados
    director-prompt.ts    # prompt compacto
    response-parser.ts    # texto delimitado e whitelist
  ui/
    preparation-panel.ts
    dialogue-ui.ts
    settings-ui.ts
    diagnostics-ui.ts
```

Esses nomes são orientação arquitetural, não contrato de API. A regra é evitar misturar bridge, geração de assets, renderização e narrativa no mesmo módulo.

---

## 15. Plano de validação

### Teste local

1. instalar com `npm ci`;
2. executar `npm run typecheck`;
3. executar `npm run build`;
4. confirmar um bundle único;
5. validar que o commit é injetado no build de CI.

### Teste de bridge no Perchance

1. importar os dois plugins no Lists;
2. atualizar o loader com o SHA completo;
3. confirmar montagem;
4. confirmar origem do `root`;
5. confirmar callable de `root.ai` e `root.image`;
6. parar e diagnosticar antes de gerar se a bridge estiver indisponível.

### Teste de assets

1. abrir com IndexedDB vazio;
2. acompanhar a fila;
3. confirmar fundo;
4. confirmar alpha de personagens;
5. fechar e reabrir;
6. confirmar reutilização do cache;
7. regenerar um asset;
8. simular/observar falha e confirmar preservação do asset anterior;
9. limpar cache;
10. regenerar todos.

### Teste visual

1. conferir camadas e ordem de profundidade;
2. conferir personagens na trilha;
3. conferir neblina, luz e partículas;
4. conferir idle/bounce;
5. testar redimensionamento desktop/mobile;
6. testar toque, teclado e foco;
7. testar `prefers-reduced-motion`.

### Teste narrativo

1. escolher cada intenção inicial;
2. enviar fala curta;
3. observar `onStart`, `onChunk` e conclusão quando disponíveis;
4. verificar balões dos dois personagens;
5. verificar emoções apenas da whitelist;
6. confirmar que o sistema pausa;
7. confirmar que nenhuma nova fala é criada sem nova ação;
8. testar entrada ambígua e fora de contexto sem adicionar lógica especial no cliente;
9. testar erro do plugin e retorno ao estado recuperável.

---

## 16. Riscos e decisões pendentes

### Riscos aceitos

- qualidade variável dos assets gerados;
- inconsistência de identidade entre regenerações;
- halos ou recortes imperfeitos em `removeBackground`;
- latência e verificação Cloudflare;
- limites de geração do serviço;
- quota do IndexedDB;
- desempenho inferior em dispositivos móveis;
- retorno do plugin mudar entre versões;
- parsing narrativo falhar em respostas não conformes;
- referência visual ser interpretada de forma excessivamente literal.

### Decisões fechadas para o MVP

- demo técnica interativa;
- floresta/trilha autoral;
- cena única com escolhas narrativas;
- diorama 2.5D com planos 3D e texturas 2D, não uma reprodução de um ambiente HD-2D completo com malhas, iluminação e pós-processamento equivalentes a um jogo comercial;
- jogador com avatar visual gerado;
- dois personagens de IA;
- texto livre + intenção;
- diretor narrativo, sem loop automático;
- resposta em uma chamada por turno;
- Three.js empacotado no Vite;
- diorama com planos 3D e assets 2D;
- geração automática ao abrir;
- cache IndexedDB com limpeza;
- regenerate individual e total;
- alpha do plugin aceito sem inspeção automática obrigatória;
- desktop e mobile;
- interface/prompts narrativos em inglês, com resposta instruída a acompanhar o idioma da fala do jogador;
- efeitos obrigatórios: névoa, partículas, luz e atmosfera;
- poses extras como extensão, não como requisito de orçamento inicial.

### Pontos a confirmar antes da implementação

1. Nome, personalidade e aparência dos dois personagens de IA.
2. Identidade visual e nome do avatar do jogador.
3. Paleta final da floresta.
4. Lista final de intenções.
5. Quais três ou quatro hotspots narrativos existirão na cena.
6. Se o fundo terá uma única imagem landscape ou uma camada ambiental adicional.
7. Frases e schema final de emoção/turno.
8. Limite exato do histórico enviado ao plugin de texto.
9. Nome do novo repositório e endereço final do GitHub Pages.
10. Se os assets serão persistidos somente localmente ou também exportáveis para um manifesto revisável.

---

## 17. Referências utilizadas

### Contexto do repositório

- `perchance-test/docs/skill.md` — padrão de bridge externo, resolução lazy, observabilidade, cache por commit, Cloudflare e testes.
- `perchance-test/docs/perchance-integration.md` — runbook de Lists, loader, Preview e experimentos.
- `perchance-test/docs/ai-text-plugin.txt` — importação, `onStart`, `onChunk`, `onFinish`, `startWith`, `stopSequences`, `generatedText` e limites de concorrência.
- `perchance-test/docs/text-to-image-plugin.txt` — `removeBackground`, resoluções, `negativePrompt`, `guidanceScale`, `seed`, `dataUrl`, `canvas`, `iframe` e cache/geração server-backed.
- `perchance-test/src/main.ts` — bridge, diagnóstico, chamadas dos plugins e normalização inicial de retornos.
- `perchance-test/vite.config.ts` — bundle ES único e commit de build.
- `perchance-test/.github/workflows/build-and-deploy.yml` — typecheck, build e GitHub Pages.

Esses caminhos apontam para o repositório de referência local; o novo workflow de publicação será criado neste repositório durante a implementação.

### Referências web/técnicas

- Three.js `OrthographicCamera`: <https://threejs.org/docs/pages/OrthographicCamera.html>
- Three.js `PerspectiveCamera`: <https://threejs.org/docs/pages/PerspectiveCamera.html>
- Three.js `Texture`: <https://threejs.org/docs/pages/Texture.html>
- Three.js `SpriteMaterial`: <https://threejs.org/docs/index.html?q=SpriteMaterial>
- Three.js `WebGLRenderer`: <https://threejs.org/docs/index.html?q=WebGLRenderer>
- Three.js `Points` e `BufferGeometry`: <https://threejs.org/docs/index.html?q=Points>
- Three.js `Fog`: <https://threejs.org/docs/pages/Fog.html>
- MDN IndexedDB API: <https://developer.mozilla.org/pt-BR/docs/Web/API/IndexedDB_API>
- Unreal Engine — contexto técnico/artístico do HD-2D de *Octopath Traveler*: <https://www.unrealengine.com/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true>

As referências de plugin locais são a fonte operacional principal. Opções, formatos de retorno, inicialização e limites devem ser confirmados novamente no Preview do Perchance antes de tratar o comportamento como contrato estável.
