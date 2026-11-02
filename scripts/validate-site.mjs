import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const siteDir = path.join(root, 'site');
const htmlFiles = [];
const errors = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlFiles.push(fullPath);
    }
  }
}

function existsTarget(fromFile, rawUrl) {
  if (
    rawUrl.startsWith('http') ||
    rawUrl.startsWith('mailto:') ||
    rawUrl.startsWith('#')
  ) {
    return true;
  }

  const cleanUrl = rawUrl.split('#')[0].split('?')[0];
  if (cleanUrl.startsWith('/')) {
    const target = path.join(siteDir, cleanUrl.replace(/^\/mi-embarazo-web(?=\/|$)/, ''));
    return fs.existsSync(target) || fs.existsSync(path.join(target, 'index.html'));
  }

  const target = path.normalize(path.join(path.dirname(fromFile), cleanUrl));
  return fs.existsSync(target) || fs.existsSync(path.join(target, 'index.html'));
}

walk(siteDir);

function readHtml(file) {
  return fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
}

function pageMarkup(html) {
  return html.replace(/(<(script|style)\b[^>]*>)[\s\S]*?<\/\2\s*>/gi, '$1');
}

function decodeEntities(value) {
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
    aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
    Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
    agrave: 'à', egrave: 'è', igrave: 'ì', ograve: 'ò', ugrave: 'ù',
    Agrave: 'À', Egrave: 'È', Igrave: 'Ì', Ograve: 'Ò', Ugrave: 'Ù',
    uuml: 'ü', Uuml: 'Ü', iuml: 'ï', Iuml: 'Ï', ntilde: 'ñ', Ntilde: 'Ñ',
    ccedil: 'ç', Ccedil: 'Ç',
  };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code[0] !== '#') return named[code] ?? entity;
    const number = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff)
      ? String.fromCodePoint(number) : '\ufffd';
  });
}

function tags(html) {
  return [...html.matchAll(/<([a-z][\w:-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)].map((match) => {
    const attributes = new Map();
    for (const attr of match[2].matchAll(/([^\s/="'<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g)) {
      const name = attr[1].toLowerCase();
      if (!attributes.has(name)) attributes.set(name, decodeEntities(attr[2] ?? attr[3] ?? attr[4] ?? ''));
    }
    return { name: match[1].toLowerCase(), attributes };
  });
}

const idsByFile = new Map();
for (const file of htmlFiles) {
  const elements = tags(pageMarkup(readHtml(file)));
  const ids = new Set();
  for (const { attributes } of elements) {
    if (!attributes.has('id')) continue;
    const id = attributes.get('id');
    if (ids.has(id)) {
      errors.push(`${path.relative(root, file)}: duplicate id ${id}`);
    }
    ids.add(id);
  }
  idsByFile.set(file, ids);
}

for (const file of htmlFiles) {
  const html = readHtml(file);
  const markup = pageMarkup(html);
  const elements = tags(markup);
  const relativeFile = path.relative(root, file);

  if (!elements.some(({ name, attributes }) => name === 'html' && attributes.get('lang'))) {
    errors.push(`${relativeFile}: missing html lang`);
  }

  if (elements.filter(({ name }) => name === 'h1').length !== 1) {
    errors.push(`${relativeFile}: expected exactly one h1`);
  }

  for (const { name, attributes } of elements) {
    if (name === 'img' && !attributes.has('alt')) {
      errors.push(`${relativeFile}: image missing alt`);
    }
  }

  for (const { attributes } of elements) {
    const href = attributes.get('href');
    if (!href || !/#.+/.test(href)) continue;
    const [url, rawFragment] = href.split('#');
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url)) continue;
    let fragment;
    try {
      fragment = decodeURIComponent(rawFragment);
    } catch {
      errors.push(`${relativeFile}: invalid fragment ${href}`);
      continue;
    }
    const cleanUrl = url.split('?')[0];
    let target = cleanUrl.startsWith('/')
      ? path.join(siteDir, cleanUrl.replace(/^\/mi-embarazo-web(?=\/|$)/, ''))
      : path.resolve(path.dirname(file), cleanUrl || path.basename(file));
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      target = path.join(target, 'index.html');
    }
    if (idsByFile.has(target) && !idsByFile.get(target).has(fragment)) {
      errors.push(`${relativeFile}: missing fragment ${href}`);
    }
  }

  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    if (/\bclass="[^"]*\bbutton\b[^"]*"/i.test(match[0]) &&
        /\bhref="mailto:contacto@miembarazo\.app(?:[?"#])/i.test(match[0])) {
      errors.push(`${relativeFile}: marketing CTA uses placeholder email`);
    }
  }

  if (!/<title>[^<]+<\/title>/.test(html)) {
    errors.push(`${relativeFile}: missing title`);
  }

  if (!/<meta name="description" content="[^"]+">/.test(html) && !relativeFile.endsWith('404.html')) {
    errors.push(`${relativeFile}: missing description`);
  }

  for (const { attributes } of elements) {
    for (const attribute of ['href', 'src']) {
      const url = attributes.get(attribute);
      if (url && !existsTarget(file, url)) {
        errors.push(`${relativeFile}: broken link ${url}`);
      }
    }
  }

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${relativeFile}: invalid JSON-LD: ${error.message}`);
    }
  }
}

if (!fs.existsSync(path.join(siteDir, 'sitemap.xml'))) {
  errors.push('site/sitemap.xml missing');
}

if (!fs.existsSync(path.join(siteDir, 'robots.txt'))) {
  errors.push('site/robots.txt missing');
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML files`);
