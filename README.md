# Perchance Forest Diorama

Novo projeto separado para a demo técnica de floresta autoral em diorama 2.5D, conforme `docs/hd-2d-perchance-scene-spec.md`.

## Relação com `perchance-test`

`perchance-test` **não é editado por este projeto**. Ele permanece como laboratório de referência para a integração:

- Lists importa `ai-text-plugin` e `text-to-image-plugin`;
- o HTML/CSS/JS do gerador carrega um bundle Vite externo;
- o bundle resolve `root.ai` e `root.image` em runtime;
- o Preview do Perchance é a validação real da bridge.

Este repositório usará essa integração, mas implementará a cena, cache, narrativa, renderização e UI de forma própria.

## Estado atual

Scaffold executável do MVP:

- Vite + TypeScript estrito;
- bundle ES único `main.bundle.js`;
- runtime Three.js com câmera ortográfica e resize;
- resolução lazy tipada da bridge;
- manifesto inicial de seis assets;
- contrato inicial de cache IndexedDB;
- máquina de estados narrativa sem loop automático;
- shell responsivo com diagnóstico local.

A geração automática de assets, persistência integrada à preparação e os controles narrativos ainda não estão habilitados. Nenhuma chamada a `root.ai` ou `root.image` ocorre durante o boot; a UI oferece probes manuais explícitos para validação do Preview.

## Desenvolvimento

```bash
npm ci
npm run check
npm run dev
```

Para validar no Perchance, importe no painel **Lists**:

```perchance
ai = {import:ai-text-plugin}
image = {import:text-to-image-plugin}
```

E carregue o bundle publicado no painel **HTML/CSS/JS**, sempre com uma revisão SHA completa:

O procedimento completo, incluindo os dois probes manuais e a classificação de erros, está em [`docs/perchance-preview-checklist.md`](docs/perchance-preview-checklist.md).

```html
<script type="module">
  import "https://fahell.github.io/perchance-forest-diorama/main.bundle.js?rev=ad15acc7b74b918fc2546197846f7efd16d16d54";
</script>
```

As opções e formas de retorno dos plugins devem ser confirmadas novamente no Preview antes de virarem contratos estáveis. O repositório remoto é `https://github.com/Fahell/perchance-forest-diorama` e o bundle publicado está em `https://fahell.github.io/perchance-forest-diorama/`. Após cada novo push, atualize o SHA em `?rev=`.
