/* Optional interaction only. All product and application content is in HTML. */
(() => {
  const button = document.querySelector('.menu-toggle');
  const menu = document.getElementById('main-menu');
  if (button && menu) {
    const close = () => {
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
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        close(); button.focus();
      }
    });
    document.addEventListener('click', event => { if (!event.target.closest('header')) close(); });
    matchMedia('(max-width:1100px)').addEventListener('change', close);
  }
  const form = document.getElementById('enquiry-form');
  if (!form) return;
  form.hidden = false;
  const params = new URLSearchParams(location.search);
  const intentMap = { sample: 'Sample request', quote: 'Quote request', documents: 'Technical documents', application: 'Application enquiry' };
  const intent = form.elements.namedItem('intent');
  const product = form.elements.namedItem('product');
  intent.value = intentMap[params.get('intent')] || 'Application enquiry';
  const productModels = { 'tm1101-51': 'TM1101/51-5-1500', 'tm1101-standard': 'TM1101-5-1500' };
  if (Object.hasOwn(productModels, params.get('product'))) product.value = productModels[params.get('product')];
  if (params.get('application') === 'heat-metering') form.elements.namedItem('requirements').value = 'Application: heat metering\nSystem: heating / cooling\n';
  const preview = document.getElementById('draft-preview');
  const status = document.getElementById('draft-status');
  form.addEventListener('submit', event => {
    event.preventDefault();
    preview.hidden = false;
    status.textContent = 'Demo enquiry submitted. Nothing was sent or stored.';
    form.querySelectorAll('input, select, textarea, button[type="submit"]').forEach(el => { el.disabled = true; });
    preview.focus();
  });
})();
