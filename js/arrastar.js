'use strict';
/* =========================================================
   ANTEIKU XTREINO — arrastar e soltar (mouse e toque)
   Segure um item e arraste até outro para soltar.
   - Mouse: começa ao mover o item ou segurar um instante
   - Toque: segure ~0,3s e arraste (assim a página ainda rola normal)
   ========================================================= */
window.Arrastar = function ({ raiz, item, alvo, aoSoltar, podeArrastar }) {
  let st = null;
  let suprimirClique = false;

  raiz.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const el = e.target.closest(item);
    if (!el || !raiz.contains(el)) return;
    if (podeArrastar && !podeArrastar(el, e)) return;
    st = { el, x: e.clientX, y: e.clientY, id: e.pointerId, tipo: e.pointerType, ativo: false, alvo: null };
    st.timer = setTimeout(() => ativar(st && st.x, st && st.y), e.pointerType === 'mouse' ? 400 : 300);
  });

  function ativar(x, y) {
    if (!st || st.ativo) return;
    st.ativo = true;
    const r = st.el.getBoundingClientRect();
    const g = st.el.cloneNode(true);
    g.classList.remove('novo', 'movido', 'chegou', 'drag-alvo');
    g.classList.add('drag-fantasma');
    g.removeAttribute('id');
    g.style.width = r.width + 'px';
    g.style.height = r.height + 'px';
    st.dx = x - r.left;
    st.dy = y - r.top;
    document.body.appendChild(g);
    st.g = g;
    st.el.classList.add('drag-origem');
    document.body.classList.add('arrastando');
    if (navigator.vibrate) navigator.vibrate(12);
    mover(x, y);
  }

  function mover(x, y) {
    st.g.style.transform = `translate(${x - st.dx}px, ${y - st.dy}px) rotate(-2deg) scale(1.04)`;
    const sob = document.elementFromPoint(x, y);
    const a = sob && sob.closest(alvo);
    const valido = a && a !== st.el && raiz.contains(a) ? a : null;
    if (st.alvo !== valido) {
      if (st.alvo) st.alvo.classList.remove('drag-alvo');
      if (valido) valido.classList.add('drag-alvo');
      st.alvo = valido;
    }
    // rola a página quando arrasta perto das bordas
    const borda = 60;
    if (y < borda) window.scrollBy(0, -12);
    else if (y > innerHeight - borda) window.scrollBy(0, 12);
    const sc = raiz.closest('.ch-scroll');
    if (sc) {
      const rr = sc.getBoundingClientRect();
      if (x < rr.left + borda) sc.scrollLeft -= 12;
      else if (x > rr.right - borda) sc.scrollLeft += 12;
    }
  }

  function fim() {
    clearTimeout(st.timer);
    if (st.g) st.g.remove();
    st.el.classList.remove('drag-origem');
    if (st.alvo) st.alvo.classList.remove('drag-alvo');
    document.body.classList.remove('arrastando');
    st = null;
  }

  addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.id) return;
    if (!st.ativo) {
      const d = Math.hypot(e.clientX - st.x, e.clientY - st.y);
      if (d > 6) {
        if (st.tipo === 'mouse') ativar(e.clientX, e.clientY);
        else { clearTimeout(st.timer); st = null; } // no toque, mexer antes = rolar a página
      } else { st.x = e.clientX; st.y = e.clientY; }
      return;
    }
    e.preventDefault();
    mover(e.clientX, e.clientY);
  }, { passive: false });

  addEventListener('pointerup', (e) => {
    if (!st || e.pointerId !== st.id) return;
    const s = { el: st.el, alvo: st.alvo, ativo: st.ativo };
    fim();
    if (s.ativo) {
      suprimirClique = true;
      setTimeout(() => { suprimirClique = false; }, 80);
      if (s.alvo) aoSoltar(s.el, s.alvo);
    }
  });
  addEventListener('pointercancel', (e) => { if (st && e.pointerId === st.id) fim(); });

  // impede a página de rolar enquanto arrasta no celular
  addEventListener('touchmove', (e) => { if (st && st.ativo) e.preventDefault(); }, { passive: false });
  // evita o menu de "copiar/salvar" ao segurar no celular
  raiz.addEventListener('contextmenu', (e) => { if (e.target.closest(item)) e.preventDefault(); });
  // o clique que termina um arraste não conta como clique
  raiz.addEventListener('click', (e) => {
    if (suprimirClique) { e.stopPropagation(); e.preventDefault(); suprimirClique = false; }
  }, true);
};
