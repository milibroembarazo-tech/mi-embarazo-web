import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = (path) => fs.readFileSync(path, 'utf8');
const esHome = page('site/index.html');
const caHome = page('site/ca/index.html');

for (const heading of [
  'Com funciona',
  "Escriu durant l'embaràs",
  'Converteix els records en un llibre',
  'Regala Mi Embarazo',
  'Preguntes freqüents',
]) {
  assert.ok(caHome.includes(heading), `Catalan homepage is missing: ${heading}`);
}
assert.ok(esHome.includes('Preguntas frecuentes'));
assert.ok(caHome.includes('No és un llibre sobre el nadó.'));
assert.ok(!caHome.includes('No és només un llibre sobre el nadó.'));

const caDiary = page('site/ca/diari-embaras/index.html');
for (const heading of ['Setmana a setmana', 'Moments importants', 'Mode sensible']) {
  assert.ok(caDiary.includes(heading), `Catalan diary page is missing: ${heading}`);
}

const esGift = page('site/regalo-embarazo/index.html');
const caGift = page('site/ca/regal-embaras/index.html');
assert.ok(esGift.includes('Regalo para una futura madre'));
assert.ok(caGift.includes('Regal per a una futura mare'));
for (const heading of ['Llibre imprès A4', 'Control de la mare']) {
  assert.ok(caGift.includes(heading), `Catalan gift page is missing: ${heading}`);
}

const esBook = page('site/libro-embarazo/index.html');
const caBook = page('site/ca/llibre-embaras/index.html');
assert.ok(esBook.includes('No es solo un libro sobre el bebé.'));
assert.ok(caBook.includes('No és només un llibre sobre el nadó.'));
for (const heading of ['Disseny editorial', 'Control abans de tancar el llibre']) {
  assert.ok(caBook.includes(heading), `Catalan book page is missing: ${heading}`);
}

for (const path of ['site/privacidad-app/index.html', 'site/ca/privacitat-app/index.html']) {
  const copy = page(path);
  assert.doesNotMatch(copy, /\bfeedback\b|\bcheckout\b/i, `${path} contains untranslated copy`);
}
assert.ok(page('site/privacidad-app/index.html').includes('Ayuda y comentarios'));
assert.ok(page('site/ca/privacitat-app/index.html').includes('Ajuda i comentaris'));

for (const route of ['privacitat', 'termes', 'cookies']) {
  const path = `site/ca/${route}/index.html`;
  const copy = page(path);
  assert.match(copy, /<html lang="ca">/, `${path} must declare Catalan`);
  assert.ok(copy.includes(`https://miembarazo.app/ca/${route}/`), `${path} must have a canonical URL`);
}
const sitemap = page('site/sitemap.xml');
for (const route of ['privacitat', 'termes', 'cookies']) {
  assert.ok(sitemap.includes(`https://miembarazo.app/ca/${route}/`), `Sitemap is missing Catalan route: ${route}`);
}

const notFound = page('site/404.html');
assert.match(notFound, /<h1>404<\/h1>/);
assert.ok(notFound.includes('Aquesta pàgina no està disponible.'));
assert.ok(notFound.includes('href="/ca/regal-embaras/"'));
assert.match(notFound, /<a href="#ca" hreflang="ca">Català<\/a>/);
assert.match(notFound, /<title>404 \| Mi Embarazo<\/title>/);
assert.match(notFound, /#ca:target\s*\{\s*display:\s*block;\s*\}/);

console.log('Copy and Catalan parity checks passed');
