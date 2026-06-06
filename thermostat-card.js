// @ts-check
// =====================================================================
//  Thermostat Card v1.0.0
// =====================================================================

const _TC_MODE_LABELS = {
  off:       'Aus',
  heat:      'Heizen',
  cool:      'Kühlen',
  auto:      'Auto',
  heat_cool: 'Heizen/Kühlen',
  fan_only:  'Lüften',
  dry:       'Entfeuchten',
};

const _TC_MODE_ICONS = {
  off:       'mdi:power',
  heat:      'mdi:fire',
  cool:      'mdi:snowflake',
  auto:      'mdi:thermostat-auto',
  heat_cool: 'mdi:thermometer',
  fan_only:  'mdi:fan',
  dry:       'mdi:water-percent',
};

const _TC_MODE_COLORS = {
  heat:      '#FF6B35',
  cool:      '#42A5F5',
  auto:      '#AB47BC',
  heat_cool: '#FF9800',
  fan_only:  '#26C6DA',
  dry:       '#66BB6A',
};

function _tcModeLabel(m) { return _TC_MODE_LABELS[m] || m || '–'; }
function _tcModeIcon(m)  { return _TC_MODE_ICONS[m]  || 'mdi:thermometer'; }

// =====================================================================
//  Haupt-Card
// =====================================================================
class ThermostatCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config  = {};
    this._lastKey = null;
  }

  /** @param {LovelaceCardConfig} config */
  setConfig(config) {
    if (!config) throw new Error('Keine Konfiguration');
    this._config = { name: '', border_radius: 16, ...config };
    delete this._lastKey;
  }

  /** @param {HomeAssistant} hass */
  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() { return 4; }
  static getConfigElement() { return document.createElement('thermostat-card-editor'); }
  static getStubConfig() { return { entity: '' }; }

  _setMode(mode) {
    this._hass.callService('climate', 'set_hvac_mode', {
      entity_id: this._config.entity,
      hvac_mode: mode,
    });
  }

  _setTemp(temp) {
    this._hass.callService('climate', 'set_temperature', {
      entity_id: this._config.entity,
      temperature: temp,
    });
  }

  _callScript() {
    if (!this._config.script_entity) return;
    this._hass.callService('script', 'turn_on', {
      entity_id: this._config.script_entity,
    });
  }

  _render() {
    if (!this._hass) return;
    const cfg = this._config;
    const st  = cfg.entity ? this._hass.states[cfg.entity] : null;
    const br  = cfg.border_radius ?? 16;

    if (!st || st.state === 'unavailable') {
      const msg = !cfg.entity ? 'Keine Entität konfiguriert' :
        st?.state === 'unavailable' ? 'Entität nicht verfügbar' :
        'Entität nicht gefunden: ' + cfg.entity;
      this.shadowRoot.innerHTML = `
        <style>:host{display:block}</style>
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:${br}px;padding:18px;">
          <div style="color:rgba(255,255,255,0.45);font-size:13px;">${msg}</div>
        </div>`;
      return;
    }

    const currentTemp = /** @type {number|null} */ (st.attributes.current_temperature ?? null);
    const targetTemp  = /** @type {number|null} */ (st.attributes.temperature ?? null);
    const minTemp     = parseFloat(String(st.attributes.min_temp ?? 5));
    const maxTemp     = parseFloat(String(st.attributes.max_temp ?? 35));
    const step        = parseFloat(String(st.attributes.target_temp_step ?? 0.5));
    const hvacMode    = st.state;
    const hvacAction  = /** @type {string} */ (st.attributes.hvac_action || '');
    const hvacModes   = /** @type {string[]} */ (st.attributes.hvac_modes || ['off', 'heat']);
    const name        = cfg.name || st.attributes.friendly_name || 'Thermostat';

    const isHeating = hvacAction === 'heating';
    const isCooling = hvacAction === 'cooling';
    const isActive  = hvacMode !== 'off' && hvacMode !== 'unavailable';

    let accentColor;
    if (isHeating)       accentColor = '#FF6B35';
    else if (isCooling)  accentColor = '#42A5F5';
    else if (isActive)   accentColor = _TC_MODE_COLORS[hvacMode] || 'rgba(255,255,255,0.5)';
    else                 accentColor = 'rgba(255,255,255,0.25)';

    const scriptSt     = cfg.script_entity ? this._hass.states[cfg.script_entity] : null;
    const scriptName   = cfg.script_name   || scriptSt?.attributes?.friendly_name || 'Heizen ↔ Kühlen';
    const scriptRunning = scriptSt?.state === 'on';

    const key = [hvacMode, hvacAction, currentTemp, targetTemp,
      scriptSt?.state, JSON.stringify(cfg)].join('|');
    if (key === this._lastKey) return;

    // Slider-Fokus-Schutz: kein Re-render während der Nutzer zieht
    const root = this.shadowRoot;
    const active = root.activeElement;
    const existingSlider = /** @type {HTMLInputElement|null} */ (root.getElementById('tempSlider'));
    if (existingSlider && active === existingSlider) return;

    this._lastKey = key;

    const safeTarget = targetTemp ?? minTemp;
    const tempPct = ((safeTarget - minTemp) / (maxTemp - minTemp) * 100).toFixed(1);

    root.innerHTML = `
      <style>
        :host { display:block; box-sizing:border-box; }
        .card {
          background:rgba(255,255,255,0.06);
          border:1px solid ${isActive ? accentColor + '44' : 'rgba(255,255,255,0.12)'};
          border-radius:${br}px;
          padding:18px;
          box-sizing:border-box;
          user-select:none;
          -webkit-tap-highlight-color:transparent;
          box-shadow:${isActive ? `0 0 18px 0 ${accentColor}18` : 'none'};
        }
        .header {
          display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;
        }
        .name { font-size:15px; font-weight:600; color:rgba(255,255,255,0.9); }
        .action-badge {
          display:flex; align-items:center; gap:5px;
          font-size:11px; font-weight:700;
          color:${accentColor};
          background:${accentColor}18;
          border:1px solid ${accentColor}33;
          border-radius:8px; padding:3px 10px;
          flex-shrink:0;
        }
        .action-badge ha-icon { --mdc-icon-size:14px; }
        .temps {
          display:flex; align-items:center; justify-content:space-around;
          margin-bottom:16px; padding:14px;
          background:rgba(255,255,255,0.04);
          border-radius:12px;
          border:1px solid rgba(255,255,255,0.07);
        }
        .temp-block { display:flex; flex-direction:column; align-items:center; gap:4px; }
        .temp-label { font-size:11px; color:rgba(255,255,255,0.4); font-weight:500; text-transform:uppercase; letter-spacing:0.5px; }
        .temp-value { font-size:36px; font-weight:700; font-variant-numeric:tabular-nums; line-height:1; }
        .temp-value.current { color:rgba(255,255,255,0.85); }
        .temp-value.target  { color:${accentColor}; }
        .temp-unit { font-size:18px; }
        .sep { width:1px; height:52px; background:rgba(255,255,255,0.1); }
        .modes { display:flex; gap:7px; margin-bottom:16px; flex-wrap:wrap; }
        .mode-btn {
          flex:1; min-width:0;
          display:flex; align-items:center; justify-content:center; gap:5px;
          padding:9px 6px; border-radius:10px;
          border:1px solid rgba(255,255,255,0.12);
          background:rgba(255,255,255,0.04);
          cursor:pointer;
          font-size:11px; font-weight:500; color:rgba(255,255,255,0.55);
          white-space:nowrap; overflow:hidden;
          transition:all 0.15s;
        }
        .mode-btn ha-icon { --mdc-icon-size:15px; flex-shrink:0; }
        .mode-btn.active {
          background:${accentColor}22;
          border-color:${accentColor}66;
          color:${accentColor};
          font-weight:700;
        }
        .mode-btn:active { opacity:0.7; }
        .slider-header {
          display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;
        }
        .slider-title { font-size:12px; color:rgba(255,255,255,0.45); font-weight:500; }
        .slider-val { font-size:14px; font-weight:700; color:${accentColor}; font-variant-numeric:tabular-nums; }
        input[type=range] {
          width:100%; height:6px; -webkit-appearance:none; appearance:none;
          border-radius:3px; outline:none; cursor:pointer;
          background:linear-gradient(to right,${accentColor} ${tempPct}%,rgba(255,255,255,0.15) ${tempPct}%);
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance:none; width:18px; height:18px; border-radius:50%;
          background:${accentColor}; cursor:pointer; box-shadow:0 1px 5px rgba(0,0,0,0.4);
        }
        input[type=range]::-moz-range-thumb {
          width:18px; height:18px; border-radius:50%; border:none;
          background:${accentColor}; cursor:pointer; box-shadow:0 1px 5px rgba(0,0,0,0.4);
        }
        input[type=range]:disabled { opacity:0.35; cursor:default; }
        input[type=range]:disabled::-webkit-slider-thumb { cursor:default; }
        .range-labels {
          display:flex; justify-content:space-between; margin-top:5px;
          font-size:10px; color:rgba(255,255,255,0.3);
        }
        .script-btn {
          margin-top:14px; width:100%; padding:10px 16px; border-radius:10px;
          border:1px solid ${accentColor}44;
          background:${accentColor}12;
          cursor:pointer; color:${accentColor};
          font-size:13px; font-weight:500;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:all 0.15s; box-sizing:border-box;
        }
        .script-btn ha-icon { --mdc-icon-size:18px; flex-shrink:0; }
        .script-btn.running { opacity:0.55; cursor:wait; }
        .script-btn:not(.running):active { opacity:0.7; }
      </style>
      <div class="card">

        <div class="header">
          <span class="name">${name}</span>
          ${(isHeating || isCooling) ? `
            <div class="action-badge">
              <ha-icon icon="${isHeating ? 'mdi:fire' : 'mdi:snowflake'}"></ha-icon>
              ${isHeating ? 'Heizt' : 'Kühlt'}
            </div>` : ''}
        </div>

        <div class="temps">
          <div class="temp-block">
            <span class="temp-label">Ist</span>
            <span class="temp-value current">
              ${currentTemp != null ? currentTemp.toFixed(1) : '–'}<span class="temp-unit">°</span>
            </span>
          </div>
          <div class="sep"></div>
          <div class="temp-block">
            <span class="temp-label">Soll</span>
            <span class="temp-value target" id="targetTempDisp">
              ${targetTemp != null ? targetTemp.toFixed(1) : '–'}<span class="temp-unit">°</span>
            </span>
          </div>
        </div>

        <div class="modes">
          ${hvacModes.map(m => `
            <button class="mode-btn${m === hvacMode ? ' active' : ''}" data-mode="${m}">
              <ha-icon icon="${_tcModeIcon(m)}"></ha-icon>
              ${_tcModeLabel(m)}
            </button>
          `).join('')}
        </div>

        <div class="slider-header">
          <span class="slider-title">Solltemperatur</span>
          <span class="slider-val" id="sliderVal">${targetTemp != null ? targetTemp.toFixed(1) + ' °C' : '–'}</span>
        </div>
        <input type="range" id="tempSlider"
          min="${minTemp}" max="${maxTemp}" step="${step}"
          value="${safeTarget}"
          ${hvacMode === 'off' ? 'disabled' : ''}
        />
        <div class="range-labels">
          <span>${minTemp} °C</span>
          <span>${maxTemp} °C</span>
        </div>

        ${cfg.script_entity ? `
          <button class="script-btn${scriptRunning ? ' running' : ''}" id="scriptBtn">
            <ha-icon icon="mdi:swap-horizontal"></ha-icon>
            ${scriptName}
          </button>` : ''}

      </div>
    `;

    root.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this._setMode(/** @type {HTMLElement} */ (btn).dataset.mode));
    });

    const slider  = /** @type {HTMLInputElement|null} */ (root.getElementById('tempSlider'));
    const valDisp = root.getElementById('sliderVal');
    const tgtDisp = root.getElementById('targetTempDisp');
    if (slider) {
      slider.addEventListener('input', () => {
        const v   = parseFloat(slider.value);
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const pct = ((v - min) / (max - min) * 100).toFixed(1);
        slider.style.background = `linear-gradient(to right,${accentColor} ${pct}%,rgba(255,255,255,0.15) ${pct}%)`;
        if (valDisp) valDisp.textContent = v.toFixed(1) + ' °C';
        if (tgtDisp) tgtDisp.innerHTML   = v.toFixed(1) + '<span class="temp-unit">°</span>';
      });
      slider.addEventListener('change', () => {
        this._setTemp(parseFloat(slider.value));
      });
    }

    const scriptBtn = root.getElementById('scriptBtn');
    if (scriptBtn) {
      scriptBtn.addEventListener('click', () => {
        if (!scriptRunning) this._callScript();
      });
    }
  }
}

