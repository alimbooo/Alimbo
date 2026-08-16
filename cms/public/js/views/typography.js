import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { loadAll } from '../core/data.js';
import { showMsg } from '../utils/helpers.js';

const FONT_EXTENSIONS = ['.woff2', '.woff', '.ttf', '.otf'];

export function getSiteFonts() {
    return Array.isArray(state.site.fonts) ? state.site.fonts : [];
}

export function renderFontList() {
    const list = getSiteFonts();
    const container = document.getElementById('font-list');
    if (!container) return;
    if (!list.length) {
        container.innerHTML = '<div class="card" style="grid-column:1/-1; text-align:center; color:#9ba6b5">هیچ فونتی اضافه نشده است.</div>';
        return;
    }

    container.innerHTML = list.map((f, i) => `
      <div class="card" style="padding:16px; display:flex; justify-content:space-between; align-items:center">
        <div>
          <strong style="font-size:1.1rem; display:block; margin-bottom:4px">${f.name}</strong>
          <span style="color:#9ba6b5; font-size:0.85rem">منبع: ${f.source === 'google' ? 'Google Fonts' : 'آپلود شده'}</span>
        </div>
        <button class="btn danger" style="padding:8px" onclick="deleteSiteFont(${i})" title="حذف">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `).join('');
}

