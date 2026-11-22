/* =========================================================
   ANTEIKU XTREINO — lógica do site
   Todos os dados (times, resultados e regras) ficam em data/xtreino.js
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const reduzMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let D = null;

  /* ---------------- Dados ---------------- */
  function normalizar(d) {
    d = d && typeof d === 'object' ? d : {};
    d.config = Object.assign({
      nome: 'Anteiku Xtreino',
      pontosColocacao: [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0],
      pontosPorKill: 1,
      discord: '',
      whatsapp: '',
    }, d.config || {});
    if (!Array.isArray(d.config.pontosColocacao)) d.config.pontosColocacao = [];
    d.times = Array.isArray(d.times) ? d.times : [];
    d.sessoes = Array.isArray(d.sessoes) ? d.sessoes : [];
    d.regras = Array.isArray(d.regras) ? d.regras : [];
    d.times.forEach((t, i) => { t.id = t.id || `t${i + 1}`; t.jogadores = Array.isArray(t.jogadores) ? t.jogadores : []; });
    d.sessoes.forEach((s, i) => {
      s.id = s.id || `s${i + 1}`;
      s.quedas = Array.isArray(s.quedas) ? s.quedas : [];
      s.quedas.forEach((q) => { q.resultados = q.resultados && typeof q.resultados === 'object' ? q.resultados : {}; });
    });
    return d;
  }

  const temResultado = (q) => Object.values(q.resultados || {}).some((r) => Number(r.pos) || Number(r.kills));

  /* ---------------- Render ---------------- */
  function renderTudo() {
    if ($('#heroStats')) document.title = D.config.nome || 'Anteiku Xtreino';
    renderHero();
    observarReveal();
  }

  function renderHero() {
    if (!$('#heroStats')) return;
    const quedasJogadas = D.sessoes.reduce((n, s) => n + s.quedas.filter(temResultado).length, 0);
    const stats = [
      ['Times', D.times.length],
      ['Xtreinos', D.sessoes.filter((s) => s.quedas.some(temResultado)).length],
      ['Quedas jogadas', quedasJogadas],
    ];
    $('#heroStats').innerHTML = stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${pad(v)}</dd></div>`).join('');
  }

  /* ---------------- Efeitos ---------------- */
  let obsReveal;
  function observarReveal() {
    if (reduzMovimento || !('IntersectionObserver' in window)) { $$('.reveal').forEach((e) => e.classList.add('in')); return; }
    if (!obsReveal) {
      obsReveal = new IntersectionObserver((ents) => ents.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); obsReveal.unobserve(e.target); }
      }), { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    }
    $$('.reveal:not(.in)').forEach((e) => obsReveal.observe(e));
  }

  function glitchTitulo() {
    const t = $('.titulo');
    if (!t || reduzMovimento) return;
    const dispara = () => { t.classList.remove('glitch'); void t.offsetWidth; t.classList.add('glitch'); };
    t.addEventListener('mouseenter', dispara);
    setTimeout(dispara, 900);
    setInterval(() => { if (!document.hidden) dispara(); }, 7000);
  }

  // Fundo: brasas vermelhas subindo devagar, que desviam do mouse
  function fundo() {
    const c = $('#bg');
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let w, h, dpr, ps = [];
    let mx = -1e5, my = -1e5;
    const nova = (inicial) => ({
      x: Math.random() * w,
      y: inicial ? Math.random() * h : h + 10 * dpr,
      r: (Math.random() * 1.6 + 0.4) * dpr,
      v: (Math.random() * 0.25 + 0.08) * dpr,
      a: Math.random() * 0.45 + 0.12,
      o: Math.random() * Math.PI * 2,
    });
    function ajustar() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.width = innerWidth * dpr;
      h = c.height = innerHeight * dpr;
      c.style.width = innerWidth + 'px';
      c.style.height = innerHeight + 'px';
      const qtd = Math.round(Math.min(70, innerWidth / 20));
      ps = Array.from({ length: qtd }, () => nova(true));
    }
    ajustar();
    addEventListener('resize', ajustar);
    addEventListener('pointermove', (e) => { mx = e.clientX * dpr; my = e.clientY * dpr; }, { passive: true });
    addEventListener('pointerleave', () => { mx = my = -1e5; });
    function desenhar(t) {
      const R2 = (110 * dpr) ** 2;
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        if (!reduzMovimento) {
          p.y -= p.v;
          p.x += Math.sin(t / 2200 + p.o) * 0.15 * dpr;
          const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
          if (d2 < R2) { const d = Math.sqrt(d2) || 1, f = (1 - d2 / R2) * 1.4; p.x += dx / d * f; p.y += dy / d * f; }
          if (p.y < -10) Object.assign(p, nova(false));
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(222, 32, 44, ${p.a * (0.6 + 0.4 * Math.sin(t / 900 + p.o))})`;
        ctx.fill();
      }
    }
    if (reduzMovimento) { desenhar(0); return; }
    const loop = (t) => { if (!document.hidden) desenhar(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  /* ---------------- Início ---------------- */
  function iniciar() {
    D = normalizar(window.XTREINO_DATA);
    // Times editados na página "Editar times" ficam salvos neste navegador
    try {
      const salvos = JSON.parse(localStorage.getItem('anteiku-xtreino:times-v2'));
      if (Array.isArray(salvos)) D.times = salvos;
    } catch (e) { /* sem times salvos */ }
    renderTudo();
    glitchTitulo();
    fundo();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
