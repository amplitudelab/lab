/* Kit dos modelos: carregado no <head> de cada demo.
   - Dentro do hub (iframe de prévia) esconde a barra do laboratório.
   - AL.whats(titulo, mensagem, segmento): mostra a mensagem que iria para o
     WhatsApp da loja. Como as marcas são fictícias, nada é enviado a elas; o
     botão principal leva para o WhatsApp da Amplitude Lab.
   - AL.toast(texto): aviso curto no rodapé.
   - AL.px(id, largura): endereço de uma foto do Pexels salva em img/. */
(() => {
  'use strict';
  const LAB_WHATS = '5511952182016';
  const embed = window.self !== window.top;
  if (embed) document.documentElement.classList.add('al-embed');

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const labLink = (segmento) => 'https://wa.me/' + LAB_WHATS + '?text=' +
    encodeURIComponent('Oi! Vi o modelo de ' + segmento + ' da Amplitude Lab e quero um site assim para o meu negócio.');

  let sheet, toastEl, toastT, lastFocus;

  function close() {
    if (!sheet) return;
    sheet.classList.remove('on');
    sheet.setAttribute('aria-hidden', 'true');
    if (lastFocus) lastFocus.focus();
  }

  function whats(titulo, mensagem, segmento) {
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.className = 'al-sheet';
      sheet.setAttribute('aria-hidden', 'true');
      sheet.addEventListener('click', (e) => { if (e.target === sheet || e.target.closest('[data-al-close]')) close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
      document.body.appendChild(sheet);
    }
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    sheet.innerHTML =
      '<div class="al-panel" role="dialog" aria-modal="true" aria-labelledby="al-t">' +
        '<p class="al-kicker">Simulação · WhatsApp</p>' +
        '<h2 id="al-t">' + esc(titulo) + '</h2>' +
        '<div class="al-chat"><div class="al-bubble">' + esc(mensagem) + '<small>' + hora + ' ✓✓</small></div></div>' +
        '<p class="al-note">No site do seu negócio, este botão abre o WhatsApp da loja com a mensagem já escrita. Aqui a marca é fictícia, então nada foi enviado.</p>' +
        '<div class="al-acts">' +
          '<a class="al-btn main" href="' + labLink(segmento) + '" target="_blank" rel="noopener">Quero um site assim</a>' +
          '<button type="button" class="al-btn" data-al-close>Continuar navegando</button>' +
        '</div>' +
      '</div>';
    lastFocus = document.activeElement;
    sheet.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      sheet.classList.add('on');
      sheet.querySelector('.al-btn.main').focus({ preventScroll: true });
    });
  }

  function toast(texto) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'al-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = texto;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('on'), 2600);
  }

  // fotos do Pexels guardadas em modelos/img/: <id>.webp (1200 px) e <id>-p.webp (600 px)
  const IMG = new URL('img/', document.currentScript.src).href;
  const px = (id, w = 900) => IMG + id + (w <= 600 ? '-p' : '') + '.webp';

  window.AL = { whats, toast, labLink, embed, px };
})();
