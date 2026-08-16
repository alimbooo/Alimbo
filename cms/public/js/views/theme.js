import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { generateThemeColors } from '../utils/colors.js';

export async function saveTheme(skipMsg = false) {
  state.site.theme = state.site.theme || {};
  state.site.theme.mode = 'system';
  state.site.theme.schemeMode = window.themeSchemeTab || 'manual';

  if (window.themeSchemeTab === 'auto') {
      const gen = generateThemeColors(state.site.theme.baseColor || '#b8f542');
      state.site.theme.dark = gen.dark;
      state.site.theme.light = gen.light;
      state.site.theme.isCustom = false;
  } else if (window.themeSchemeTab === 'default') {
      state.site.theme.baseColor = '#b8f542';
      state.site.theme.dark = { primary: '#b8f542', secondary: '#8adcf0', background: '#0b111b', foreground: '#f5f7fa', muted: '#9ba6b5', border: '#263243', card: '#131b2a' };
      state.site.theme.light = { primary: '#8ec421', secondary: '#18a1c3', background: '#fafbf9', foreground: '#292e1f', muted: '#6d7a52', border: '#dbe0d1', card: '#f3f5f0' };
      state.site.theme.isCustom = false;
  } else {
      state.site.theme.isCustom = true;
      syncCustomColors();
  }

  await api('/api/site', { method: 'POST', body: JSON.stringify(state.site), headers: { 'Content-Type': 'application/json' } });
  if (typeof window.applyTheme === 'function') window.applyTheme();

  if (!skipMsg) {
    const btn = document.querySelector('button[onclick="saveTheme()"]');
    if (btn) {
      const origText = btn.innerHTML;
      btn.innerHTML = 'ذخیره شد ✓';
      btn.classList.add('ok');
      setTimeout(() => { btn.innerHTML = origText; btn.classList.remove('ok'); }, 2000);
    }
  }
}

