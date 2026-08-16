import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { loadAll } from '../core/data.js';
import { show, render } from '../core/router.js';
import { val } from '../utils/helpers.js';

export function renderPages() {
  dom.content.innerHTML = `
    <h2 style="margin-bottom:18px">برگه‌ها</h2>
    <button class="btn" style="margin-bottom:24px" onclick="newPage()">+ ایجاد برگه جدید</button>
    <div class="grid2">
      <!-- System Pages -->
      <div class="card" style="display:flex; flex-direction:column; padding:16px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
          <strong style="font-size:1.1rem">صفحه اصلی</strong>
          <span class="tag" style="background:color-mix(in srgb, var(--secondary) 12%, transparent); color:var(--secondary)">(سیستمی)</span>
        </div>
        <p style="color:#9ba6b5; font-size:0.85rem; margin-bottom:16px">مدیریت محتوای هیرو و شبکه‌های اجتماعی صفحه اول.</p>
        <button class="btn sec" style="margin-top:auto" onclick="show('hero')">ویرایش صفحه اصلی</button>
      </div>

      <div class="card" style="display:flex; flex-direction:column; padding:16px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
          <strong style="font-size:1.1rem">رزومه</strong>
          <span class="tag" style="background:color-mix(in srgb, var(--secondary) 12%, transparent); color:var(--secondary)">(سیستمی)</span>
        </div>
        <p style="color:#9ba6b5; font-size:0.85rem; margin-bottom:16px">مدیریت سوابق شغلی، تحصیلی و اطلاعات تماس.</p>
        <button class="btn sec" style="margin-top:auto" onclick="show('resume')">ویرایش رزومه</button>
      </div>

      <!-- Normal Pages -->
      ${state.pagesList.map((p) => `
        <div class="card" style="display:flex; flex-direction:column; padding:16px">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
            <strong style="font-size:1.1rem">${p.title || '(بدون عنوان)'}</strong>
            <span class="tag" style="background:#17303b; color:#8adcf0">عادی</span>
          </div>
          <p style="color:#9ba6b5; font-size:0.85rem; margin-bottom:16px">آدرس: /${p.slug}</p>
          <div class="row" style="margin-top:auto">
            <button class="btn sec" style="flex:1; justify-content:center" onclick="editPage('${p.slug}')">ویرایش</button>
            <button class="btn danger" style="padding:10px" onclick="deletePage('${p.slug}')" title="حذف"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export function newPage() { state.editingPage = { title: '', slug: '', content: '' }; show('page-edit', false); render(); }
export function editPage(slug) { state.editingPage = state.pagesList.find((p) => p.slug === slug); show('page-edit', false); render(); }
export async function deletePage(slug) { if (!confirm('حذف شود؟')) return; await api('/api/pages', { method: 'DELETE', body: JSON.stringify({ slug }), headers: { 'Content-Type': 'application/json' } }); await loadAll(); show('pages'); }

export function renderPageEdit() {
  const p = state.editingPage;
  dom.content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
      <div>
        <h2 style="margin-bottom:4px">${p.slug ? 'ویرایش برگه' : 'ایجاد برگه جدید'}</h2>
      </div>
      <div class="row">
        <button class="btn sec" onclick="show('pages')">انصراف</button>
        <button class="btn" onclick="savePage()">ذخیره برگه</button>
      </div>
    </div>

    <div class="card" style="padding:24px">
      <div class="grid2" style="margin-bottom:16px">
        <div><label style="margin-top:0">عنوان برگه</label><input id="p-title" value="${p.title || ''}"></div>
        <div><label style="margin-top:0">شناسه (slug)</label><input id="p-slug" value="${p.slug || ''}" dir="ltr"></div>
      </div>
      <label>محتوای برگه (Markdown)</label>
      <textarea id="p-content" style="min-height:400px">${p.content || ''}</textarea>
    </div>
  `;
}

export async function savePage() {
  const data = {
    title: val('p-title'),
    slug: val('p-slug'),
    content: val('p-content'),
  };
  await api('/api/pages', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
  await loadAll();
  show('pages');
}