customElements.define('thermostat-card', ThermostatCard);

// =====================================================================
//  Visueller Editor
// =====================================================================
class ThermostatCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config   = {};
    this._hass     = null;
    this._rendered = false;
  }

  /** @param {LovelaceCardConfig} config */
  setConfig(config) {
    this._config = { ...config };
    if (this._rendered) {
      this._syncFields();
    } else {
      this._render();
    }
  }

  /** @param {HomeAssistant} hass */
  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      this._render();
    } else {
      this.shadowRoot.querySelectorAll('ha-entity-picker').forEach(p => {
        /** @type {HaEntityPicker} */ (p).hass = hass;
      });
    }
  }

  _emit() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: { ...this._config } },
      bubbles: true,
      composed: true,
    }));
  }

  _syncFields() {
    const root   = this.shadowRoot;
    const c      = this._config;
    const active = root.activeElement;

    const ep = /** @type {HaEntityPicker|null} */ (root.getElementById('entity_picker'));
    if (ep) ep.value = c.entity || '';

    const sp = /** @type {HaEntityPicker|null} */ (root.getElementById('script_picker'));
    if (sp) sp.value = c.script_entity || '';

    const nameEl = /** @type {HTMLInputElement|null} */ (root.getElementById('name'));
    if (nameEl && active !== nameEl) nameEl.value = c.name || '';

    const snEl = /** @type {HTMLInputElement|null} */ (root.getElementById('script_name'));
    if (snEl && active !== snEl) snEl.value = c.script_name || '';

    const brEl = /** @type {HTMLInputElement|null} */ (root.getElementById('border_radius'));
    if (brEl && active !== brEl) brEl.value = String(c.border_radius ?? 16);
  }

  _render() {
    this._rendered = true;
    const c    = this._config;
    const root = this.shadowRoot;

    root.innerHTML = `
      <style>
        .editor { display:flex; flex-direction:column; gap:14px; padding:8px 0; }
        .section {
          font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px;
          color:var(--secondary-text-color,#727272); margin-top:6px;
          border-bottom:1px solid var(--divider-color,#e0e0e0); padding-bottom:4px;
        }
        .field { display:flex; flex-direction:column; gap:5px; }
        label { font-size:13px; font-weight:500; color:var(--primary-text-color,#212121); }
        input[type=text], input[type=number] {
          padding:9px 11px; border-radius:8px; border:1px solid var(--divider-color,#e0e0e0);
          background:var(--card-background-color,#fff); color:var(--primary-text-color,#212121);
          font-size:13px; outline:none; box-sizing:border-box; width:100%; font-family:inherit;
        }
        input:focus { border-color:var(--primary-color,#03a9f4); }
        .hint { font-size:11px; color:var(--secondary-text-color,#727272); line-height:1.5; }
      </style>
      <div class="editor">

        <div class="section">Thermostat</div>
        <div class="field">
          <label>Name (optional)</label>
          <input type="text" id="name" value="${c.name || ''}" placeholder="Thermostat" />
        </div>
        <div class="field" id="entityPickerWrap">
          <label>Klimaentität</label>
        </div>

        <div class="section">Heizen / Kühlen Script</div>
        <div class="hint">Optionales Script zum Umschalten zwischen Heizen und Kühlen (z. B. Wärmepumpe umstellen).</div>
        <div class="field" id="scriptPickerWrap">
          <label>Script-Entität (optional)</label>
        </div>
        <div class="field">
          <label>Script-Bezeichnung (optional)</label>
          <input type="text" id="script_name" value="${c.script_name || ''}" placeholder="Heizen ↔ Kühlen" />
        </div>

        <div class="section">Darstellung</div>
        <div class="field">
          <label>Eckenradius (px)</label>
          <input type="number" id="border_radius" value="${c.border_radius ?? 16}" min="0" max="40" />
        </div>

      </div>
    `;

    // Climate entity picker
    const entityPickerWrap = root.getElementById('entityPickerWrap');
    const entityPicker = /** @type {HaEntityPicker} */ (document.createElement('ha-entity-picker'));
    entityPicker.id    = 'entity_picker';
    entityPicker.hass  = this._hass;
    entityPicker.value = c.entity || '';
    entityPicker.setAttribute('label', 'Klimaentität');
    entityPicker.includeDomains = ['climate'];
    entityPicker.style.cssText = 'display:block;width:100%;';
    entityPicker.addEventListener('value-changed', e => {
      this._config = { ...this._config, entity: /** @type {CustomEvent} */ (e).detail.value };
      this._emit();
    });
    entityPickerWrap.appendChild(entityPicker);

    // Script entity picker
    const scriptPickerWrap = root.getElementById('scriptPickerWrap');
    const scriptPicker = /** @type {HaEntityPicker} */ (document.createElement('ha-entity-picker'));
    scriptPicker.id    = 'script_picker';
    scriptPicker.hass  = this._hass;
    scriptPicker.value = c.script_entity || '';
    scriptPicker.setAttribute('label', 'Script-Entität');
    scriptPicker.includeDomains = ['script'];
    scriptPicker.style.cssText = 'display:block;width:100%;';
    scriptPicker.addEventListener('value-changed', e => {
      const val = /** @type {CustomEvent} */ (e).detail.value;
      const cfg = { ...this._config };
      if (val) cfg.script_entity = val;
      else     delete cfg.script_entity;
      this._config = cfg;
      this._emit();
    });
    scriptPickerWrap.appendChild(scriptPicker);

    root.getElementById('name').addEventListener('change', e => {
      this._config = { ...this._config, name: /** @type {HTMLInputElement} */ (e.target).value };
      this._emit();
    });
    root.getElementById('script_name').addEventListener('change', e => {
      const val = /** @type {HTMLInputElement} */ (e.target).value.trim();
      const cfg = { ...this._config };
      if (val) cfg.script_name = val;
      else     delete cfg.script_name;
      this._config = cfg;
      this._emit();
    });
    root.getElementById('border_radius').addEventListener('change', e => {
      this._config = { ...this._config, border_radius: parseInt(/** @type {HTMLInputElement} */ (e.target).value) };
      this._emit();
    });
  }
}

customElements.define('thermostat-card-editor', ThermostatCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type:        'thermostat-card',
  name:        'Thermostat Card',
  description: 'Thermostat-Widget mit Ist/Soll-Temperatur, Modus-Buttons, Temperatur-Slider und optionalem Heizen/Kühlen-Script',
  preview:     true,
});