export function renderTheme() {
  const t = state.site.theme || { baseColor: '#b8f542', isCustom: false, mode: 'system' };

  if (!window.themeSchemeTab) {
    if (t.schemeMode) {
      window.themeSchemeTab = t.schemeMode;
    } else if (t.isCustom) {
      window.themeSchemeTab = 'manual';
    } else {
      window.themeSchemeTab = 'auto';
    }
  }

  const isManual = window.themeSchemeTab === 'manual';
  const isAuto = window.themeSchemeTab === 'auto';
  const isDefault = window.themeSchemeTab === 'default';

  let d = {}, l = {}, displayBaseColor = t.baseColor || '#b8f542';

  if (isManual) {
    d = t.dark || {};
    l = t.light || {};
  } else if (isAuto) {
    const gen = generateThemeColors(t.baseColor || '#b8f542');
    d = gen.dark || {};
    l = gen.light || {};
  } else if (isDefault) {
    d = { primary: '#b8f542', secondary: '#8adcf0', background: '#0b111b', foreground: '#f5f7fa', muted: '#9ba6b5', border: '#263243', card: '#131b2a' };
    l = { primary: '#8ec421', secondary: '#18a1c3', background: '#fafbf9', foreground: '#292e1f', muted: '#6d7a52', border: '#dbe0d1', card: '#f3f5f0' };
    displayBaseColor = '#b8f542';
  }

  const dBg    = d.background || '#0b111b';
  const dCard  = d.card       || '#131b2a';
  const dBdr   = d.border     || '#263243';
  const dFg    = d.foreground || '#f5f7fa';
  const dMuted = d.muted      || '#9ba6b5';

  const lBg    = l.background || '#fafbf9';
  const lCard  = l.card       || '#f3f5f0';
  const lBdr   = l.border     || '#dbe0d1';
  const lFg    = l.foreground || '#292e1f';
  const lMuted = l.muted      || '#6d7a52';

  const dInput = `flex:1; padding:4px 8px; font-family:monospace; direction:ltr; background:${dCard}; color:${dFg}; border:1px solid ${dBdr}`;
  const lInput = `flex:1; padding:4px 8px; font-family:monospace; direction:ltr; background:${lCard}; color:${lFg}; border:1px solid ${lBdr}`;

  const colorRow = (mode, key, id, label, defaultVal) => {
    const val   = mode === 'd' ? (d[key] || defaultVal) : (l[key] || defaultVal);
    const style = mode === 'd' ? dInput : lInput;
    const muted = mode === 'd' ? dMuted : lMuted;

    if (isManual) {
      return `
        <div style="margin-bottom:12px">
          <label style="margin:0 0 4px 0; color:${muted}">${label}</label>
          <div style="display:flex; gap:8px; align-items:center">
            <input type="text"  id="t-${id}-text"  value="${val}" onchange="document.getElementById('t-${id}').value=this.value; syncCustomColors()" style="${style}">
            <input type="color" id="t-${id}" value="${val}" onchange="document.getElementById('t-${id}-text').value=this.value; syncCustomColors()" style="width:40px; height:32px; padding:0; border:none; border-radius:4px">
          </div>
        </div>`;
    } else {
      return `
        <div style="margin-bottom:12px">
          <label style="margin:0 0 4px 0; color:${muted}">${label}</label>
          <div style="display:flex; gap:8px; align-items:center">
            <input type="text" readonly value="${val}" style="${style}; opacity:0.7">
            <div style="width:40px; height:32px; border-radius:4px; background:${val}; border:1px solid rgba(128,128,128,0.3)"></div>
          </div>
        </div>`;
    }
  };

  dom.content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
      <div>
        <h2 style="margin-bottom:4px">رنگ‌بندی</h2>
        <p class="sub" style="margin-bottom:0">طرح رنگ سایت خود را مدیریت کنید.</p>
      </div>
    </div>

      <div class="card" style="padding:24px; width:850px;">
        <div style="margin-bottom:24px">
          <select id="theme-mode-select" onchange="onThemeModeSelect(this.value)" style="max-width:250px; font-weight:bold;">
            <option value="manual" ${isManual ? 'selected' : ''}>رنگ‌بندی دستی</option>
            <option value="auto" ${isAuto ? 'selected' : ''}>رنگ‌بندی خودکار</option>
            <option value="default" ${isDefault ? 'selected' : ''}>رنگ‌بندی پیشفرض</option>
          </select>
        </div>

        ${isAuto ? `
        <div style="margin-bottom:24px;">
          <label style="margin-top:0">رنگ پایه (Base Color)</label>
          <div style="display:flex; gap:8px; align-items:center">
            <input type="text" value="${displayBaseColor}" onchange="onAutoBaseColorChange(this.value)" style="width:100px; padding:4px 8px; font-family:monospace; direction:ltr">
            <input type="color" value="${displayBaseColor}" onchange="onAutoBaseColorChange(this.value)" style="width:40px; height:40px; padding:0; border:none; border-radius:4px">
          </div>
        </div>
        ` : ''}

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
          <!-- Dark Mode panel -->
          <div style="background:${dBg}; padding:16px; border-radius:12px; border:1px solid ${dBdr}">
            <h3 style="margin-bottom:16px; color:${dFg}">رنگ‌های حالت تاریک (Dark)</h3>
            ${colorRow('d', 'primary',    'dark-primary',    'رنگ اصلی (Primary)',       d.primary    || '#b8f542')}
            ${colorRow('d', 'secondary',  'dark-secondary',  'رنگ ثانویه (Secondary)',   d.secondary  || '#000000')}
            ${colorRow('d', 'background', 'dark-bg',         'پس‌زمینه (Background)',    d.background || '#000000')}
            ${colorRow('d', 'foreground', 'dark-fg',         'متن (Foreground)',          d.foreground || '#ffffff')}
            ${colorRow('d', 'muted',      'dark-muted',      'متن کمرنگ (Muted)',        d.muted      || '#000000')}
            ${colorRow('d', 'border',     'dark-border',     'خطوط (Border)',             d.border     || '#000000')}
            ${colorRow('d', 'card',       'dark-card',       'کارت (Card)',               d.card       || '#000000')}
          </div>

          <!-- Light Mode panel -->
          <div style="background:${lBg}; padding:16px; border-radius:12px; border:1px solid ${lBdr}">
            <h3 style="margin-bottom:16px; color:${lFg}">رنگ‌های حالت روشن (Light)</h3>
            ${colorRow('l', 'primary',    'light-primary',    'رنگ اصلی (Primary)',       l.primary    || '#000000')}
            ${colorRow('l', 'secondary',  'light-secondary',  'رنگ ثانویه (Secondary)',   l.secondary  || '#000000')}
            ${colorRow('l', 'background', 'light-bg',         'پس‌زمینه (Background)',    l.background || '#ffffff')}
            ${colorRow('l', 'foreground', 'light-fg',         'متن (Foreground)',          l.foreground || '#000000')}
            ${colorRow('l', 'muted',      'light-muted',      'متن کمرنگ (Muted)',        l.muted      || '#000000')}
            ${colorRow('l', 'border',     'light-border',     'خطوط (Border)',             l.border     || '#000000')}
            ${colorRow('l', 'card',       'light-card',       'کارت (Card)',               l.card       || '#ffffff')}
          </div>
        </div>

        ${(isAuto || isDefault) ? `
        <div style="margin-top:24px">
          <button class="btn sec" onclick="copyToManualAndSwitch()">استفاده از این رنگ‌ها به‌صورت دستی</button>
        </div>
        ` : ''}

      </div>
    <button class="btn" onclick="saveTheme()" style="justify-content:center">ذخیره</button>
    `;
}

export function onThemeModeSelect(mode) {
    window.themeSchemeTab = mode;
    state.site.theme = state.site.theme || {};
    if (mode === 'manual') {
        state.site.theme.isCustom = true;
    } else {
        state.site.theme.isCustom = false;
        if (mode === 'default') {
            state.site.theme.baseColor = '#b8f542';
        }
    }
    renderTheme();
}

export function onAutoBaseColorChange(val) {
    state.site.theme = state.site.theme || {};
    state.site.theme.baseColor = val;
    renderTheme();
}

export function copyToManualAndSwitch() {
    const isAuto = window.themeSchemeTab === 'auto';
    const isDefault = window.themeSchemeTab === 'default';
    let d, l;

    if (isAuto) {
        const gen = generateThemeColors(state.site.theme.baseColor || '#b8f542');
        d = gen.dark;
        l = gen.light;
    } else if (isDefault) {
        d = { primary: '#b8f542', secondary: '#8adcf0', background: '#0b111b', foreground: '#f5f7fa', muted: '#9ba6b5', border: '#263243', card: '#131b2a' };
        l = { primary: '#8ec421', secondary: '#18a1c3', background: '#fafbf9', foreground: '#292e1f', muted: '#6d7a52', border: '#dbe0d1', card: '#f3f5f0' };
    }

    state.site.theme = state.site.theme || {};
    state.site.theme.isCustom = true;
    if (isDefault) state.site.theme.baseColor = '#b8f542';
    state.site.theme.dark = d;
    state.site.theme.light = l;

    window.themeSchemeTab = 'manual';
    renderTheme();
}

export function syncCustomColors() {
    state.site.theme = state.site.theme || {};
    state.site.theme.isCustom = true;
    state.site.theme.dark = {
        primary: document.getElementById('t-dark-primary').value,
        secondary: document.getElementById('t-dark-secondary').value,
        background: document.getElementById('t-dark-bg').value,
        foreground: document.getElementById('t-dark-fg').value,
        muted: document.getElementById('t-dark-muted').value,
        border: document.getElementById('t-dark-border').value,
        card: document.getElementById('t-dark-card').value,
    };
    state.site.theme.light = {
        primary: document.getElementById('t-light-primary').value,
        secondary: document.getElementById('t-light-secondary').value,
        background: document.getElementById('t-light-bg').value,
        foreground: document.getElementById('t-light-fg').value,
        muted: document.getElementById('t-light-muted').value,
        border: document.getElementById('t-light-border').value,
        card: document.getElementById('t-light-card').value,
    };
}
