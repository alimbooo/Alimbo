import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { loadAll } from '../core/data.js';
import { show } from '../core/router.js';
import { val } from '../utils/helpers.js';

export function renderSettings() {
  const defaultFooter = `© ${new Date().getFullYear()} ${state.site.name || ''}. همه حقوق محفوظ است.`;
  const footerVal = typeof state.site.footerText === 'string' ? state.site.footerText : defaultFooter;

  dom.content.innerHTML = `<h2>تنظیمات سایت</h2><p class="sub">اطلاعات اصلی و سئو.</p>
    <div class="card" style="width: 850px;">
      <label>نام</label><input id="s-name" value="${state.site.name || ''}">
      <label>فاوآیکون</label>
      <div class="row">
        <input id="s-favicon" value="${state.site.favicon || ''}" style="flex:1" placeholder="/media/favicon.ico">
        <button class="btn sec" onclick="openMediaModal((path) => { document.getElementById('s-favicon').value = path; document.getElementById('favicon-preview').innerHTML = '<img src=&quot;' + path + '&quot; style=&quot;width:32px;height:32px;border-radius:4px;border:1px solid #263243;object-fit:contain;background:#0b111b;padding:2px&quot;>'; })">انتخاب از رسانه</button>
      </div>
      <div id="favicon-preview" style="margin-top:8px">${state.site.favicon ? `<img src="${state.site.favicon}" style="width:32px;height:32px;border-radius:4px;border:1px solid #263243;object-fit:contain;background:#0b111b;padding:2px">` : ''}</div>

      <label>عنوان سئو</label><input id="s-seoTitle" value="${state.site.seoTitle || ''}">
      <label>توضیح سئو</label><textarea id="s-seoDesc">${state.site.seoDescription || ''}</textarea>
      <label>متن فوتر</label><input id="s-footerText" value="${footerVal}">
      <div style="margin-top:16px"></div>
    </div>
    <button class="btn" onclick="saveSettings()">ذخیره</button>
    `;
}

export async function saveSettings() {
  state.site.name = val('s-name');
  state.site.favicon = val('s-favicon');
  state.site.seoTitle = val('s-seoTitle');
  state.site.seoDescription = val('s-seoDesc');
  state.site.footerText = val('s-footerText');
  await api('/api/site', { method: 'POST', body: JSON.stringify(state.site), headers: { 'Content-Type': 'application/json' } });
  await loadAll();
  show('settings');
}
