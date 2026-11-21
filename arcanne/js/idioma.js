// Escolhe a versão do site antes de desenhar a página.
// 1. Escolha manual guardada (botão PT/EN) vale sempre.
// 2. Sem escolha, só a raiz em português redireciona: lê os idiomas preferidos do navegador
//    na ordem; o primeiro que for pt ou en decide. Se nenhum for, o fuso horário desempata
//    (fuso do Brasil ou de Portugal fica em português; o resto vai para o inglês).
//    Sem nenhum sinal, fica em português. Nunca pede localização.
// 3. Robôs de busca e testes (?idioma=fixo) não são redirecionados.
(function () {
  'use strict';
  var CHAVE = 'arcanne:idioma';
  var raiz = document.documentElement;
  // Chegou com #seção: layout completo desde o começo (ver content-visibility no CSS).
  if (location.hash.length > 1) raiz.classList.add('tudo-visivel');
  var atual = raiz.getAttribute('data-idioma') === 'en' ? 'en' : 'pt';
  var params = new URLSearchParams(location.search);
  if (params.get('idioma') === 'fixo') return;
  if (/bot|crawl|spider|slurp|lighthouse|facebookexternalhit|embedly|preview/i.test(navigator.userAgent)) return;

  var guardado = null;
  try { guardado = localStorage.getItem(CHAVE); } catch (e) { /* modo privado */ }

  function detectar() {
    var lista = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
    for (var i = 0; i < lista.length; i++) {
      var l = String(lista[i] || '').toLowerCase();
      if (l.indexOf('pt') === 0) return 'pt';
      if (l.indexOf('en') === 0) return 'en';
    }
    if (!lista[0]) return 'pt';
    var fuso = '';
    try { fuso = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* sem Intl */ }
    if (/^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Maceio|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Araguaina|Santarem|Noronha|Eirunepe)$/.test(fuso) || /^(Europe\/Lisbon|Atlantic\/(Azores|Madeira))$/.test(fuso)) return 'pt';
    return 'en';
  }

  var alvo = guardado === 'pt' || guardado === 'en' ? guardado : (atual === 'pt' ? detectar() : atual);
  if (alvo === atual) return;
  var base = location.pathname.replace(/index\.html$/, '');
  var destino = atual === 'pt' ? base + 'en/' : base.replace(/en\/$/, '');
  location.replace(destino + location.search + location.hash);
})();
