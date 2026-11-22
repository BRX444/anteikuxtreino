# Anteiku Xtreino

Site dos xtreinos da Anteiku: tela de abertura, cadastro de times e chaveamento mata-mata.

Feito só com HTML, CSS e JavaScript, sem servidor. Funciona direto no **GitHub Pages**.

## Estrutura

```
anteiku-xtreino/
├── index.html        → tela de abertura
├── editar-times.html → cadastro de times
├── chaveamento.html  → chaveamento mata-mata
├── css/style.css     → visual e animações
├── js/app.js         → efeitos e números da abertura
├── js/times.js       → lógica do cadastro de times
├── js/chaveamento.js → lógica do mata-mata
├── data/xtreino.js   → TODOS os dados do site (times, resultados, regras, pontuação)
├── img/favicon.svg   → ícone da aba
├── .nojekyll         → avisa o GitHub Pages para servir os arquivos como estão
└── README.md
```

## Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex.: `anteiku-xtreino`), público.
2. Clique em **Add file → Upload files** e arraste **todo o conteúdo** desta pasta (não a pasta em si). Depois clique em **Commit changes**.
3. Vá em **Settings → Pages**. Em *Branch*, escolha `main` e a pasta `/ (root)`. Clique em **Save**.
4. Em 1 ou 2 minutos o site fica no ar em `https://SEU-USUARIO.github.io/anteiku-xtreino/`.

> Pelo terminal, se preferir:
> ```bash
> git init
> git add .
> git commit -m "Site Anteiku Xtreino"
> git branch -M main
> git remote add origin https://github.com/SEU-USUARIO/anteiku-xtreino.git
> git push -u origin main
> ```

## Times e chaveamento

Os times cadastrados em **Editar times** e o chaveamento ficam salvos no navegador de quem usou (localStorage). Cada pessoa que abrir o site vê a própria versão.

## Como atualizar os dados

Tudo fica no arquivo `data/xtreino.js`. Abra ele num editor de texto (Bloco de Notas ou VS Code), mude o que precisar e salve. No GitHub, dá pra editar direto: abra o arquivo, clique no lápis ✏️, edite e clique em **Commit changes**.

Exemplo de um xtreino com uma queda:

```js
{
  "id": "s2",
  "titulo": "Xtreino de Segunda",
  "data": "2026-11-23",
  "quedas": [
    { "mapa": "Bermuda", "resultados": {
      "t1": { "pos": 1, "kills": 9 },
      "t2": { "pos": 2, "kills": 4 }
    } }
  ]
}
```

- `"t1"`, `"t2"`... são os `id` dos times cadastrados na lista `times`.
- `pos` é a colocação (1 = booyah) e `kills` são as kills do time naquela queda.
- A tabela calcula os pontos sozinha. Cada xtreino com resultado também vira um filtro na tabela.

Se o site ficar em branco depois de editar, provavelmente faltou ou sobrou uma vírgula ou aspas no arquivo.

## Pontuação

- Pontos por colocação e por kill ficam em `config` no `data/xtreino.js` (padrão: 12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0 e 1 ponto por kill).
- Desempate: mais booyahs, depois mais kills.

## Testar no computador

Basta abrir o `index.html` com dois cliques, ou rodar `python -m http.server 8000` dentro da pasta e acessar `http://localhost:8000`.
