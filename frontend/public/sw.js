self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Exotic Gills and Fins', {
      body: data.body || 'You have a new message',
      icon: '/fish-icon.png',
      badge: '/fish-icon.png',
      tag: 'admin-chat',
      renotify: true,
      data: { url: data.url || '/admin' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/admin';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes('/admin'));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
