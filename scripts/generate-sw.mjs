import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

async function files(dir, prefix = '') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...(await files(join(dir, entry.name), relative)));
    else if (entry.name !== 'sw.js') result.push(relative);
  }
  return result.sort();
}
const paths = await files('dist');
const hash = createHash('sha256');
for (const file of paths) hash.update(await readFile(join('dist', file)));
const cache = `rva-${hash.digest('hex').slice(0, 12)}`;
await writeFile(
  'dist/sw.js',
  `// Generated from the production build. Do not edit.
const CACHE = ${JSON.stringify(cache)};
const FILES = ${JSON.stringify(paths.map((p) => './' + p))};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('rva-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(new URL('./index.html', self.registration.scope))));
  } else {
    // These are public, immutable same-origin build assets. Preview servers can
    // emit Vary: Origin, although their bytes do not vary by request origin.
    event.respondWith(caches.match(event.request, { ignoreVary: true }).then(cached => cached || fetch(event.request)));
  }
});
`,
);
console.log(`Offline cache ${cache}: ${paths.length} files`);
