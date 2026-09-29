const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const domain = 'https://eastmanpowersolutions.in';
const excludedRoots = new Set(['node_modules', '.git', 'dist', 'live-files']);
const excludedRoutes = new Set(['pages']);

function collectPages(directory, relative = '') {
  const pages = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || excludedRoots.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    const nextRelative = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) pages.push(...collectPages(absolute, nextRelative));
    else if (entry.name === 'index.html') {
      const route = path.posix.dirname(nextRelative) === '.' ? '' : path.posix.dirname(nextRelative);
      if (!excludedRoutes.has(route)) pages.push(route);
    }
  }
  return pages;
}

function priority(route) {
  if (!route) return '1.0';
  if (['home-inverters', 'inverter-batteries', 'lithtec-combo'].includes(route)) return '0.9';
  if (route === 'load-calculator' || route === 'partner-with-us') return '0.7';
  return '0.8';
}

const routes = [...new Set(collectPages(root))].sort((a, b) => {
  if (!a) return -1;
  if (!b) return 1;
  return a.localeCompare(b);
});
const lastmod = new Date().toISOString().slice(0, 10);
const urls = routes.map(route => {
  const location = route ? `${domain}/${route}/` : `${domain}/`;
  const frequency = route ? 'monthly' : 'weekly';
  return `  <url><loc>${location}</loc><lastmod>${lastmod}</lastmod><changefreq>${frequency}</changefreq><priority>${priority(route)}</priority></url>`;
});
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${domain}/sitemap.xml\n`;

fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(root, 'robots.txt'), robots);

const liveRoot = path.join(root, 'live-files');
if (fs.existsSync(liveRoot)) {
  fs.writeFileSync(path.join(liveRoot, 'sitemap.xml'), sitemap);
  fs.writeFileSync(path.join(liveRoot, 'robots.txt'), robots);
}

console.log(`Generated sitemap.xml with ${routes.length} public pages.`);
console.log(`Last modified date: ${lastmod}`);
