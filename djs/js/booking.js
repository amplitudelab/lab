/* Formulário de booking → WhatsApp (página para DJs e demo).
   Cada site de DJ configura o próprio número no atributo do formulário:
     <form data-booking data-whats="5511999999999">   (só dígitos, com DDI e DDD)
   Sem número (data-whats=""), o link abre o WhatsApp para a pessoa escolher o contato.
   O idioma da mensagem segue o <html lang> no momento do envio (pt ou en). */
(function () {
  'use strict';

  var TXT = {
    pt: {
      titulo: '*Pedido de booking*',
      nome: 'Nome', data: 'Data', cidade: 'Cidade', local: 'Local / tipo de evento',
      duracao: 'Duração do set', orcamento: 'Orçamento', contato: 'Contato',
      vazio: 'a combinar', falta: 'Preencha: ', abriu: 'Abrimos o WhatsApp com o pedido pronto. Se não abriu, copie a mensagem abaixo.',
    },
    en: {
      titulo: '*Booking request*',
      nome: 'Name', data: 'Date', cidade: 'City', local: 'Venue / event type',
      duracao: 'Set length', orcamento: 'Budget', contato: 'Contact',
      vazio: 'to be discussed', falta: 'Please fill in: ', abriu: 'We opened WhatsApp with your request ready. If it did not open, copy the message below.',
    },
  };
  var CAMPOS = ['nome', 'data', 'cidade', 'local', 'duracao', 'orcamento', 'contato'];

  function lingua() { return (document.documentElement.lang || 'pt').toLowerCase().indexOf('en') === 0 ? 'en' : 'pt'; }

  function dataBonita(v, l) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    if (!m) return v;
    return l === 'en' ? m[2] + '/' + m[3] + '/' + m[1] : m[3] + '/' + m[2] + '/' + m[1];
  }

  // Monta a mensagem. Exposta para testes: window.djsBooking.mensagem(dados, 'pt')
  function mensagem(d, l) {
    var t = TXT[l] || TXT.pt;
    var linhas = [t.titulo];
    if (d.artista) linhas[0] += ' · ' + d.artista;
    CAMPOS.forEach(function (c) {
      var v = (d[c] || '').trim();
      if (c === 'data') v = dataBonita(v, l);
      linhas.push(t[c] + ': ' + (v || t.vazio));
    });
    return linhas.join('\n');
  }

  function link(numero, texto) {
    var n = String(numero || '').replace(/\D/g, '');
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(texto);
  }

  function liga(form) {
    var hoje = new Date(); hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
    var campoData = form.querySelector('[name=data]');
    if (campoData) campoData.min = hoje.toISOString().slice(0, 10);
    var saida = form.querySelector('[data-booking-saida]');
    var aviso = form.querySelector('[data-booking-aviso]');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var l = lingua(), t = TXT[l];
      var faltam = [];
      form.querySelectorAll('[required]').forEach(function (el) {
        var ok = el.value.trim() !== '';
        el.setAttribute('aria-invalid', String(!ok));
        if (!ok) faltam.push(t[el.name] || el.name);
      });
      if (faltam.length) {
        if (aviso) { aviso.textContent = t.falta + faltam.join(', '); aviso.hidden = false; }
        var primeiro = form.querySelector('[aria-invalid=true]'); if (primeiro) primeiro.focus();
        return;
      }
      var d = { artista: form.getAttribute('data-artista') || '' };
      CAMPOS.forEach(function (c) { var el = form.elements[c]; d[c] = el ? el.value : ''; });
      var texto = mensagem(d, l);
      var url = link(form.getAttribute('data-whats'), texto);
      if (saida) { saida.textContent = texto; saida.hidden = false; }
      if (aviso) { aviso.textContent = t.abriu; aviso.hidden = false; }
      // Sem 'noopener' no terceiro argumento: com ele o open devolve null e não dá para saber se abriu.
      var w = window.open(url, '_blank');
      if (w) { try { w.opener = null; } catch (e) {} } else location.href = url;
    });
  }

  window.djsBooking = { mensagem: mensagem, link: link };
  function inicia() { document.querySelectorAll('form[data-booking]').forEach(liga); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
