import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const listeners = {};
const classes = new Set();
const attributes = {};
const document = { activeElement: null };
const link = { focus: () => { document.activeElement = link; } };
const button = {
  setAttribute: (key, value) => { attributes[key] = value; },
  getAttribute: (key) => attributes[key],
  addEventListener: (event, callback) => { listeners[event] = callback; },
  focus: () => { document.activeElement = button; },
};
const panel = {
  closest: () => null,
  classList: {
    add: (...names) => names.forEach((name) => classes.add(name)),
    toggle: (name, force) => force ? classes.add(name) : classes.delete(name),
  },
  before: () => {},
  contains: (element) => element === link,
  querySelector: () => link,
};
const nav = {
  querySelector: () => panel,
  classList: { add: () => {} },
  addEventListener: (event, callback) => { listeners[event] = callback; },
};
panel.addEventListener = (event, callback) => { listeners[`panel:${event}`] = callback; };
const mobile = {
  matches: false,
  addEventListener: (event, callback) => { listeners[`media:${event}`] = callback; },
};
document.querySelectorAll = () => [nav];
document.createElement = () => button;
vm.runInNewContext(fs.readFileSync('site/assets/nav.js', 'utf8'), {
  document,
  window: { matchMedia: () => mobile },
});

document.activeElement = link;
mobile.matches = true;
listeners['media:change']();
assert.equal(document.activeElement, button);
assert.equal(attributes['aria-expanded'], 'false');
assert.ok(classes.has('is-closed'));

mobile.matches = false;
listeners['media:change']();
assert.equal(document.activeElement, link);

mobile.matches = true;
listeners.click();
document.activeElement = link;
listeners.keydown({ key: 'Escape' });
assert.equal(document.activeElement, button);
assert.equal(attributes['aria-expanded'], 'false');
console.log('Navigation focus checks passed');
