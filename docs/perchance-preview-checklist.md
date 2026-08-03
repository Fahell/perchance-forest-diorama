# Checklist de verificação no Preview do Perchance

Este documento valida a bridge real do novo projeto. O `perchance-test` continua sendo referência; não use mocks para classificar o Preview.

## 1. Pré-requisitos locais

No repositório `perchance-forest-diorama`:

```bash
npm ci
npm run check
```

O build deve produzir somente:

```text
dist/main.bundle.js
```

## 2. Publicar o bundle

1. Faça push da branch `main` para o GitHub.
2. Aguarde o workflow `Build and deploy Perchance bundle` terminar com sucesso.
3. Confirme que o GitHub Pages está habilitado para **GitHub Actions** como fonte de publicação.
4. Use a URL Pages do repositório:

```text
https://fahell.github.io/perchance-forest-diorama/main.bundle.js
```

5. Teste a resposta direta do arquivo. Ela deve ser HTTP 200 e JavaScript, não uma página HTML de erro.
6. Copie o SHA completo do commit publicado. Para esta publicação, o SHA é `ad15acc7b74b918fc2546197846f7efd16d16d54`; em futuras publicações, substitua-o pelo novo SHA.

O workflow usa `actions/configure-pages`, `actions/upload-pages-artifact` e `actions/deploy-pages`, com permissões Pages/OIDC e `npm ci`, typecheck, testes e build antes do deploy. O repositório precisa ter Pages habilitado com GitHub Actions e um remote GitHub configurado.

## 3. Configurar o gerador Perchance

### Lists

Use apenas estes imports:

```perchance
ai = {import:ai-text-plugin}
image = {import:text-to-image-plugin}
```

Salve o gerador antes de abrir o Preview.

### HTML/CSS/JS

Use a URL Pages real abaixo e substitua somente `FULL_COMMIT_SHA` pelo SHA completo do commit publicado:

```html
<script type="module">
  import "https://fahell.github.io/perchance-forest-diorama/main.bundle.js?rev=ad15acc7b74b918fc2546197846f7efd16d16d54";
</script>
```

Não copie o código-fonte do bundle para o editor. Não importe o bundle por uma URL raw do GitHub. O arquivo precisa ser servido como módulo JavaScript por um host estático.

## 4. Diagnóstico inicial, sem custo de geração

No Preview, confirme:

- `root available via window` ou `root available via parent`;
- `root.ai callable`;
- `root.image callable`;
- SHA de build no topo;
- URL do módulo com `?rev=FULL_COMMIT_SHA` no rodapé;
- `renderer: ready` ou fallback WebGL honesto;
- nenhum spinner infinito;
- nenhum erro de módulo/MIME no console.

Se a bridge estiver indisponível, **pare antes dos probes**. Verifique Lists, URL do módulo, contexto do Preview e console. Não tente corrigir avisos Cloudflare antes de confirmar se a chamada realmente começou.

## 5. Probe de texto

Clique uma vez em **Probe root.ai (text)**.

Registre somente:

- estado inicial;
- `onStart`, se houver evidência visual/console;
- chunks parciais, se houver;
- texto final;
- erro terminal seguro;
- tempo aproximado e comportamento de verificação.

Classificação:

- **bridge failure:** root/plugin não callable ou bundle falha antes da chamada;
- **service/verification failure:** root.ai callable, chamada iniciou, mas terminou em erro;
- **success:** resultado final exibido;
- **environment noise:** avisos Cloudflare/CORS que não impediram o resultado.

Não copie tokens Turnstile, cookies, headers, URLs transitórias de desafio ou dados de conta.

## 6. Probe de imagem

O probe de imagem é manual e pode consumir GPU/fila. Rode somente depois do texto ou quando o diagnóstico estiver claro.

Teste as duas opções, uma por vez:

1. `prompt string + options`
2. `options object`

Para cada execução registre:

- forma de invocação;
- se `removeBackground` ainda não foi usado neste probe básico;
- sucesso/falha terminal;
- representação normalizada: `dataUrl`, `canvas`, `image`, `string-url` ou iframe convertido;
- `inputs` efetivos quando expostos;
- seed efetivo quando exposto;
- se a imagem foi exibida.

Depois, se o probe básico funcionar, marque o controle **include removeBackground (costly)** e repita uma chamada deliberada com `removeBackground: true`. A assinatura aceita e o retorno devem ser confirmados empiricamente antes de ligar a fila automática.

## 7. Evidências esperadas

Preencha um registro fora do código com:

```text
generator URL:
date/time:
bundle URL including ?rev=:
full commit SHA:
build shown in UI:
root source:
root.ai:
root.image:
text invocation:
text terminal result:
image invocation:
image terminal result:
image representation:
effective inputs/seed:
relevant safe errors:
browser/device:
```

## 8. Problemas comuns

| Sintoma | Diagnóstico inicial |
| --- | --- |
| `Failed to load module script` | URL, deploy Pages ou MIME incorreto; não é erro de plugin. |
| UI antiga | Pages ainda não terminou ou `?rev=` não foi atualizado para o SHA completo. |
| root ausente | contexto do Preview, imports Lists não salvos ou restrição de acesso ao parent. |
| root existe, plugin ausente | nome/import do plugin ou inicialização do host. |
| probe aguarda token | aguarde o estado terminal; não classifique como falha intermediária. |
| imagem resolve mas não aparece | observe representation/result keys e registre o formato real. |
| avisos Cloudflare/CORS com resultado | classifique pelo resultado terminal da aplicação. |
| WebGL unavailable | fallback é esperado; registre dispositivo/browser e continue a validar bridge/cache. |

## 9. Critério para habilitar a próxima fase

A fila automática de assets só deve ser ativada depois que o registro confirmar:

- bridge callable no Preview;
- probe de texto com resultado terminal compreendido;
- ao menos uma forma de imagem confirmada;
- representação de imagem normalizada corretamente;
- opções efetivas registradas;
- comportamento de `removeBackground` confirmado separadamente;
- nenhum segredo capturado nos logs.
