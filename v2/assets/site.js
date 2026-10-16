/* Optional interaction only. All product and application content is in HTML. */
(() => {
  const button = document.querySelector('.menu-toggle');
  const menu = document.getElementById('main-menu');
  if (button && menu) {
    // Submenus are native <details>; JS only closes them on Escape, outside clicks, and navigation.
    const closeSubmenus = () => menu.querySelectorAll('details[open]').forEach(details => { details.open = false; });
    const close = () => {
      closeSubmenus();
      menu.removeAttribute('data-open');
      button.setAttribute('aria-expanded', 'false');
    };
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      menu.toggleAttribute('data-open', open);
    });
    menu.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const submenu = menu.querySelector('details[open]');
      if (submenu) {
        submenu.open = false; submenu.querySelector('summary').focus();
      } else if (button.getAttribute('aria-expanded') === 'true') {
        close(); button.focus();
      }
    });
    document.addEventListener('click', event => { if (!event.target.closest('#main-menu, .menu-toggle')) close(); });
    matchMedia('(max-width:1100px)').addEventListener('change', close);
  }
  const form = document.getElementById('enquiry-form');
  if (!form) return;
  form.hidden = false;
  const params = new URLSearchParams(location.search);
  const intent = form.elements.namedItem('intent');
  const product = form.elements.namedItem('product');
  const requirements = form.elements.namedItem('requirements');
  if (intent && params.get('intent')) {
    intent.value = params.get('intent');
  }
  if (intent && !intent.value) {
    intent.value = 'application';
  }
  const productModels = {
    'tm1101-51': 'TM1101/51-5-1500',
    'tm1101-standard': 'TM1101-5-1500',
    'tm1401-85': 'TM1401-8-85-1500 / TM1401/85',
    'tm1101': 'TM1101',
    'tm1111': 'TM1111-1 / TM1111-2 / TM1111-3',
    'tm1401': 'TM1401',
    'tm1705': 'TM1705'
  };
  const productParam = params.get('product');
  if (product && productParam && Object.hasOwn(productModels, productParam)) {
    product.value = productModels[productParam];
  }
  const appParam = params.get('application');
  if (requirements && appParam === 'heat-metering') {
    requirements.value = 'Application: heat metering\nSystem: heating / cooling\n';
  } else if (requirements && appParam === 'hvac-refrigeration') {
    requirements.value = 'Application: HVAC & refrigeration\nMeasurement point: air duct / pipe clamp / immersion\n';
  } else if (requirements && appParam === 'oem') {
    requirements.value = 'Application: custom OEM sensor assembly\nTarget temperature range & geometry:\n';
  }
  const preview = document.getElementById('draft-preview');
  const status = document.getElementById('draft-status');
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (preview) preview.hidden = false;
    if (status) status.textContent = 'Demo enquiry submitted. Nothing was sent or stored.';
    form.querySelectorAll('input, select, textarea, button[type="submit"]').forEach(el => { el.disabled = true; });
    if (preview) preview.focus();
  });
})();
