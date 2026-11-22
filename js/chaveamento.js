/* =========================================================
   ANTEIKU XTREINO — chaveamento mata-mata
   Usa os times da página "Editar times" (salvos no navegador).
   O chaveamento também fica salvo no navegador.
   ========================================================= */
(() => {
  'use strict';

  const CHAVE_TIMES = 'anteiku-xtreino:times-v2';
  const CHAVE_BRACKET = 'anteiku-xtreino:chaveamento';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduzMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TROFEU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let times = [];
  let chave = null; // { ordem: [ids], vencedores: { "r-i": id } }
  let ultimoCampeao = null;

  /* ---------- Dados ---------- */
  function lerTimes() {
    try {
      const t = JSON.parse(localStorage.getItem(CHAVE_TIMES));
      if (Array.isArray(t)) return t;
    } catch (e) { /* ignora */ }
    return ((window.XTREINO_DATA && window.XTREINO_DATA.times) || []);
  }
  function lerChave() {
    try {
      const c = JSON.parse(localStorage.getItem(CHAVE_BRACKET));
      if (c && Array.isArray(c.ordem)) {
        c.vencedores = c.vencedores || {};
        if (!Array.isArray(c.r0)) c.r0 = primeiraFase(c.ordem);
        return c;
      }
    } catch (e) { /* ignora */ }
    return null;
  }
  function salvarChave() {
    try { localStorage.setItem(CHAVE_BRACKET, JSON.stringify(chave)); }
    catch (e) { toast('Não consegui salvar neste navegador', 'erro'); }
  }
  const timePorId = (id) => times.find((t) => t.id === id);

  /* ---------- Montagem ---------- */
  const potencia2 = (n) => { let p = 2; while (p < n) p *= 2; return p; };

  // Primeira fase: o 1º enfrenta o último, o 2º o penúltimo...
  // Assim, quando sobra vaga, os W.O. nunca caem um contra o outro.
  function primeiraFase(ordem) {
    const n = potencia2(ordem.length);
    const lista = ordem.concat(Array(n - ordem.length).fill(null));
    const jogos = [];
    for (let i = 0; i < n / 2; i++) jogos.push({ a: lista[i], b: lista[n - 1 - i] });
    // reorganiza para que os cabeças fiquem em lados opostos da chave
    return espalhar(jogos);
  }
  function espalhar(jogos) {
    if (jogos.length <= 2) return jogos;
    const cima = [], baixo = [];
    jogos.forEach((j, i) => ((i % 2 === 0) ? cima : baixo).push(j));
    return espalhar(cima).concat(espalhar(baixo).reverse());
  }

  // Calcula todas as fases a partir da ordem + vencedores escolhidos
  function calcular() {
    const fases = [];
    let jogos = chave.r0.map((j) => ({ a: j.a, b: j.b }));
    let r = 0;
    const validos = {};
    while (jogos.length >= 1) {
      const fase = jogos.map((j, i) => {
        const k = `${r}-${i}`;
        let w = null, wo = false;
        if (r === 0 && j.a && !j.b) { w = j.a; wo = true; }
        else if (r === 0 && !j.a && j.b) { w = j.b; wo = true; }
        else if (j.a && j.b && (chave.vencedores[k] === j.a || chave.vencedores[k] === j.b)) { w = chave.vencedores[k]; validos[k] = w; }
        return { ...j, w, wo, k };
      });
      fases.push(fase);
      if (fase.length === 1) break;
      const prox = [];
      for (let i = 0; i < fase.length; i += 2) prox.push({ a: fase[i].w, b: fase[i + 1].w });
      jogos = prox;
      r++;
    }
    // Disputa de 3º lugar: os dois que perderam nas semifinais
    let terceiro = null;
    if (fases.length >= 2) {
      const semis = fases[fases.length - 2];
      const perd = semis.map((j) => (j.wo ? { wo: true, id: null } : { wo: false, id: j.w ? (j.w === j.a ? j.b : j.a) : null }));
      terceiro = { a: perd[0].id, b: perd[1].id, k: '3o', w: null, wo: false };
      if (perd[0].wo || perd[1].wo) {
        // uma semifinal foi W.O.: quem perdeu a outra fica com o 3º direto
        terceiro.wo = true;
        terceiro.w = terceiro.a || terceiro.b;
      } else if (terceiro.a && terceiro.b && (chave.vencedores['3o'] === terceiro.a || chave.vencedores['3o'] === terceiro.b)) {
        terceiro.w = chave.vencedores['3o'];
        validos['3o'] = terceiro.w;
      }
    }
    fases.terceiro = terceiro;
    chave.vencedores = validos; // limpa vitórias que não valem mais
    return fases;
  }

  function nomeFase(qtdJogos) {
    return { 1: 'Final', 2: 'Semifinal', 4: 'Quartas de final', 8: 'Oitavas de final' }[qtdJogos] || `${qtdJogos * 2} times`;
  }

  /* ---------- Render ---------- */
  function slot(id, jogo, lado) {
    const r0 = jogo.k.startsWith('0-');
    const pos = r0 ? ` data-pos="${jogo.k.slice(2)}-${lado}"` : '';
    if (!id) {
      const vazioWO = jogo.wo;
      return `<div class="ch-slot vazio ${r0 ? 'ch-drop' : ''}"${pos}>${vazioWO ? '<span class="ch-nome">W.O.</span>' : '<span class="ch-nome">A definir</span>'}</div>`;
    }
    const t = timePorId(id);
    const nome = t ? t.nome : 'Time removido';
    const tag = t && t.tag ? `<span class="ch-tag">${esc(t.tag)}</span>` : '';
    const venceu = jogo.w === id;
    const perdeu = jogo.w && jogo.w !== id;
    const clicavel = jogo.a && jogo.b;
    const dica = clicavel ? (venceu ? 'Desfazer vitória' : 'Marcar como vencedor') : 'Avança direto (W.O.)';
    return `<button type="button" class="ch-slot ${r0 ? 'ch-arrastavel ch-drop' : ''} ${venceu ? 'venceu' : ''} ${perdeu ? 'perdeu' : ''}" data-k="${jogo.k}" data-id="${esc(id)}"${pos} ${clicavel ? '' : 'aria-disabled="true"'} title="${dica}${r0 ? ' · segure e arraste pra trocar de lugar' : ''}">
      ${tag}<span class="ch-nome">${esc(nome)}</span>${venceu ? '<span class="ch-check">✓</span>' : ''}
    </button>`;
  }

  function render(animarNovo) {
    const el = $('#bracket');
    times = lerTimes();
    const aviso = $('#aviso');

    if (times.length < 2) {
      $('#controles').hidden = true;
      aviso.hidden = true;
      $('#extras').innerHTML = '';
      el.innerHTML = `<div class="ed-vazio ch-vazio"><b>対戦</b>Cadastre pelo menos 2 times pra montar o chaveamento.<br><a class="btn primario" href="editar-times.html">Ir para Editar times</a></div>`;
      $('#info').textContent = '';
      return;
    }
    $('#controles').hidden = false;

    if (!chave) {
      $('#extras').innerHTML = '';
      el.innerHTML = `<div class="ed-vazio ch-vazio"><b>対戦</b>${times.length} times prontos. Clique em <strong>Sortear chaveamento</strong> pra montar os confrontos.</div>`;
      aviso.hidden = true;
      $('#info').textContent = `${times.length} times`;
      return;
    }

    // avisa se a lista de times mudou depois do sorteio
    const idsAtuais = times.map((t) => t.id).sort().join('|');
    const idsChave = [...chave.ordem].sort().join('|');
    aviso.hidden = idsAtuais === idsChave;
    aviso.innerHTML = 'A lista de times mudou desde o sorteio. Clique em <b>Sortear chaveamento</b> pra atualizar.';

    const fases = calcular();
    salvarChave();
    const final = fases[fases.length - 1][0];
    const campeao = final.w;
    const vice = final.w ? (final.w === final.a ? final.b : final.a) : null;
    const t3 = fases.terceiro;
    const jogosReais = fases.flat().concat(t3 && !t3.wo ? [t3] : []).filter((j) => !j.wo);
    const decididos = jogosReais.filter((j) => j.w).length;
    const totalJogos = jogosReais.length;
    $('#info').textContent = `${chave.ordem.length} times · ${decididos}/${totalJogos} confrontos decididos`;

    const altura = Math.max(fases[0].length * 112, 240);
    const colunas = fases.map((fase, r) => `
      <section class="ch-fase ${r === fases.length - 1 ? 'ultima' : ''}" style="--r:${r}">
        <h3 class="ch-fase-nome">${nomeFase(fase.length)}</h3>
        <div class="ch-jogos" style="height:${altura}px">
          ${fase.map((j, i) => `
            <div class="ch-jw ${i % 2 === 0 ? 'par-a' : 'par-b'} ${j.w ? 'decidido' : ''}">
              <div class="ch-jogo ${j.wo ? 'wo' : ''} ${animarNovo && animarNovo.has(j.k) ? 'chegou' : ''}" data-k="${j.k}">
                ${slot(j.a, j, 'a')}
                ${slot(j.b, j, 'b')}
              </div>
            </div>`).join('')}
        </div>
      </section>`).join('');

    const tc = campeao && timePorId(campeao);
    const colCampeao = `
      <section class="ch-fase ch-final-col" style="--r:${fases.length}">
        <h3 class="ch-fase-nome">Campeão</h3>
        <div class="ch-jogos" style="height:${altura}px">
          <div class="ch-campeao ${campeao ? 'tem' : ''}">
            <div class="ch-trofeu">${TROFEU}</div>
            <div class="ch-campeao-nome">${campeao ? esc(tc ? tc.nome : 'Time removido') : 'A definir'}</div>
            ${campeao && tc && tc.tag ? `<div class="ch-campeao-tag">${esc(tc.tag)}</div>` : ''}
            <div class="ch-confete" id="confete"></div>
          </div>
        </div>
      </section>`;

    el.innerHTML = colunas + colCampeao;
    renderExtras(t3, campeao, vice, animarNovo);

    if (campeao && campeao !== ultimoCampeao && ultimoCampeao !== undefined) festa();
    ultimoCampeao = campeao;
  }

  function nomeTime(id) {
    if (!id) return null;
    const t = timePorId(id);
    return t ? t.nome : 'Time removido';
  }

  function renderExtras(t3, primeiro, segundo, animarNovo) {
    const box = $('#extras');
    const disputa = !t3
      ? '<p class="ch-sub">Com só 2 times não existe disputa de 3º lugar. Cadastre pelo menos 3.</p>'
      : `<p class="ch-sub">${t3.wo ? 'Uma semifinal foi W.O., então quem perdeu a outra semifinal fica com o 3º lugar direto.' : 'Os dois times que perderam nas semifinais se enfrentam. Clique em quem venceu.'}</p>
         <div class="ch-jogo ch-jogo-3 ${t3.wo ? 'wo' : ''} ${animarNovo && animarNovo.has('3o') ? 'chegou' : ''}">${slot(t3.a, t3, 'a')}${slot(t3.b, t3, 'b')}</div>`;
    const lugares = [
      { pos: 2, id: segundo, cls: 'pd2' },
      { pos: 1, id: primeiro, cls: 'pd1' },
      { pos: 3, id: t3 ? t3.w : null, cls: 'pd3' },
    ];
    const podio = lugares.map((l) => {
      const nome = nomeTime(l.id);
      const t = l.id && timePorId(l.id);
      return `<div class="pd ${l.cls} ${nome ? 'tem' : ''}">
          <div class="pd-nome">${nome ? esc(nome) : (l.pos === 3 && !t3 ? '—' : 'A definir')}</div>
          ${t && t.tag ? `<div class="pd-tag">${esc(t.tag)}</div>` : ''}
          <div class="pd-base"><span>${l.pos}º</span></div>
        </div>`;
    }).join('');
    box.innerHTML = `
      <section class="ch-terceiro-box">
        <h3 class="ch-fase-nome">Disputa de 3º lugar</h3>
        ${disputa}
      </section>
      <section class="ch-podio-box">
        <button type="button" class="btn sm fantasma ch-baixar" data-act="baixar-podio" title="Baixar imagem do pódio">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Baixar pódio</span>
        </button>
        <h3 class="ch-fase-nome">Pódio</h3>
        <div class="ch-podio">${podio}</div>
      </section>`;
  }

  /* ---------- Imagem do pódio (PNG) ---------- */
  function podioAtual() {
    const fases = calcular();
    const final = fases[fases.length - 1][0];
    const t3 = fases.terceiro;
    return {
      primeiro: final.w,
      segundo: final.w ? (final.w === final.a ? final.b : final.a) : null,
      terceiro: t3 ? t3.w : null,
      temTerceiro: !!t3,
    };
  }

  async function baixarPodio(botao) {
    if (!chave) return;
    const p = podioAtual();
    if (!p.primeiro || (p.temTerceiro && !p.terceiro)) {
      toast(p.primeiro ? 'Falta definir o 3º lugar' : 'Falta definir o campeão', 'erro');
      return;
    }
    botao.disabled = true;
    try {
      await Promise.all([
        document.fonts.load('80px Anton'),
        document.fonts.load('800 30px Manrope'),
        document.fonts.load('600 30px "Shippori Mincho"'),
      ]).catch(() => {});
      const canvas = desenharPodio(p);
      const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/png'));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'podio-anteiku-xtreino.png';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast('Imagem do pódio baixada');
    } catch (e) {
      toast('Não consegui gerar a imagem', 'erro');
    }
    botao.disabled = false;
  }

  function desenharPodio(p) {
    const W = 1080, H = 1080;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const TIT = 'Anton, Impact, sans-serif';
    const TXT = 'Manrope, Segoe UI, sans-serif';

    // fundo
    x.fillStyle = '#09090b';
    x.fillRect(0, 0, W, H);
    let g = x.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, 700);
    g.addColorStop(0, 'rgba(211,18,30,.32)'); g.addColorStop(1, 'rgba(211,18,30,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    g = x.createRadialGradient(W * 0.5, 620, 0, W * 0.5, 620, 420);
    g.addColorStop(0, 'rgba(230,194,122,.12)'); g.addColorStop(1, 'rgba(230,194,122,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // brasas
    for (let i = 0; i < 70; i++) {
      x.beginPath();
      x.arc(Math.random() * W, Math.random() * H, Math.random() * 2.2 + 0.6, 0, Math.PI * 2);
      x.fillStyle = `rgba(222,32,44,${Math.random() * 0.45 + 0.1})`;
      x.fill();
    }

    // cabeçalho
    x.textAlign = 'center';
    x.textBaseline = 'alphabetic';
    x.fillStyle = '#c8a678';
    x.font = '600 26px "Shippori Mincho", serif';
    x.fillText('喫茶 あんていく', W / 2, 108);
    x.fillStyle = '#ece6dc';
    x.font = `112px ${TIT}`;
    x.fillText('ANTEIKU', W / 2, 228);
    x.fillStyle = '#ff3341';
    x.font = `40px ${TIT}`;
    espacado(x, 'XTREINO · PÓDIO', W / 2, 288, 14);
    x.fillStyle = '#d3121e';
    x.fillRect(W / 2 - 40, 314, 80, 3);

    // degraus
    const base = 960;
    const lugares = [
      { pos: 2, id: p.segundo, cx: 225, alt: 250, cor: '#c9cdd6' },
      { pos: 1, id: p.primeiro, cx: 540, alt: 360, cor: '#e6c27a' },
      { pos: 3, id: p.terceiro, cx: 855, alt: 180, cor: '#c98a5a' },
    ];
    const larg = 290;
    lugares.forEach((l) => {
      const topo = base - l.alt;
      const x0 = l.cx - larg / 2;
      const gr = x.createLinearGradient(0, topo, 0, base);
      gr.addColorStop(0, hexA(l.cor, 0.34)); gr.addColorStop(1, hexA(l.cor, 0.03));
      x.fillStyle = gr;
      caminhoDegrau(x, x0, topo, larg, l.alt, 18);
      x.fill();
      x.strokeStyle = hexA(l.cor, 0.6); x.lineWidth = 2;
      x.stroke();
      x.fillStyle = l.cor;
      x.font = `${l.pos === 1 ? 92 : 74}px ${TIT}`;
      x.fillText(`${l.pos}º`, l.cx, topo + (l.pos === 1 ? 112 : 92));

      const t = l.id ? timePorId(l.id) : null;
      const nome = l.id ? (t ? t.nome : 'Time removido') : '—';
      let y = topo - 30;
      if (t && t.tag) {
        x.fillStyle = '#ff3341';
        x.font = `26px ${TIT}`;
        espacado(x, t.tag, l.cx, y, 4);
        y -= 40;
      }
      x.fillStyle = '#ece6dc';
      const linhas = quebrar(x, nome, larg + 20, l.pos === 1 ? 54 : 44);
      for (let i = linhas.texto.length - 1; i >= 0; i--) {
        x.font = `${linhas.tamanho}px ${TIT}`;
        x.fillText(linhas.texto[i], l.cx, y);
        y -= linhas.tamanho * 1.08;
      }
      if (l.pos === 1) {
        x.fillStyle = '#e6c27a';
        x.font = `800 20px ${TXT}`;
        espacado(x, 'CAMPEÃO', l.cx, y - 6, 6);
      }
    });

    // rodapé
    x.fillStyle = '#26262e';
    x.fillRect(80, base, W - 160, 2);
    x.fillStyle = '#8e8a94';
    x.font = `700 22px ${TXT}`;
    const d = new Date();
    espacado(x, `ANTEIKU XTREINO · ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`, W / 2, 1020, 4);
    return c;
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }
  function caminhoDegrau(x, x0, y0, w, h, r) {
    x.beginPath();
    x.moveTo(x0, y0 + h);
    x.lineTo(x0, y0 + r);
    x.quadraticCurveTo(x0, y0, x0 + r, y0);
    x.lineTo(x0 + w - r, y0);
    x.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    x.lineTo(x0 + w, y0 + h);
  }
  // texto com espaçamento entre letras (centralizado)
  function espacado(x, txt, cx, y, esp) {
    const letras = [...txt];
    const larguras = letras.map((l) => x.measureText(l).width);
    const total = larguras.reduce((a, b) => a + b, 0) + esp * (letras.length - 1);
    let px = cx - total / 2;
    const alinh = x.textAlign;
    x.textAlign = 'left';
    letras.forEach((l, i) => { x.fillText(l, px, y); px += larguras[i] + esp; });
    x.textAlign = alinh;
  }
  // quebra o nome em até 2 linhas, diminuindo a fonte se precisar
  function quebrar(x, txt, max, tam) {
    for (let t = tam; t >= 26; t -= 2) {
      x.font = `${t}px Anton, Impact, sans-serif`;
      if (x.measureText(txt).width <= max) return { texto: [txt], tamanho: t };
      const pal = txt.split(' ');
      if (pal.length > 1) {
        for (let i = pal.length - 1; i > 0; i--) {
          const a = pal.slice(0, i).join(' '), b = pal.slice(i).join(' ');
          if (x.measureText(a).width <= max && x.measureText(b).width <= max) return { texto: [a, b], tamanho: t };
        }
      }
    }
    x.font = '26px Anton, Impact, sans-serif';
    let corte = txt;
    while (corte.length > 1 && x.measureText(corte + '…').width > max) corte = corte.slice(0, -1);
    return { texto: [corte + '…'], tamanho: 26 };
  }

  /* ---------- Efeitos ---------- */
  function festa() {
    const c = $('#confete');
    if (!c || reduzMovimento) return;
    const cores = ['#ff3341', '#d3121e', '#e6c27a', '#ece6dc', '#7a0a12'];
    c.innerHTML = Array.from({ length: 36 }, (_, i) => {
      const ang = (i / 36) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 70 + Math.random() * 90;
      return `<i style="--x:${Math.cos(ang) * dist}px;--y:${Math.sin(ang) * dist - 30}px;--rot:${Math.random() * 540}deg;--c:${cores[i % cores.length]};--atraso:${Math.random() * 120}ms"></i>`;
    }).join('');
    setTimeout(() => { c.innerHTML = ''; }, 1800);
  }

  function animarSorteio(depois) {
    const nomes = times.map((t) => t.nome);
    if (reduzMovimento || nomes.length < 2) { depois(); return; }
    const slots = $$('.ch-fase:first-child .ch-slot .ch-nome');
    if (!slots.length) { depois(); return; }
    $('#bracket').classList.add('sorteando');
    let n = 0;
    const timer = setInterval(() => {
      slots.forEach((s) => { s.textContent = nomes[Math.floor(Math.random() * nomes.length)]; });
      if (++n > 10) { clearInterval(timer); $('#bracket').classList.remove('sorteando'); depois(); }
    }, 70);
  }

  function toast(msg, tipo = '') {
    const t = document.createElement('div');
    t.className = `toast ${tipo}`;
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('sai'); setTimeout(() => t.remove(), 400); }, 2400);
  }

  /* ---------- Ações ---------- */
  const confirmar = {};
  function pedirConfirmacao(botao, acao, texto) {
    const temResultado = chave && Object.keys(chave.vencedores).length;
    if (!temResultado || confirmar[acao]) { clearTimeout(confirmar[acao]); delete confirmar[acao]; botao.classList.remove('confirmar'); return true; }
    botao.classList.add('confirmar');
    toast(texto);
    confirmar[acao] = setTimeout(() => { delete confirmar[acao]; botao.classList.remove('confirmar'); }, 3000);
    return false;
  }

  function gerar(ordem, msg) {
    const tinha = !!chave;
    chave = { ordem, r0: primeiraFase(ordem), vencedores: {} };
    ultimoCampeao = null;
    salvarChave();
    if (tinha) animarSorteio(() => { render(); toast(msg); });
    else { render(); animarSorteio(() => { render(); toast(msg); }); }
  }

  function clique(e) {
    const b = e.target.closest('[data-act]');
    if (b) {
      const act = b.dataset.act;
      if (act === 'sortear') {
        if (!pedirConfirmacao(b, act, 'Já tem resultados. Clique de novo pra sortear outra vez.')) return;
        const ids = times.map((t) => t.id);
        for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
        gerar(ids, 'Chaveamento sorteado');
      } else if (act === 'ordem') {
        if (!pedirConfirmacao(b, act, 'Já tem resultados. Clique de novo pra refazer pela ordem.')) return;
        gerar(times.map((t) => t.id), 'Chaveamento montado pela ordem dos times');
      } else if (act === 'baixar-podio') {
        baixarPodio(b);
      } else if (act === 'zerar') {
        if (!chave) return;
        if (!pedirConfirmacao(b, act, 'Clique de novo pra zerar todos os resultados.')) return;
        chave.vencedores = {};
        ultimoCampeao = null;
        salvarChave();
        render();
        toast('Resultados zerados');
      }
      return;
    }
    const s = e.target.closest('.ch-slot[data-k]');
    if (!s || s.getAttribute('aria-disabled') === 'true') return;
    const k = s.dataset.k;
    const id = s.dataset.id;
    if (chave.vencedores[k] === id) delete chave.vencedores[k];
    else chave.vencedores[k] = id;
    if (k === '3o') { render(); return; }
    const [r, i] = k.split('-').map(Number);
    // destaca o jogo da próxima fase que recebeu o time
    const novo = new Set([`${r + 1}-${Math.floor(i / 2)}`]);
    if (r === calcular().length - 2) novo.add('3o'); // semifinal decidida: atualiza a disputa de 3º
    render(chave.vencedores[k] ? novo : null);
  }

  /* ---------- Arrastar para trocar times de lugar ---------- */
  function trocar(origem, destino) {
    const [i1, l1] = origem.dataset.pos.split('-');
    const [i2, l2] = destino.dataset.pos.split('-');
    const r0 = chave.r0.map((j) => ({ ...j }));
    const v1 = r0[i1][l1];
    r0[i1][l1] = r0[i2][l2];
    r0[i2][l2] = v1;
    if (r0.some((j) => !j.a && !j.b)) { toast('Um confronto não pode ficar sem nenhum time', 'erro'); return; }
    chave.r0 = r0;
    chave.ordem = r0.flatMap((j) => [j.a, j.b]).filter(Boolean);
    salvarChave();
    render(new Set([`0-${i1}`, `0-${i2}`]));
    toast(destino.classList.contains('vazio') ? 'Time movido' : 'Times trocados de lugar');
  }

  /* ---------- Início ---------- */
  function iniciar() {
    times = lerTimes();
    chave = lerChave();
    ultimoCampeao = undefined; // não solta confete ao abrir a página
    render();
    ultimoCampeao = chave ? (calcular().slice(-1)[0][0].w) : null;
    document.addEventListener('click', clique);
    window.Arrastar({ raiz: $('#bracket'), item: '.ch-arrastavel', alvo: '.ch-drop', aoSoltar: trocar });
    // atualiza se os times forem editados em outra aba
    addEventListener('storage', (e) => { if (e.key === CHAVE_TIMES) render(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
