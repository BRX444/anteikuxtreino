/* =========================================================
   ANTEIKU XTREINO — página "Editar times"
   Os times ficam salvos no navegador (localStorage).
   Na primeira vez, começa com os times de data/xtreino.js.
   ========================================================= */
(() => {
  'use strict';

  const CHAVE = 'anteiku-xtreino:times-v2';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const uid = () => 't' + Math.random().toString(36).slice(2, 9);

  const ICONE = {
    sobe: '<svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    desce: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    editar: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    apagar: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  };

  let times = [];
  let editando = null; // id do time sendo editado
  let novoId = null;   // para animar o card recém-criado

  /* ---------- Dados ---------- */
  function carregar() {
    try {
      const salvos = JSON.parse(localStorage.getItem(CHAVE));
      if (Array.isArray(salvos)) { times = salvos; return; }
    } catch (e) { /* ignora */ }
    const base = (window.XTREINO_DATA && window.XTREINO_DATA.times) || [];
    times = base.map((t) => ({ id: t.id || uid(), nome: t.nome || '', tag: t.tag || '', jogadores: Array.isArray(t.jogadores) ? t.jogadores : [] }));
  }
  function salvar() {
    times.forEach((t, i) => { t.slot = i + 1; });
    try { localStorage.setItem(CHAVE, JSON.stringify(times)); }
    catch (e) { toast('Não consegui salvar neste navegador', 'erro'); }
  }

  /* ---------- Toast ---------- */
  function toast(msg, tipo = '') {
    const t = document.createElement('div');
    t.className = `toast ${tipo}`;
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('sai'); setTimeout(() => t.remove(), 400); }, 2400);
  }

  /* ---------- Lista ---------- */
  function render() {
    const el = $('#lista');
    const q = $('#busca').value.trim().toLowerCase();
    $('#qtd').textContent = pad(times.length);

    if (!times.length) {
      el.innerHTML = '<div class="ed-vazio"><b>空席</b>Nenhum time ainda. Adicione o primeiro aí em cima.</div>';
      return;
    }
    const visiveis = times
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => !q || [t.nome, t.tag, ...t.jogadores].join(' ').toLowerCase().includes(q));
    if (!visiveis.length) {
      el.innerHTML = '<div class="ed-vazio"><b>無</b>Nenhum time encontrado.</div>';
      return;
    }
    el.innerHTML = visiveis.map(({ t, i }, n) => `
      <article class="ed-card ${t.id === editando ? 'editando' : ''} ${t.id === novoId ? 'novo' : ''}" data-id="${esc(t.id)}" style="--i:${Math.min(n, 12)}">
        <div class="ed-card-topo">
          <span class="ed-slot">#${pad(i + 1)}</span>
          ${t.tag ? `<span class="ed-tag">${esc(t.tag)}</span>` : ''}
          <div class="ed-card-acoes">
            <button type="button" class="ed-ic" data-act="sobe" title="Subir" ${i === 0 || q ? 'disabled' : ''}>${ICONE.sobe}</button>
            <button type="button" class="ed-ic" data-act="desce" title="Descer" ${i === times.length - 1 || q ? 'disabled' : ''}>${ICONE.desce}</button>
            <button type="button" class="ed-ic" data-act="editar" title="Editar">${ICONE.editar}</button>
            <button type="button" class="ed-ic del" data-act="apagar" title="Excluir">${ICONE.apagar}</button>
          </div>
        </div>
        <h3>${esc(t.nome)}</h3>
        ${t.jogadores.length ? `<ul class="ed-jogadores">${t.jogadores.map((j, k) => `<li${k === 4 ? ' class="reserva"' : ''}>${esc(j)}</li>`).join('')}</ul>` : '<p class="ed-sem">Sem jogadores</p>'}
      </article>`).join('');
    novoId = null;
  }

  /* ---------- Formulário ---------- */
  const form = () => $('#formTime');
  function limparForm() {
    form().reset();
    editando = null;
    $('#formTitulo').textContent = 'Novo time';
    $('#formBadge').hidden = true;
    $('#btnSalvar').textContent = 'Adicionar time';
    $('#btnCancelar').hidden = true;
    form().classList.remove('modo-edicao');
  }
  function editar(id) {
    const t = times.find((x) => x.id === id);
    if (!t) return;
    editando = id;
    const f = form();
    f.nome.value = t.nome;
    f.tag.value = t.tag;
    for (let k = 1; k <= 5; k++) f[`j${k}`].value = t.jogadores[k - 1] || '';
    $('#formTitulo').textContent = t.nome;
    $('#formBadge').hidden = false;
    $('#btnSalvar').textContent = 'Salvar alterações';
    $('#btnCancelar').hidden = false;
    f.classList.add('modo-edicao');
    f.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => f.nome.focus({ preventScroll: true }), 350);
    render();
  }
  function enviar(e) {
    e.preventDefault();
    const f = form();
    const nome = f.nome.value.trim();
    if (!nome) {
      f.nome.classList.remove('erro'); void f.nome.offsetWidth; f.nome.classList.add('erro');
      f.nome.focus();
      toast('Dá um nome pro time', 'erro');
      return;
    }
    const dados = {
      nome,
      tag: f.tag.value.trim().toUpperCase(),
      jogadores: [1, 2, 3, 4, 5].map((k) => f[`j${k}`].value.trim()).filter(Boolean),
    };
    const repetido = times.find((t) => t.nome.toLowerCase() === nome.toLowerCase() && t.id !== editando);
    if (repetido) { toast('Já existe um time com esse nome', 'erro'); return; }

    if (editando) {
      Object.assign(times.find((t) => t.id === editando), dados);
      toast('Time atualizado');
    } else {
      const t = { id: uid(), ...dados };
      times.push(t);
      novoId = t.id;
      toast('Time adicionado');
    }
    salvar();
    limparForm();
    render();
  }

  /* ---------- Ações dos cards ---------- */
  const confirmando = new Map();
  function acao(e) {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const card = b.closest('.ed-card');
    const id = card.dataset.id;
    const i = times.findIndex((t) => t.id === id);
    switch (b.dataset.act) {
      case 'sobe':
      case 'desce': {
        const j = b.dataset.act === 'sobe' ? i - 1 : i + 1;
        if (j < 0 || j >= times.length) return;
        [times[i], times[j]] = [times[j], times[i]];
        salvar();
        render();
        const movido = $(`.ed-card[data-id="${CSS.escape(id)}"]`);
        if (movido) movido.classList.add('movido');
        break;
      }
      case 'editar':
        editar(id);
        break;
      case 'apagar':
        if (!confirmando.has(id)) {
          b.classList.add('confirmar');
          b.title = 'Clique de novo para excluir';
          toast('Clique de novo na lixeira para excluir');
          confirmando.set(id, setTimeout(() => { confirmando.delete(id); b.classList.remove('confirmar'); b.title = 'Excluir'; }, 3000));
          return;
        }
        clearTimeout(confirmando.get(id));
        confirmando.delete(id);
        card.classList.add('saindo');
        setTimeout(() => {
          times.splice(times.findIndex((t) => t.id === id), 1);
          if (editando === id) limparForm();
          salvar();
          render();
          toast('Time excluído');
        }, 380);
        break;
      default:
    }
  }

  /* ---------- Início ---------- */
  function iniciar() {
    carregar();
    render();
    form().addEventListener('submit', enviar);
    $('#btnCancelar').addEventListener('click', () => { limparForm(); render(); });
    $('#lista').addEventListener('click', acao);
    $('#busca').addEventListener('input', render);
    window.Arrastar({
      raiz: $('#lista'),
      item: '.ed-card',
      alvo: '.ed-card',
      podeArrastar: (el, e) => !e.target.closest('button') && !$('#busca').value.trim(),
      aoSoltar: (origem, destino) => {
        const de = times.findIndex((t) => t.id === origem.dataset.id);
        const para = times.findIndex((t) => t.id === destino.dataset.id);
        if (de < 0 || para < 0) return;
        const [t] = times.splice(de, 1);
        times.splice(para, 0, t);
        salvar();
        render();
        const movido = $(`.ed-card[data-id="${CSS.escape(t.id)}"]`);
        if (movido) movido.classList.add('movido');
        toast(`${t.nome} agora é o #${pad(para + 1)}`);
      },
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && editando) { limparForm(); render(); } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
