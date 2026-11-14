/* Amplitude Lab — botão de tradução (PT / EN / ES) via Google Tradutor */
(function () {
  var LANGS = [['pt', 'PT', 'Português'], ['en', 'EN', 'English'], ['es', 'ES', 'Español']];
  var KEY = 'al_lang';

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function current() { var m = document.cookie.match(/googtrans=\/pt\/(\w+)/); return m ? m[1] : 'pt'; }
  function writeCookie(lang) {
    var h = location.hostname, past = ';expires=Thu, 01 Jan 1970 00:00:00 GMT';
    if (lang === 'pt') {
      document.cookie = 'googtrans=;path=/' + past;
      document.cookie = 'googtrans=;path=/;domain=' + h + past;
    } else {
      document.cookie = 'googtrans=/pt/' + lang + ';path=/';
      document.cookie = 'googtrans=/pt/' + lang + ';path=/;domain=' + h;
    }
  }
  function setLang(lang) {
    store(KEY, lang);
    if (lang === current()) return;
    writeCookie(lang);
    location.reload();
  }

  // 1) ?lang=en na URL (bom para links de DM)  2) 1ª visita com navegador em outro idioma
  var param = (location.search.match(/[?&]lang=(pt|en|es)\b/) || [])[1];
  if (param && param !== current()) { store(KEY, param); writeCookie(param); }
  else if (!param && !store(KEY)) {
    var nav = (navigator.language || 'pt').slice(0, 2).toLowerCase();
    if (nav !== 'pt' && current() === 'pt') {
      var auto = nav === 'es' ? 'es' : 'en';
      store(KEY, auto); writeCookie(auto);
    }
  }

  var css = document.createElement('style');
  css.textContent =
    '.al-tr{position:fixed;left:16px;bottom:16px;z-index:99999;display:flex;align-items:center;gap:2px;padding:4px;' +
    'background:rgba(12,12,18,.82);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
    'border:1px solid rgba(255,255,255,.16);border-radius:999px;font:600 12px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
    'box-shadow:0 6px 24px rgba(0,0,0,.35)}' +
    '.al-tr span{padding:0 6px 0 8px;font-size:14px}' +
    '.al-tr button{all:unset;cursor:pointer;color:#cfd2dc;padding:8px 10px;border-radius:999px;letter-spacing:.04em}' +
    '.al-tr button:hover{color:#fff;background:rgba(255,255,255,.08)}' +
    '.al-tr button[aria-pressed=true]{color:#0c0c12;background:#fff}' +
    '.al-tr button:focus-visible{outline:2px solid #fff;outline-offset:1px}' +
    /* esconde a barra do Google */
    'body{top:0!important}.goog-te-banner-frame,.skiptranslate>iframe,iframe.skiptranslate,' +
    '.VIpgJd-ZVi9od-ORHb-OEVmcd,#goog-gt-tt,.goog-te-balloon-frame,#al-gt{display:none!important}' +
    'font[style]{background:none!important;box-shadow:none!important}';
  document.head.appendChild(css);

  function build() {
    var cur = current();
    var box = document.createElement('div');
    box.className = 'al-tr notranslate';
    box.setAttribute('translate', 'no');
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Idioma / Language');
    box.innerHTML = '<span aria-hidden="true">🌐</span>';
    LANGS.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = l[1]; b.title = l[2];
      b.setAttribute('aria-pressed', String(l[0] === cur));
      b.addEventListener('click', function () { setLang(l[0]); });
      box.appendChild(b);
    });
    document.body.appendChild(box);

    if (cur !== 'pt') {
      var holder = document.createElement('div'); holder.id = 'al-gt'; document.body.appendChild(holder);
      window.alGoogleTranslateInit = function () {
        new google.translate.TranslateElement({ pageLanguage: 'pt', autoDisplay: false }, 'al-gt');
      };
      var s = document.createElement('script');
      s.src = 'https://translate.google.com/translate_a/element.js?cb=alGoogleTranslateInit';
      document.body.appendChild(s);
    }
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
