/* Progressive enhancement: all model data is already in the HTML. */
(() => {
  const selector = document.getElementById('sensor-variant');
  const tablist = document.querySelector('.spec-tabs');
  if (!selector || !tablist) return;
  const variants = [...document.querySelectorAll('[data-variant]')];
  const tabs = [...tablist.querySelectorAll('[data-spec-tab]')];
  const panels = [...document.querySelectorAll('[data-spec-panel]')];
  const status = document.getElementById('variant-status');
  const models = {
    'tm1101-51': 'TM1101/51-5-1500',
    'tm1101-standard': 'TM1101-5-1500'
  };
  let activeTab = 'performance';
  const selectTab = (name, focus = false) => {
    activeTab = name;
    tabs.forEach(tab => {
      const selected = tab.dataset.specTab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.specPanel !== name; });
  };
  const selectVariant = (id, announce = false) => {
    if (!Object.hasOwn(models, id)) {
      selector.value = '';
      variants.forEach(block => { block.hidden = true; });
      document.querySelectorAll('[data-variant-enquiry]').forEach(link => { link.hidden = true; });
      document.title = 'Choose a TM1101 heat meter sensor | Bocon';
      status.textContent = 'This model selection is unavailable. Choose a model above to view its data.';
      return;
    }
    selector.value = id;
    variants.forEach(block => { block.hidden = block.dataset.variant !== id; });
    document.querySelectorAll('[data-variant-enquiry]').forEach(link => {
      link.hidden = false;
      link.href = `contact.html?intent=${encodeURIComponent(link.dataset.variantEnquiry)}&product=${encodeURIComponent(id)}`;
    });
    document.title = `${models[id]} | Heat meter temperature sensor | Bocon`;
    status.textContent = announce ? `Showing ${models[id]}.` : '';
    selectTab(activeTab);
  };
  const revealAnchor = () => {
    if (location.hash === '#connection' || location.hash === '#panel-construction') selectTab('construction');
    if (location.hash === '#panel-electrical') selectTab('electrical');
    if (location.hash === '#panel-performance') selectTab('performance');
  };
  tablist.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.addEventListener('click', () => selectTab(tab.dataset.specTab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(tabs[next].dataset.specTab, true);
      }
    });
  });
  panels.forEach(panel => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${panel.dataset.specPanel}`);
    panel.tabIndex = 0;
  });
  selector.addEventListener('change', () => {
    const url = new URL(location.href);
    url.searchParams.set('variant', selector.value);
    history.pushState(null, '', url);
    selectVariant(selector.value, true);
  });
  const restore = () => {
    selectVariant(new URLSearchParams(location.search).get('variant') || 'tm1101-51');
    revealAnchor();
  };
  window.addEventListener('popstate', restore);
  window.addEventListener('hashchange', revealAnchor);
  restore();
  document.body.classList.add('product-enhanced');
  tablist.hidden = false;
  document.querySelector('.variant-picker').hidden = false;
})();
