import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { loadAll } from '../core/data.js';
import { show } from '../core/router.js';
import { val } from '../utils/helpers.js';


export function renderHero() {
  if (!state.site.homeLayout || !state.site.homeLayout.length) {
    state.site.homeLayout = [
      { id: 'projects', display: true, maxItems: 6, grid: 3 },
      { id: 'posts', display: true, maxItems: 6, grid: 3 }
    ];
  } else if (state.site.homeLayout.some(item => item.id === 'hero')) {
    state.site.homeLayout = state.site.homeLayout.filter(item => item.id !== 'hero');
  }

  const h = state.site.hero || {};

  dom.content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
      <div>
        <h2 style="margin-bottom:4px">صفحه اصلی</h2>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 3fr 1fr; gap:24px;">
      <div>
        <div>
        <div class="card" style="padding:24px">
          <h3 style="margin-top:0;">بخش اول (Hero)</h3>
          <div class="grid2">
            <div><label>اسم</label><input id="h-name" value="${h.name || state.site.name || ''}"></div>
            <div><label>عنوان شغلی</label><input id="h-jobTitle" value="${h.jobTitle || state.site.title || ''}"></div>
          </div>
          <label>متن درباره من</label><textarea id="h-about" style="min-height:120px">${h.about || state.site.bio || ''}</textarea>
          <label>تصویر پروفایل</label>
          <div class="row">
            <input id="h-profileImage" value="${h.profileImage || state.site.profileImage || ''}" style="flex:1">
            <button class="btn sec" onclick="openMediaModal((path) => { document.getElementById('h-profileImage').value = path; document.getElementById('h-image-preview').innerHTML = '<img src=&quot;' + path + '&quot; class=&quot;preview&quot;>'; })">انتخاب از رسانه</button>
          </div>
          <div id="h-image-preview" style="margin-top:8px">${(h.profileImage || state.site.profileImage) ? `<img src="${h.profileImage || state.site.profileImage}" class="preview">` : ''}</div>

          <hr>
          <h3 style="margin-bottom:12px">شبکه‌های اجتماعی</h3>
          <div class="grid2">
            <div><label>GitHub</label><input id="h-github" value="${h.github ?? ''}" placeholder="https://github.com/username"></div>
            <div><label>LinkedIn</label><input id="h-linkedin" value="${h.linkedin ?? ''}" placeholder="https://linkedin.com/in/username"></div>
            <div><label>Instagram</label><input id="h-instagram" value="${h.instagram ?? ''}" placeholder="https://instagram.com/username"></div>
            <div><label>Telegram</label><input id="h-telegram" value="${h.telegram ?? ''}" placeholder="https://t.me/username"></div>
            <div><label>YouTube</label><input id="h-youtube" value="${h.youtube ?? ''}" placeholder="https://youtube.com/@username"></div>
            <div><label>Twitter (X)</label><input id="h-twitter" value="${h.twitter ?? ''}" placeholder="https://twitter.com/username"></div></div>
        </div>
      </div>

      <div>
        <div class="card" style="padding:24px; margin-top:0;">
          <h3 style="margin-top:0;">بدنه</h3>
          <p class="sub" style="margin-bottom:24px">تنظیمات نمایش پروژه‌ها و پست‌ها در صفحه اصلی.</p>
          <div id="h-layout-list" style="display:flex; flex-direction:column; gap:16px;"></div>
        </div>
      </div>
      </div>


      <aside>

        <div class="card" style="position:sticky; top:24px;">
          <div style="display:flex; flex-direction:column; gap:12px;">
            <button class="btn" onclick="saveHero()" style="justify-content:center">ذخیره</button>
            <button class="btn sec" onclick="cancelHero()" style="justify-content:center">انصراف</button>
          </div>
        </div>
      </aside>
    </div>`;
  renderHomeLayout();
}

export async function cancelHero() {
  await loadAll();
  show('pages');
}

export async function saveHero() {
  state.site.hero = {
    name: val('h-name'),
    jobTitle: val('h-jobTitle'),
    about: val('h-about'),
    profileImage: val('h-profileImage'),
    github: val('h-github'),
    linkedin: val('h-linkedin'),
    instagram: val('h-instagram'),
    telegram: val('h-telegram'),
    youtube: val('h-youtube'),
    twitter: val('h-twitter')
  };

  // Sync inputs before saving homeLayout
  state.site.homeLayout.forEach((item, i) => {
    const displayEl = document.getElementById('h-layout-' + item.id + '-display');
    if (displayEl) item.display = displayEl.checked;
  });
  await api('/api/site', { method: 'POST', body: JSON.stringify(state.site), headers: { 'Content-Type': 'application/json' } });
  await loadAll();

  const btn = document.querySelector('button[onclick="saveHero()"]');
  if (btn) {
    const origText = btn.innerHTML;
    btn.innerHTML = 'ذخیره شد ✓';
    btn.classList.add('ok');
    setTimeout(() => { btn.innerHTML = origText; btn.classList.remove('ok'); }, 2000);
  }
}

export function renderHomeLayout() {
  const container = document.getElementById('h-layout-list');
  if (!container) return;

  const names = { projects: 'پروژه‌ها', posts: 'پست‌ها' };

  container.innerHTML = state.site.homeLayout.map((item, i) => {
    return `
    <div class="card" draggable="true" data-index="${i}" style="padding:16px; margin:0; border:1px solid var(--border); box-shadow:none; cursor:grab;" ondragstart="handleDragStartHome(event, ${i})" ondragover="handleDragOverHome(event)" ondrop="handleDropHome(event, ${i})" ondragend="handleDragEndHome(event)">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="display:flex; align-items:center; gap:8px">
          <div style="color:var(--muted); cursor:grab; padding:4px;" title="جابجایی">
            ${icon('move')}
          </div>
          <strong style="font-size:1.1rem">${names[item.id]}</strong>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <label style="margin:0; font-size:0.9rem;" for="h-layout-${item.id}-display">نمایش</label>
          <input type="checkbox" id="h-layout-${item.id}-display" ${item.display ? 'checked' : ''} onchange="state.site.homeLayout[${i}].display=this.checked">
        </div>
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
        <div>
          <label style="margin-top:0; font-size:0.85rem; color:var(--muted)">حداکثر تعداد نمایش</label>
          <input type="number" value="${item.maxItems || 6}" onchange="state.site.homeLayout[${i}].maxItems=parseInt(this.value)">
        </div>
        <div>
          <label style="margin-top:0; font-size:0.85rem; color:var(--muted)">ستون‌ها (۲، ۳، ۴)</label>
          <input type="number" min="2" max="4" value="${item.grid || 3}" onchange="let v=parseInt(this.value); if(v>=2 && v<=4) state.site.homeLayout[${i}].grid=v; else this.value=state.site.homeLayout[${i}].grid;">
        </div>
      </div>
    </div>
  `}).join('');
}

export function handleDragStartHome(e, index) {
  state.draggedHomeIndex = index;
  e.target.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
}

export function handleDragOverHome(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

export function handleDropHome(e, dropIndex) {
  e.preventDefault();
  if (state.draggedHomeIndex === null || state.draggedHomeIndex === dropIndex) return;


  const temp = state.site.homeLayout[state.draggedHomeIndex];
  state.site.homeLayout.splice(state.draggedHomeIndex, 1);
  state.site.homeLayout.splice(dropIndex, 0, temp);

  renderHomeLayout();
}

export function handleDragEndHome(e) {
  e.target.style.opacity = '1';
  state.draggedHomeIndex = null;
}
