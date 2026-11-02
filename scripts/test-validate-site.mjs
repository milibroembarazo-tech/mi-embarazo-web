import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mi-embarazo-validate-'));
try {
  fs.cpSync('site', path.join(tempDir, 'site'), { recursive: true });
  const validator = path.resolve('scripts/validate-site.mjs');
  const page = path.join(tempDir, 'site/ca/suport-app/index.html');
  const original = fs.readFileSync(page, 'utf8');
  const validate = () => spawnSync(process.execPath, [validator], { cwd: tempDir, encoding: 'utf8' });

  assert.equal(validate().status, 0);
  const cases = [
    [original.replace(/<html\s+lang="[^"]+"/, '<html'), /missing html lang/],
    [original.replace(/^\s*<link rel="icon"[^>]*>\n/gm, ''), /missing favicon/],
    [
      original.replace('href="/favicon.ico"', 'href="favicon.ico"'),
      /favicon must use a root-relative path/,
    ],
    [original.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, ''), /expected exactly one h1/],
    [original.replace('</body>', '<h1>Duplicate</h1></body>'), /expected exactly one h1/],
    [original.replace('</body>', '<img src=""></body>'), /image missing alt/],
    [original.replace('</body>', '<div id="test-id"></div><div id="test-id"></div></body>'), /duplicate id test-id/],
    [original.replace('</body>', '<a href="#missing-target">Link</a></body>'), /missing fragment #missing-target/],
    [original.replace('</body>', '<h2>Section</h2><h4>Skipped</h4></body>'), /heading level skipped from h2 to h4/],
  ];
  for (const [content, expected] of cases) {
    assert.notEqual(content, original);
    fs.writeFileSync(page, content);
    const result = validate();
    assert.equal(result.status, 1);
    assert.match(result.stderr, expected);
  }
  for (const content of [
    '<p>milibroembarazo@gmail.com</p>',
    '<a href="mailto:milibroembarazo@gmail.com">Contacte</a>',
    '<p>milibroembarazo&#64;gmail.com</p>',
  ]) {
    fs.writeFileSync(page, `${original}\n${content}`);
    const result = validate();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /site\/ca\/suport-app\/index\.html: uses legacy contact email/);
  }
  fs.writeFileSync(page, original);
  for (const recipient of ['personal@example.com', 'contacto@miembarazo.app?cc=personal@gmail.com',
    'contacto@miembarazo.app?subject=x?y&amp;cc=personal@gmail.com']) {
    fs.writeFileSync(page, original.replace('mailto:soporte@miembarazo.app', `mailto:${recipient}`));
    const result = validate();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /unapproved email recipient/);
  }
  fs.writeFileSync(page, original);
  for (const betaPage of ['site/index.html', 'site/ca/index.html', 'site/diario-embarazo/index.html']) {
    const betaPath = path.join(tempDir, betaPage);
    const betaOriginal = fs.readFileSync(betaPath, 'utf8');
    for (const [content, expected] of [
      [betaOriginal.replace(/subject=[^&"]+&amp;/, ''), /beta email requires subject and body/],
      [betaOriginal.replace(/&amp;body=[^"]+/, ''), /beta email requires subject and body/],
      [betaOriginal.replace(/(&amp;body=)[^"]+/, '$1Hola'), /beta email body must state manual review or coordination/],
      [betaOriginal.replace(/(&amp;body=)[^"]+/, '$1no%20se%20revisar%C3%A1%20manualmente'), /beta email body must state manual review or coordination/],
      ...['soporte', 'privacidad'].map((recipient) => [
        betaOriginal.replace('mailto:contacto@miembarazo.app', `mailto:${recipient}@miembarazo.app`),
        /beta email must be addressed to contacto@miembarazo\.app/,
      ]),
      ...['to', 'cc', 'bcc'].map((field) => [
        betaOriginal.replace('mailto:contacto@miembarazo.app?', `mailto:contacto@miembarazo.app?${field}=privacidad@miembarazo.app&amp;`),
        /beta email must be addressed to contacto@miembarazo\.app only/,
      ]),
    ]) {
      assert.notEqual(content, betaOriginal);
      fs.writeFileSync(betaPath, content);
      const result = validate();
      assert.equal(result.status, 1);
      assert.match(result.stderr, expected);
    }
    fs.writeFileSync(betaPath, betaOriginal);
  }
  console.log('Site validation checks passed');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