export function openFontModal() {
  const existing = document.getElementById('font-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'font-modal';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:480px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
        <h3 style="margin:0">افزودن فونت</h3>
        <button class="modal-close" style="color:var(--foreground); margin:0" onclick="document.getElementById('font-modal').remove()">×</button>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:24px">
        <label id="fsrc-google-label" style="display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:8px; border:2px solid var(--primary); background:color-mix(in srgb, var(--primary) 10%, transparent); cursor:pointer; font-weight:600; transition:all .15s">
          <input type="radio" name="font-source" value="google" checked onchange="toggleFontSourceModal(this.value)" style="display:none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Google Font
        </label>
        <label id="fsrc-upload-label" style="display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:8px; border:2px solid var(--border); cursor:pointer; font-weight:600; transition:all .15s">
          <input type="radio" name="font-source" value="custom" onchange="toggleFontSourceModal(this.value)" style="display:none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          آپلود فونت
        </label>
      </div>

      <div id="modal-font-google" style="margin-bottom:24px">
        <label style="margin-top:0">نام فونت (دقیقاً مطابق Google Fonts)</label>
        <input id="modal-google-name" placeholder="مثال: Vazirmatn" style="margin-bottom:4px">
        <p style="color:var(--muted); font-size:.8rem; margin:0">نام فونت را دقیقاً همان‌طور که در <a href="https://fonts.google.com" target="_blank" style="color:var(--primary)">fonts.google.com</a> نوشته شده وارد کنید.</p>
      </div>

      <div id="modal-font-custom" style="margin-bottom:24px; display:none">
        <div id="font-drop-zone" style="border:2px dashed var(--border); border-radius:10px; padding:32px 16px; text-align:center; cursor:pointer; transition:border-color .15s" ondragover="event.preventDefault(); this.style.borderColor='var(--primary)'" ondragleave="this.style.borderColor='var(--border)'" ondrop="handleFontDrop(event)">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:8px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <p style="color:var(--muted); margin:0 0 10px; font-size:.9rem">فایل را اینجا بکشید یا کلیک کنید</p>
          <input type="file" id="modal-custom-file" accept=".woff2,.woff,.ttf,.otf" style="display:none" onchange="onFontFileSelected(this)">
          <button class="btn sec" type="button" style="padding:7px 16px; font-size:.85rem" onclick="document.getElementById('modal-custom-file').click()">انتخاب فایل</button>
          <p id="font-file-name" style="color:var(--primary); font-size:.85rem; margin:10px 0 0; display:none"></p>
        </div>
        <p style="color:var(--muted); font-size:.78rem; margin:8px 0 0; line-height:1.4">
          فرمت‌های پشتیبانی‌شده: WOFF2، WOFF، TTF، OTF<br>
          <span>پیشنهاد: برای نمایش بهتر ضخامت‌ها، از نسخه متغیر (Variable) فونت استفاده کنید.</span>
        </p>
      </div>

      <button class="btn" style="width:100%; justify-content:center; padding:12px" onclick="saveFontModal()">افزودن</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

export function toggleFontSourceModal(val) {
  document.getElementById('modal-font-google').style.display = val === 'google' ? 'block' : 'none';
  document.getElementById('modal-font-custom').style.display = val === 'custom' ? 'block' : 'none';
  const googleLabel = document.getElementById('fsrc-google-label');
  const uploadLabel = document.getElementById('fsrc-upload-label');
  if (val === 'google') {
    googleLabel.style.borderColor = 'var(--primary)';
    googleLabel.style.background = 'color-mix(in srgb, var(--primary) 10%, transparent)';
    uploadLabel.style.borderColor = 'var(--border)';
    uploadLabel.style.background = 'transparent';
  } else {
    uploadLabel.style.borderColor = 'var(--primary)';
    uploadLabel.style.background = 'color-mix(in srgb, var(--primary) 10%, transparent)';
    googleLabel.style.borderColor = 'var(--border)';
    googleLabel.style.background = 'transparent';
  }
}

export function onFontFileSelected(input) {
  const file = input.files[0];
  if (!file) return;
  const label = document.getElementById('font-file-name');
  label.textContent = file.name;
  label.style.display = 'block';
}

export function handleFontDrop(event) {
  event.preventDefault();
  const zone = document.getElementById('font-drop-zone');
  zone.style.borderColor = 'var(--border)';
  const file = event.dataTransfer.files[0];
  if (!file) return;
  const input = document.getElementById('modal-custom-file');
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  onFontFileSelected(input);
}

export async function saveFontModal() {
  const source = document.querySelector('input[name="font-source"]:checked').value;
  let newFont = null;

  if (source === 'google') {
    const name = document.getElementById('modal-google-name').value.trim();
    if (!name) return alert('لطفاً نام فونت را وارد کنید.');
    newFont = { source: 'google', name, googleFamily: name };
  } else {
    const fileInput = document.getElementById('modal-custom-file');
    const file = fileInput.files[0];
    if (!file) return alert('لطفاً یک فایل فونت انتخاب کنید.');

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!FONT_EXTENSIONS.includes(ext)) { alert('فرمت پشتیبانی نمی‌شود.'); return; }

    const buffer = await file.arrayBuffer();
    await fetch('/api/fonts?name=' + encodeURIComponent(file.name), { method: 'POST', body: buffer });

    const name = file.name.replace(/\.[^.]+$/, '');
    
    // نگاشت استاندارد پسوند به فرمت CSS
    const formatMap = {
      '.woff2': 'woff2',
      '.woff': 'woff',
      '.ttf': 'truetype',
      '.otf': 'opentype'
    };
    const format = formatMap[ext] || ext.slice(1);

    // ثبت با بازه کامل ضخامت‌ها بدون نیاز به شرط نام فایل
    newFont = {
      source: 'custom',
      name,
      customFont: { 
        path: `/fonts/${file.name}`, 
        format, 
        isVariable: true, 
        weights: [100, 900] 
      }
    };
  }

  if (!Array.isArray(state.site.fonts)) state.site.fonts = [];
  if (state.site.fonts.find(f => f.name === newFont.name)) {
    return alert(`فونت "${newFont.name}" از قبل وجود دارد.`);
  }
  state.site.fonts.push(newFont);

  await api('/api/site', { method: 'POST', body: JSON.stringify(state.site), headers: { 'Content-Type': 'application/json' } });
  document.getElementById('font-modal').remove();

  if (state.currentView === 'typography') {
    renderTypography();
  } else {
    renderFontList();
  }
}

export async function deleteSiteFont(i) {
    const list = getSiteFonts();
    const font = list[i];
    if (!font) return;

    const typo = state.site.typography || {};
    if (typo.bodyFont === font.name || typo.headingFont === font.name) {
        alert('این فونت در بخش تایپوگرافی در حال استفاده است. ابتدا آن را تغییر دهید.');
        return;
    }

    if (!confirm(`فونت "${font.name}" حذف شود؟`)) return;

    list.splice(i, 1);
    state.site.fonts = list;
    await api('/api/site', { method: 'POST', body: JSON.stringify(state.site), headers: { 'Content-Type': 'application/json' } });

    if (font.source === 'custom' && font.customFont?.path) {
        await fetch('/api/fonts', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: font.customFont.path })
        });
    }

    if (state.currentView === 'typography') {
        renderTypography();
    } else {
        renderFontList();
    }
}

