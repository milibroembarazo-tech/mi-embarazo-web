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
  console.log('Site validation checks passed');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
