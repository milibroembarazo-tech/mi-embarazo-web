document.querySelectorAll('.nav').forEach((nav, index) => {
  const links = nav.querySelector('.nav-links');
  if (!links) return;

  const panel = links.closest('.nav-actions') || links;
  const button = document.createElement('button');
  const mobile = window.matchMedia('(max-width: 840px)');

  panel.id = `nav-panel-${index}`;
  panel.classList.add('nav-panel', 'is-closed');
  button.type = 'button';
  button.className = 'nav-toggle';
  button.textContent = 'Menú';
  button.setAttribute('aria-controls', panel.id);
  button.setAttribute('aria-expanded', 'false');
  panel.before(button);
  nav.classList.add('nav-enhanced');

  function closeMenu() {
    if (mobile.matches && panel.contains(document.activeElement)) button.focus();
    panel.classList.add('is-closed');
    button.setAttribute('aria-expanded', 'false');
  }

  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    panel.classList.toggle('is-closed', expanded);
    button.setAttribute('aria-expanded', String(!expanded));
  });

  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobile.matches && button.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      button.focus();
    }
  });
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  mobile.addEventListener('change', () => {
    if (!mobile.matches && document.activeElement === button) {
      panel.querySelector('a[href]')?.focus();
    }
    closeMenu();
  });
});
