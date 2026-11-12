// Avisos do CRM no celular: mostra a notificação que o servidor manda e abre o painel ao tocar.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Amplitude CRM', {
    body: d.body || '', tag: d.tag, icon: '../../assets/icon-192.png', badge: '../../assets/icon-192.png', data: { url: d.url || './' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url || './', self.location.href).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const open = list.find((c) => c.url.split('#')[0] === url.split('#')[0]);
    return open ? open.focus() : self.clients.openWindow(url);
  }));
});