export function renderTypography() {
  const typo = state.site.typography || { bodyFont: '', headingFont: '' };
  const list = getSiteFonts();

  dom.content.innerHTML = `
        <h2 style="margin-bottom:4px">فونت</h2>
        <p class="sub" style="margin-bottom:24px">ابتدا فونت دلخواه خود را اضافه کنید سپس فونت متن و تیتر را تنظیم کنید.</p>

    <div style="display:flex; flex-direction: column; gap:24px; width: 850px;">

      <!-- Fonts Manager -->
      <div>
        <div class="card" style="padding:24px; display:flex; flex-direction:column; gap:16px;">
          <h3 style="margin-bottom:0px; font-size:1.1rem; color:var(--primary)">مدیریت فونت‌ها</h3>
          <p class="sub" style="margin-bottom:0">فونت های موجود:</p>
          <div id="fonts-list" style="display:flex; flex-direction:column; gap:8px;">
            ${list.length === 0 ? '<p class="sub" style="font-size:0.9rem">هیچ فونتی یافت نشد.</p>' : ''}
            ${list.map((f, i) => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--background); border-radius:8px; border:1px solid var(--border);">
                <span style="font-family: ${f.name}, Tahoma">${f.name}</span>
                <button class="btn sec" style="padding:4px; border:none; color:#ef4444" onclick="deleteSiteFont(${i})">حذف</button>
              </div>
            `).join('')}
          </div>
          <button class="btn sec" onclick="openFontModal()">+ افزودن فونت جدید</button>
        </div>
      </div>

      <!-- Typography Settings -->
      <div>
        <div class="card" style="padding:24px">
          <h3 style="margin-bottom:16px; font-size:1.1rem; color:var(--primary)">انتخاب فونت سایت</h3>
          <div style="margin-bottom:24px">
            <label style="margin-top:0">فونت متن سایت</label>
            <select id="typo-body" onchange="updateTypoAuto('bodyFont', this.value)">
              <option value="">(پیش‌فرض سیستم)</option>
              ${list.map(f => `<option value="${f.name}" ${typo.bodyFont === f.name ? 'selected' : ''}>${f.name}</option>`).join('')}
            </select>
          </div>

          <div style="margin-bottom:24px">
            <label style="margin-top:0">فونت تیترها</label>
            <select id="typo-heading" onchange="updateTypoAuto('headingFont', this.value)">
              <option value="">(همان فونت متن)</option>
              ${list.map(f => `<option value="${f.name}" ${typo.headingFont === f.name ? 'selected' : ''}>${f.name}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

    </div>
  `;
}

export async function updateTypoAuto(key, value) {
  state.site.typography = state.site.typography || { bodyFont: '', headingFont: '' };
  state.site.typography[key] = value;

  if (state.site.typography.bodyFont) {
    state.site.font = state.site.typography.bodyFont;
  } else {
    state.site.font = 'Tahoma';
  }

  try {
    await api('/api/site', { method: 'POST', body: JSON.stringify(state.site), headers: { 'Content-Type': 'application/json' } });
    await loadAll();
    if (typeof window.applyTheme === 'function') window.applyTheme();
  } catch(e) {
    showMsg('خطا در ذخیره تایپوگرافی', true);
  }
}