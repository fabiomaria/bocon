/* Bocon Reusable SVG Wiring Diagram Dictionary
   Maps the 12 standard wiring presets from the authoritative Chinese PDFs to clean English SVGs.
   Usage: <div class="wiring-grid" data-wiring-presets="lead-2w,lead-3w"></div>
   Or embed individual SVGs directly in static/CMS templates. */
(() => {
  const WIRE_WHITE = '#475569';
  const WIRE_RED = '#DC2626';
  const STROKE_INK = '#12294A';
  const STROKE_MUTED = '#728DAA';

  function rtdSymbol(x, y, label = 'Pt') {
    return `
      <rect x="${x}" y="${y}" width="56" height="20" rx="2" fill="#FFFFFF" stroke="${STROKE_INK}" stroke-width="2"/>
      <line x1="${x + 12}" y1="${y + 26}" x2="${x + 44}" y2="${y - 6}" stroke="${STROKE_INK}" stroke-width="1.6"/>
      <line x1="${x + 6}" y1="${y + 26}" x2="${x + 12}" y2="${y + 26}" stroke="${STROKE_INK}" stroke-width="1.6"/>
      <text x="${x + 28}" y="${y + 38}" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11" font-weight="600" fill="${STROKE_INK}">${label}</text>
    `;
  }

  function terminalBlockBase(topRtdLabel = 'Pt', bottomRtdLabel = null) {
    return `
      <circle cx="130" cy="96" r="38" fill="#FFFFFF" stroke="${STROKE_INK}" stroke-width="2"/>
      <circle cx="130" cy="96" r="24" fill="none" stroke="${STROKE_MUTED}" stroke-width="1" stroke-dasharray="3 2"/>
      <circle cx="130" cy="68" r="3.5" fill="none" stroke="${STROKE_INK}" stroke-width="1.5"/>
      <circle cx="130" cy="124" r="3.5" fill="none" stroke="${STROKE_INK}" stroke-width="1.5"/>
      ${rtdSymbol(102, 14, topRtdLabel)}
      ${bottomRtdLabel ? rtdSymbol(102, 142, bottomRtdLabel) : ''}
    `;
  }

  const PRESETS = {
    'lead-2w': {
      title: 'Single element · 2-wire',
      svg: `<svg viewBox="0 0 260 150" role="img" aria-label="Single element 2-wire diagram: one white lead and one red lead connected to a platinum sensing element">
        <text x="48" y="26" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11" fill="${WIRE_WHITE}" font-weight="600">White lead</text>
        <text x="212" y="26" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11" fill="${WIRE_RED}" font-weight="600">Red lead</text>
        <path d="M48 36 V100 H102" fill="none" stroke="${WIRE_WHITE}" stroke-width="2.2"/>
        <path d="M212 36 V100 H158" fill="none" stroke="${WIRE_RED}" stroke-width="2.2"/>
        <circle cx="48" cy="36" r="3" fill="${WIRE_WHITE}"/>
        <circle cx="212" cy="36" r="3" fill="${WIRE_RED}"/>
        ${rtdSymbol(102, 90, 'Pt element')}
      </svg>`
    },
    'lead-3w': {
      title: 'Single element · 3-wire',
      svg: `<svg viewBox="0 0 260 150" role="img" aria-label="Single element 3-wire diagram: one white lead on left and two red leads on right connected to a platinum sensing element">
        <text x="48" y="26" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11" fill="${WIRE_WHITE}" font-weight="600">White lead</text>
        <text x="196" y="26" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11" fill="${WIRE_RED}" font-weight="600">2 × Red leads</text>
        <path d="M48 36 V100 H102" fill="none" stroke="${WIRE_WHITE}" stroke-width="2.2"/>
        <path d="M180 36 V100 H158" fill="none" stroke="${WIRE_RED}" stroke-width="2.2"/>
        <path d="M212 36 V100 H180" fill="none" stroke="${WIRE_RED}" stroke-width="2.2"/>
        <circle cx="48" cy="36" r="3" fill="${WIRE_WHITE}"/>
        <circle cx="180" cy="36" r="3" fill="${WIRE_RED}"/>
        <circle cx="212" cy="36" r="3" fill="${WIRE_RED}"/>
        <circle cx="180" cy="100" r="3" fill="${WIRE_RED}"/>
        ${rtdSymbol(102, 90, 'Pt element')}
      </svg>`
    },
    'lead-4w': {
      title: 'Single element · 4-wire',
      svg: `<svg viewBox="0 0 260 150" role="img" aria-label="Single element 4-wire diagram: two white leads on left and two red leads on right connected to a platinum sensing element">
        <text x="64" y="26" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11" fill="${WIRE_WHITE}" font-weight="600">2 × White leads</text>
        <text x="196" y="26" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11" fill="${WIRE_RED}" font-weight="600">2 × Red leads</text>
        <path d="M48 36 V100 H102" fill="none" stroke="${WIRE_WHITE}" stroke-width="2.2"/>
        <path d="M80 36 V100" fill="none" stroke="${WIRE_WHITE}" stroke-width="2.2"/>
        <path d="M180 36 V100 H158" fill="none" stroke="${WIRE_RED}" stroke-width="2.2"/>
        <path d="M212 36 V100 H180" fill="none" stroke="${WIRE_RED}" stroke-width="2.2"/>
        <circle cx="48" cy="36" r="3" fill="${WIRE_WHITE}"/>
        <circle cx="80" cy="36" r="3" fill="${WIRE_WHITE}"/>
        <circle cx="80" cy="100" r="3" fill="${WIRE_WHITE}"/>
        <circle cx="180" cy="36" r="3" fill="${WIRE_RED}"/>
        <circle cx="212" cy="36" r="3" fill="${WIRE_RED}"/>
        <circle cx="180" cy="100" r="3" fill="${WIRE_RED}"/>
        ${rtdSymbol(102, 90, 'Pt element')}
      </svg>`
    },
    'lead-dual-4w': {
      title: 'Dual element · 4-wire',
      svg: `<svg viewBox="0 0 260 175" role="img" aria-label="Dual element 4-wire diagram: two independent platinum sensing elements, each with one white and one red lead">
        <text x="54" y="22" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11" fill="${WIRE_WHITE}" font-weight="600">White leads</text>
        <text x="206" y="22" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11" fill="${WIRE_RED}" font-weight="600">Red leads</text>
        <path d="M44 30 V62 H102" fill="none" stroke="${WIRE_WHITE}" stroke-width="2.2"/>
        <path d="M216 30 V62 H158" fill="none" stroke="${WIRE_RED}" stroke-width="2.2"/>
        ${rtdSymbol(102, 52, 'Pt 1')}
        <path d="M68 30 V126 H102" fill="none" stroke="${WIRE_WHITE}" stroke-width="2.2"/>
        <path d="M192 30 V126 H158" fill="none" stroke="${WIRE_RED}" stroke-width="2.2"/>
        ${rtdSymbol(102, 116, 'Pt 2')}
      </svg>`
    },
    'lead-dual-6w': {
      title: 'Dual element · 6-wire',
      svg: `<svg viewBox="0 0 260 175" role="img" aria-label="Dual element 6-wire diagram: two independent platinum sensing elements in 3-wire configuration">
        <text x="54" y="22" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11" fill="${WIRE_WHITE}" font-weight="600">White (1+2)</text>
        <text x="206" y="22" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11" fill="${WIRE_RED}" font-weight="600">Red (2+1)</text>
        <path d="M44 30 V62 H102" fill="none" stroke="${WIRE_WHITE}" stroke-width="2.2"/>
        <path d="M192 30 V62 H158" fill="none" stroke="${WIRE_RED}" stroke-width="2.2"/>
        <path d="M216 30 V62 H192" fill="none" stroke="${WIRE_RED}" stroke-width="2.2"/>
        <circle cx="192" cy="62" r="2.8" fill="${WIRE_RED}"/>
        ${rtdSymbol(102, 52, 'Pt 1')}
        <path d="M58 30 V126 H102" fill="none" stroke="${WIRE_WHITE}" stroke-width="2.2"/>
        <path d="M76 30 V126 H58" fill="none" stroke="${WIRE_WHITE}" stroke-width="2.2"/>
        <circle cx="76" cy="126" r="2.8" fill="${WIRE_WHITE}"/>
        <path d="M176 30 V126 H158" fill="none" stroke="${WIRE_RED}" stroke-width="2.2"/>
        ${rtdSymbol(102, 116, 'Pt 2')}
      </svg>`
    },
    'head-2w': {
      title: 'Terminal block · Single 2-wire',
      svg: `<svg viewBox="0 0 260 165" role="img" aria-label="Terminal block single 2-wire diagram">
        ${terminalBlockBase('Pt')}
        <path d="M102 24 H84 V86 H104" fill="none" stroke="${STROKE_INK}" stroke-width="2"/>
        <path d="M158 24 H176 V86 H156" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <circle cx="104" cy="86" r="5" fill="${STROKE_INK}"/>
        <circle cx="156" cy="86" r="5" fill="${WIRE_RED}"/>
      </svg>`
    },
    'head-3w': {
      title: 'Terminal block · Single 3-wire',
      svg: `<svg viewBox="0 0 260 165" role="img" aria-label="Terminal block single 3-wire diagram">
        ${terminalBlockBase('Pt')}
        <path d="M102 24 H84 V86 H104" fill="none" stroke="${STROKE_INK}" stroke-width="2"/>
        <path d="M158 24 H176 V80 H156" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <path d="M176 80 V108 H152" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <circle cx="104" cy="86" r="5" fill="${STROKE_INK}"/>
        <circle cx="156" cy="80" r="5" fill="${WIRE_RED}"/>
        <circle cx="152" cy="108" r="5" fill="${WIRE_RED}"/>
      </svg>`
    },
    'head-4w': {
      title: 'Terminal block · Single 4-wire',
      svg: `<svg viewBox="0 0 260 165" role="img" aria-label="Terminal block single 4-wire diagram">
        ${terminalBlockBase('Pt')}
        <path d="M102 24 H84 V80 H104" fill="none" stroke="${STROKE_INK}" stroke-width="2"/>
        <path d="M84 80 V108 H108" fill="none" stroke="${STROKE_INK}" stroke-width="2"/>
        <path d="M158 24 H176 V80 H156" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <path d="M176 80 V108 H152" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <circle cx="104" cy="80" r="5" fill="${STROKE_INK}"/>
        <circle cx="108" cy="108" r="5" fill="${STROKE_INK}"/>
        <circle cx="156" cy="80" r="5" fill="${WIRE_RED}"/>
        <circle cx="152" cy="108" r="5" fill="${WIRE_RED}"/>
      </svg>`
    },
    'head-dual-4w': {
      title: 'Terminal block · Dual 4-wire',
      svg: `<svg viewBox="0 0 260 190" role="img" aria-label="Terminal block dual 4-wire diagram">
        ${terminalBlockBase('Pt 1', 'Pt 2')}
        <path d="M102 24 H84 V80 H104" fill="none" stroke="${STROKE_INK}" stroke-width="2"/>
        <path d="M158 24 H176 V80 H156" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <path d="M102 152 H84 V110 H108" fill="none" stroke="${STROKE_INK}" stroke-width="2"/>
        <path d="M158 152 H176 V110 H152" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <circle cx="104" cy="80" r="5" fill="${STROKE_INK}"/>
        <circle cx="156" cy="80" r="5" fill="${WIRE_RED}"/>
        <circle cx="108" cy="110" r="5" fill="${STROKE_INK}"/>
        <circle cx="152" cy="110" r="5" fill="${WIRE_RED}"/>
      </svg>`
    },
    'head-dual-6w': {
      title: 'Terminal block · Dual 6-wire',
      svg: `<svg viewBox="0 0 260 190" role="img" aria-label="Terminal block dual 6-wire diagram">
        ${terminalBlockBase('Pt 1', 'Pt 2')}
        <path d="M102 24 H84 V78 H104" fill="none" stroke="${STROKE_INK}" stroke-width="2"/>
        <path d="M158 24 H176 V78 H156" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <path d="M176 78 V96 H160" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <path d="M102 152 H84 V114 H104" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <path d="M84 114 V96 H100" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <path d="M158 152 H176 V114 H156" fill="none" stroke="${STROKE_INK}" stroke-width="2"/>
        <circle cx="104" cy="78" r="4.5" fill="${STROKE_INK}"/>
        <circle cx="156" cy="78" r="4.5" fill="${WIRE_RED}"/>
        <circle cx="160" cy="96" r="4.5" fill="${WIRE_RED}"/>
        <circle cx="100" cy="96" r="4.5" fill="${WIRE_RED}"/>
        <circle cx="104" cy="114" r="4.5" fill="${WIRE_RED}"/>
        <circle cx="156" cy="114" r="4.5" fill="${STROKE_INK}"/>
      </svg>`
    },
    'tx-2w': {
      title: '4–20 mA Transmitter (2-wire RTD input)',
      svg: `<svg viewBox="0 0 260 155" role="img" aria-label="2-wire RTD connected to an integrated 4 to 20 mA temperature transmitter">
        ${rtdSymbol(102, 20, 'Pt')}
        <path d="M102 30 H76 V84" fill="none" stroke="${STROKE_INK}" stroke-width="2"/>
        <path d="M158 30 H184 V84" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <rect x="56" y="84" width="148" height="32" rx="6" fill="#EAF1FB" stroke="${STROKE_INK}" stroke-width="1.8"/>
        <text x="130" y="104" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11.5" font-weight="700" fill="${STROKE_INK}">Temp. Transmitter</text>
        <path d="M88 116 V138 H106" fill="none" stroke="${STROKE_MUTED}" stroke-width="1.8"/>
        <path d="M172 116 V138 H154" fill="none" stroke="${STROKE_MUTED}" stroke-width="1.8"/>
        <text x="130" y="142" text-anchor="middle" font-family="SF Mono,Menlo,monospace" font-size="11" font-weight="600" fill="${STROKE_INK}">4–20 mA</text>
      </svg>`
    },
    'tx-3w': {
      title: '4–20 mA Transmitter (3-wire RTD input)',
      svg: `<svg viewBox="0 0 260 155" role="img" aria-label="3-wire RTD connected to an integrated 4 to 20 mA temperature transmitter">
        ${rtdSymbol(102, 20, 'Pt')}
        <path d="M102 30 H76 V84" fill="none" stroke="${STROKE_INK}" stroke-width="2"/>
        <path d="M158 30 H164 V84" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <path d="M164 30 H188 V84" fill="none" stroke="${WIRE_RED}" stroke-width="2"/>
        <circle cx="164" cy="30" r="2.8" fill="${WIRE_RED}"/>
        <rect x="56" y="84" width="148" height="32" rx="6" fill="#EAF1FB" stroke="${STROKE_INK}" stroke-width="1.8"/>
        <text x="130" y="104" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="11.5" font-weight="700" fill="${STROKE_INK}">Temp. Transmitter</text>
        <path d="M88 116 V138 H106" fill="none" stroke="${STROKE_MUTED}" stroke-width="1.8"/>
        <path d="M172 116 V138 H154" fill="none" stroke="${STROKE_MUTED}" stroke-width="1.8"/>
        <text x="130" y="142" text-anchor="middle" font-family="SF Mono,Menlo,monospace" font-size="11" font-weight="600" fill="${STROKE_INK}">4–20 mA</text>
      </svg>`
    }
  };

  document.querySelectorAll('[data-wiring-presets]').forEach(container => {
    const keys = container.dataset.wiringPresets.split(',').map(s => s.trim()).filter(Boolean);
    if (!keys.length) return;
    container.innerHTML = keys
      .filter(k => PRESETS[k])
      .map(k => `<figure class="wiring-figure">${PRESETS[k].svg}<figcaption>${PRESETS[k].title}</figcaption></figure>`)
      .join('');
  });
})();
