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
  if (cleanUrl.startsWith('/mi-embarazo-web/')) {
    const target = path.join(siteDir, cleanUrl.replace('/mi-embarazo-web/', ''));
    return fs.existsSync(target) || fs.existsSync(path.join(target, 'index.html'));
  }

  const target = path.normalize(path.join(path.dirname(fromFile), cleanUrl));
  return fs.existsSync(target) || fs.existsSync(path.join(target, 'index.html'));
}

walk(siteDir);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const relativeFile = path.relative(root, file);

  if (!/<title>[^<]+<\/title>/.test(html)) {
    errors.push(`${relativeFile}: missing title`);
  }

  if (!/<meta name="description" content="[^"]+">/.test(html) && !relativeFile.endsWith('404.html')) {
    errors.push(`${relativeFile}: missing description`);
  }

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (!existsTarget(file, match[1])) {
      errors.push(`${relativeFile}: broken link ${match[1]}`);
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
