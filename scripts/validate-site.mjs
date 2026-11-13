import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const siteDir = path.join(root, 'site');
const htmlFiles = [];
const errors = [];
const allowedEmailRecipients = new Set([
  'contacto@miembarazo.app', 'soporte@miembarazo.app', 'privacidad@miembarazo.app',
]);
const betaPages = new Set([
  'site/index.html', 'site/ca/index.html', 'site/diario-embarazo/index.html',
]);
const commercialPages = new Set([
  'site/index.html',
  'site/ca/index.html',
  'site/libro-embarazo/index.html',
  'site/ca/llibre-embaras/index.html',
  'site/regalo-embarazo/index.html',
  'site/ca/regal-embaras/index.html',
]);
const shippingDisclosurePages = new Map([
  ['site/libro-embarazo/index.html', 'El envío se paga aparte al solicitar el libro en la app (actualmente, 6 €).'],
  ['site/regalo-embarazo/index.html', 'El envío se paga aparte al solicitar el libro en la app (actualmente, 6 €).'],
  ['site/ca/llibre-embaras/index.html', 'L’enviament es paga a part quan demanis el llibre a l’app (actualment, 6 €).'],
  ['site/ca/regal-embaras/index.html', 'L’enviament es paga a part quan demanis el llibre a l’app (actualment, 6 €).'],
]);
const accountDeletionPages = new Map([
  ['site/eliminar-cuenta/index.html', {
    h1: 'Eliminar tu cuenta de Mi Embarazo',
    requiredText: [
      'eliminaremos la cuenta y el contenido personal asociado',
      'pedido, pago, reembolso o solicitud de regalo que aún requiera gestión',
      'datos mínimos de pedidos, pagos o facturación',
      'una restauración de una copia puede requerir volver a aplicar las solicitudes de eliminación',
      'plazo máximo de un mes',
    ],
  }],
  ['site/ca/eliminar-compte/index.html', {
    h1: 'Eliminar el teu compte de Mi Embarazo',
    requiredText: [
      'eliminarem el compte i el contingut personal associat',
      'comanda, pagament, reemborsament o sol·licitud de regal que encara necessiti gestió',
      'dades mínimes de comandes, pagaments o facturació',
      'si es restaura una còpia, pot caldre tornar a aplicar les sol·licituds d\'eliminació',
      "termini màxim d'un mes",
    ],
  }],
  ['site/en/delete-account/index.html', {
    h1: 'Delete your Mi Embarazo account',
    requiredText: [
      'we will delete your account and associated personal content',
      'order, payment, refund, or gift request still needs to be handled',
      'minimum order, payment, or billing data',
      'restoring a backup may require deletion requests to be reapplied',
      'respond within one month',
    ],
  }],
]);

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

  const mailtoLinks = elements.filter(({ name, attributes }) =>
    name === 'a' && /^mailto:/i.test(attributes.get('href') ?? ''));
  if (betaPages.has(relativeFile) && !mailtoLinks.length) {
    errors.push(`${relativeFile}: missing beta request email link`);
  }
  for (const { attributes } of mailtoLinks) {
    const href = attributes.get('href');
    try {
      const address = href.slice(7);
      const queryIndex = address.indexOf('?');
      const recipient = queryIndex < 0 ? address : address.slice(0, queryIndex);
      const query = queryIndex < 0 ? '' : address.slice(queryIndex + 1);
      const params = new URLSearchParams(query);
      const recipients = [decodeURIComponent(recipient)];
      for (const [key, value] of params) {
        if (/^(?:to|cc|bcc)$/i.test(key)) recipients.push(value);
      }
      if (recipients.flatMap((value) => value.split(',')).some((value) =>
        !allowedEmailRecipients.has(value.trim().toLowerCase()))) {
        errors.push(`${relativeFile}: unapproved email recipient`);
      }
      if (betaPages.has(relativeFile)) {
        if (recipients.length !== 1 || decodeURIComponent(recipient).trim().toLowerCase() !== 'contacto@miembarazo.app') {
          errors.push(`${relativeFile}: beta email must be addressed to contacto@miembarazo.app only`);
        }
        const subject = params.get('subject')?.trim();
        const body = params.get('body')?.trim();
        if (!subject || !body) errors.push(`${relativeFile}: beta email requires subject and body`);
        if (body && (!/\b(?:se|es)\s+(?:revisará|revisarà|coordinará|coordinarà)\s+manual(?:mente|ment)\b/i.test(body) ||
            /\bno\s+(?:se|es)\s+(?:revisará|revisarà|coordinará|coordinarà)\s+manual(?:mente|ment)\b/i.test(body))) {
          errors.push(`${relativeFile}: beta email body must state manual review or coordination`);
        }
      }
    } catch {
      errors.push(`${relativeFile}: invalid email link`);
    }
  }

  if (commercialPages.has(relativeFile)) {
    const body = markup.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1] ?? '';
    const notice = relativeFile.startsWith('site/ca/')
      ? 'Compra de prova: no es farà cap càrrec real.'
      : 'Compra de prueba: no se realizará ningún cargo real.';
    const checkoutLinks = [...body.matchAll(/<a\b[^>]*href="https:\/\/mi-embarazo-7d5d6\.web\.app\/gift\/(?:\?[^"#]*)?"[^>]*>/gi)];
    let previousLinkEnd = 0;
    if (!checkoutLinks.length) errors.push(`${relativeFile}: missing gift checkout link`);
    for (const link of checkoutLinks) {
      const preceding = body.slice(Math.max(previousLinkEnd, link.index - 500), link.index);
      const notices = [...preceding.matchAll(/<(?:p|span)\b[^>]*>([^<]*)<\/(?:p|span)\s*>/gi)];
      if (!notices.some((match) => decodeEntities(match[1]).includes(notice))) {
        errors.push(`${relativeFile}: missing test checkout notice before gift link`);
      }
      previousLinkEnd = link.index + link[0].length;
    }
  }

  if (shippingDisclosurePages.has(relativeFile)) {
    const body = markup.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i)?.[1] ?? '';
    const paragraphs = [...body.matchAll(/<p\s*>([^<]*)<\/p\s*>/gi)];
    if (!paragraphs.some((match) => decodeEntities(match[1]).includes(shippingDisclosurePages.get(relativeFile)))) {
      errors.push(`${relativeFile}: missing visible shipping disclosure (shipping paid separately, currently 6 €)`);
    }
  }

  if (accountDeletionPages.has(relativeFile)) {
    const requirements = accountDeletionPages.get(relativeFile);
    const text = decodeEntities(markup).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
    if (!text.includes(requirements.h1.toLowerCase())) {
      errors.push(`${relativeFile}: missing the app account deletion heading`);
    }
    for (const phrase of requirements.requiredText) {
      if (!text.includes(phrase.toLowerCase())) {
        errors.push(`${relativeFile}: missing account deletion disclosure: ${phrase}`);
      }
    }
    if (!mailtoLinks.some(({ attributes }) =>
      /^mailto:privacidad@miembarazo\.app\?subject=/i.test(attributes.get('href') ?? ''))) {
      errors.push(`${relativeFile}: missing a direct privacy email request link`);
    }
  }

  if (commercialPages.has(relativeFile) &&
      /\b(?:pen\s*drive|usb|pdf)\b/i.test(decodeEntities(html))) {
    errors.push(`${relativeFile}: unsupported PDF or USB offer`);
  }

  if (!elements.some(({ name, attributes }) => name === 'html' && attributes.get('lang'))) {
    errors.push(`${relativeFile}: missing html lang`);
  }

  const favicons = elements.filter(({ name, attributes }) =>
    name === 'link' && attributes.get('rel')?.split(/\s+/).includes('icon'));
  if (!favicons.some(({ attributes }) => attributes.get('href') === '/favicon.ico')) {
    errors.push(`${relativeFile}: missing favicon`);
  }
  if (!favicons.some(
    ({ attributes }) => attributes.get('href') === '/assets/brand/favicon-64.png',
  )) {
    errors.push(`${relativeFile}: missing PNG favicon`);
  }
  for (const { attributes } of favicons) {
    if (!attributes.get('href')?.startsWith('/')) {
      errors.push(`${relativeFile}: favicon must use a root-relative path`);
      break;
    }
  }

  if (elements.filter(({ name }) => name === 'h1').length !== 1) {
    errors.push(`${relativeFile}: expected exactly one h1`);
  }

  let previousHeading = 0;
  for (const { name } of elements) {
    if (!/^h[1-6]$/.test(name)) continue;
    const level = Number(name[1]);
    if (previousHeading && level > previousHeading + 1) {
      errors.push(`${relativeFile}: heading level skipped from h${previousHeading} to h${level}`);
    }
    previousHeading = level;
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

  if (/milibroembarazo@gmail\.com/i.test(decodeEntities(fs.readFileSync(file, 'utf8')))) {
    errors.push(`${relativeFile}: uses legacy contact email`);
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
