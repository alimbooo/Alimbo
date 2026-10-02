import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { loadAll } from '../core/data.js';
import { show } from '../core/router.js';
import { icon } from '../icons.js';
import { showMsg } from '../utils/helpers.js';

let searchQuery = '';
let selectedCategory = 'all';
let draggedPoIndex = null;
let isAutoSave = localStorage.getItem('cms-po-autosave') !== 'false';
let originalSavedOrder = null;

function ensureProjectsOrder() {
  if (!state.projects || !Array.isArray(state.projects)) {
    state.projects = [];
  }
  if (!state.site) state.site = {};
  if (!Array.isArray(state.site.projectsOrder)) {
    state.site.projectsOrder = state.projects.map(p => p.slug);
  }

  // Sort state.projects according to state.site.projectsOrder
  const orderMap = new Map(state.site.projectsOrder.map((slug, idx) => [slug, idx]));
  state.projects.sort((a, b) => {
    const idxA = orderMap.has(a.slug) ? orderMap.get(a.slug) : 999999;
    const idxB = orderMap.has(b.slug) ? orderMap.get(b.slug) : 999999;
    if (idxA !== idxB) return idxA - idxB;
    return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
  });

  // Re-sync site.projectsOrder with full list to include any previously missing projects
  state.site.projectsOrder = state.projects.map(p => p.slug);

  if (!originalSavedOrder) {
    originalSavedOrder = [...state.site.projectsOrder];
  }
}

export function renderProjectsOrder() {
  ensureProjectsOrder();

  const allProjects = state.projects || [];
  const projectCats = (state.categories || []).filter(c => c.type !== 'posts');
  const catMap = new Map(projectCats.map(c => [c.slug, c.name]));

  // Filtered view items with their global index preserved
  const itemsWithIndex = allProjects.map((p, globalIdx) => ({ p, globalIdx }));

  const filteredItems = itemsWithIndex.filter(({ p }) => {
    // Category filter
    if (selectedCategory !== 'all') {
      const cats = Array.isArray(p.categories) ? p.categories : [];
      if (!cats.some(c => c.toLowerCase() === selectedCategory.toLowerCase())) {
        return false;
      }
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchSlug = (p.slug || '').toLowerCase().includes(q);
      const matchClient = (p.client || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSlug && !matchClient) return false;
    }
    return true;
  });

  const totalCount = allProjects.length;

  dom.content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:16px">
      <div>
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px">
          <h2 style="margin:0">ترتیب نمایش پروژه‌ها</h2>
          <span class="tag" style="background:var(--card); border:1px solid var(--border); font-size:0.8rem; padding:3px 10px">${totalCount} پروژه</span>
        </div>
        <p class="sub" style="margin-bottom:0">ترتیب قرارگیری پروژه‌ها در صفحه پروژه‌ها (<span style="direction:ltr; display:inline-block">/projects</span>) سایت را تنظیم کنید. با دکمه‌های «بالاتر» و «پایین‌تر» یا با کشیدن و رها کردن، ترتیب را تغییر دهید.</p>
      </div>
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap">
        <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:0.85rem; color:var(--foreground); background:var(--card); border:1px solid var(--border); padding:8px 12px; border-radius:8px">
          <input type="checkbox" id="po-autosave" ${isAutoSave ? 'checked' : ''} onchange="window.toggleProjectsOrderAutoSave(this.checked)" style="width:auto; cursor:pointer; margin:0">
          ذخیره خودکار
        </label>
        <button class="btn sec" onclick="show('projects')">همه پروژه‌ها</button>
        <button class="btn sec" onclick="show('preview')">${icon('preview')} پیش‌نمایش</button>
        <button class="btn" onclick="window.saveProjectsOrder()" id="btn-save-projects-order">ذخیره ترتیب</button>
      </div>
    </div>

    <!-- نوار فیلتر، جستجو و ابزارهای مرتب‌سازی سریع -->
    <div class="card" style="padding:16px 20px; margin-bottom:20px">
      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:16px; margin-bottom:14px; align-items:center">
        <div>
          <input type="text" placeholder="جستجو بر اساس عنوان، شناسه، یا کارفرما..." value="${searchQuery}" oninput="window.searchProjectsOrder(this.value)" style="padding:9px 12px; font-size:0.9rem">
        </div>
        <div>
          <select onchange="window.filterProjectsOrderCategory(this.value)" style="padding:9px 12px; font-size:0.9rem">
            <option value="all" ${selectedCategory === 'all' ? 'selected' : ''}>همه دسته‌ها</option>
            ${projectCats.map(c => `
              <option value="${c.slug}" ${selectedCategory === c.slug ? 'selected' : ''}>${c.name}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-top:1px solid var(--border); padding-top:12px">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap">
          <span style="font-size:0.8rem; color:var(--muted)">مرتب‌سازی سریع:</span>
          <button class="btn sec" style="padding:4px 10px; font-size:0.8rem" onclick="window.sortProjectsOrderQuick('date-desc')" title="جدیدترین پروژه‌ها بر اساس تاریخ در بالا قرار می‌گیرند">جدیدترین تاریخ</button>
          <button class="btn sec" style="padding:4px 10px; font-size:0.8rem" onclick="window.sortProjectsOrderQuick('date-asc')" title="قدیمی‌ترین پروژه‌ها در بالا قرار می‌گیرند">قدیمی‌ترین تاریخ</button>
          <button class="btn sec" style="padding:4px 10px; font-size:0.8rem" onclick="window.sortProjectsOrderQuick('title')" title="مرتب‌سازی الفبایی بر اساس عنوان پروژه">الفبایی (عنوان)</button>
          <button class="btn sec" style="padding:4px 10px; font-size:0.8rem" onclick="window.sortProjectsOrderQuick('reverse')" title="معکوس کردن ترتیب کنونی پروژه‌ها">معکوس کردن ترتیب</button>
          <button class="btn sec" style="padding:4px 10px; font-size:0.8rem; color:var(--muted)" onclick="window.sortProjectsOrderQuick('reset')" title="بازگرداندن به آخرین وضعیت ذخیره‌شده">بازنشانی</button>
        </div>
        <div style="font-size:0.8rem; color:var(--muted)">
          نمایش ${filteredItems.length} از ${totalCount} پروژه
        </div>
      </div>
    </div>

    <!-- لیست پروژه‌ها جهت تغییر ترتیب -->
    <div id="po-list" style="display:flex; flex-direction:column; gap:8px">
      ${filteredItems.length === 0 ? `
        <div class="card" style="padding:40px 20px; text-align:center; color:var(--muted)">
          <p style="margin:0; font-size:1rem">هیچ پروژه‌ای با این مشخصات یافت نشد.</p>
        </div>
      ` : filteredItems.map(({ p, globalIdx }) => {
        const catNames = (p.categories || []).map(slug => catMap.get(slug) || slug).join('، ');
        const isFirst = globalIdx === 0;
        const isLast = globalIdx === totalCount - 1;

        return `
          <div class="card po-row" draggable="true" data-index="${globalIdx}" id="po-item-${p.slug}"
               style="display:flex; align-items:center; gap:14px; padding:12px 16px; margin:0; border:1px solid var(--border); background:var(--card); border-radius:10px; cursor:grab; transition:all 0.15s ease"
               ondragstart="window.handleDragStartPo(event, ${globalIdx})"
               ondragover="window.handleDragOverPo(event)"
               ondrop="window.handleDropPo(event, ${globalIdx})"
               ondragend="window.handleDragEndPo(event)">
            
            <!-- دستگیره درگ -->
            <div style="color:var(--muted); display:flex; align-items:center; padding:4px; opacity:0.6; cursor:grab" title="برای جابجایی بکشید و رها کنید">
              ${icon('move')}
            </div>

            <!-- شماره رتبه -->
            <div style="min-width:34px; height:34px; border-radius:8px; background:var(--background); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:0.85rem; font-weight:bold; color:var(--primary); flex-shrink:0" title="جایگاه ${globalIdx + 1} در صفحه پروژه‌ها">
              ${globalIdx + 1}
            </div>

            <!-- تصویر کاور -->
            ${p.cover ? `
              <img src="${p.cover}" style="width:52px; height:52px; object-fit:cover; border-radius:8px; border:1px solid var(--border); flex-shrink:0">
            ` : `
              <div style="width:52px; height:52px; border-radius:8px; background:var(--background); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:0.7rem; color:var(--muted); flex-shrink:0">بدون تصویر</div>
            `}

            <!-- مشخصات پروژه -->
            <div style="flex:1; min-width:0">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap">
                <strong style="font-size:0.95rem; color:var(--foreground); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${p.title || '(بدون عنوان)'}</strong>
                <span class="tag" style="font-size:0.7rem; padding:1px 8px; background:rgba(23, 48, 59, 0.9)">${p.template === 'video' ? 'ویدیو' : 'تصویر'}</span>
              </div>
              <div style="display:flex; align-items:center; gap:12px; font-size:0.75rem; color:var(--muted); flex-wrap:wrap">
                <span style="direction:ltr; text-align:left">/${p.slug}</span>
                ${p.date ? `<span>تاریخ: ${p.date}</span>` : ''}
                ${p.client ? `<span>کارفرما: ${p.client}</span>` : ''}
                ${catNames ? `<span>دسته‌ها: ${catNames}</span>` : ''}
              </div>
            </div>

            <!-- دکمه‌های انتقال: ابتدا / بالاتر / پایین‌تر / انتها -->
            <div style="display:flex; align-items:center; gap:6px; flex-shrink:0">
              <button class="btn sec" style="padding:6px 8px; border-radius:6px; font-size:0.75rem; display:flex; align-items:center; gap:4px"
                      title="انتقال به ابتدای لیست (اولین جایگاه)"
                      onclick="window.moveProjectOrderToTop(${globalIdx})"
                      ${isFirst ? 'disabled' : ''}>
                ${icon('arrow_to_top')}
                <span class="btn-text-sm">ابتدا</span>
              </button>

              <button class="btn sec" style="padding:7px 12px; border-radius:6px; font-size:0.85rem; display:flex; align-items:center; gap:4px; font-weight:bold"
                      title="یک پله بالاتر (انتقال به بالا)"
                      onclick="window.moveProjectOrderUp(${globalIdx})"
                      ${isFirst ? 'disabled' : ''}>
                ${icon('arrow_up')}
                <span>بالاتر</span>
              </button>

              <button class="btn sec" style="padding:7px 12px; border-radius:6px; font-size:0.85rem; display:flex; align-items:center; gap:4px; font-weight:bold"
                      title="یک پله پایین‌تر (انتقال به پایین)"
                      onclick="window.moveProjectOrderDown(${globalIdx})"
                      ${isLast ? 'disabled' : ''}>
                ${icon('arrow_down')}
                <span>پایین‌تر</span>
              </button>

              <button class="btn sec" style="padding:6px 8px; border-radius:6px; font-size:0.75rem; display:flex; align-items:center; gap:4px"
                      title="انتقال به انتهای لیست (آخرین جایگاه)"
                      onclick="window.moveProjectOrderToBottom(${globalIdx})"
                      ${isLast ? 'disabled' : ''}>
                ${icon('arrow_to_bottom')}
                <span class="btn-text-sm">انتها</span>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- دکمه ذخیره پایین صفحه -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; padding:16px 20px; background:var(--card); border:1px solid var(--border); border-radius:10px">
      <div style="font-size:0.85rem; color:var(--muted)">
        💡 ترتیب تنظیم‌شده در این صفحه مستقیماً در صفحه <strong>پروژه‌ها (/projects)</strong> و در بخش فیلتر دسته‌بندی‌ها اعمال می‌شود.
      </div>
      <button class="btn" onclick="window.saveProjectsOrder()" id="btn-save-projects-order-bottom">ذخیره ترتیب پروژه‌ها</button>
    </div>
  `;
}

export function searchProjectsOrder(query) {
  searchQuery = query;
  renderProjectsOrder();
}

export function filterProjectsOrderCategory(cat) {
  selectedCategory = cat;
  renderProjectsOrder();
}

export function toggleProjectsOrderAutoSave(checked) {
  isAutoSave = checked;
  localStorage.setItem('cms-po-autosave', checked ? 'true' : 'false');
  if (checked) {
    showMsg('ذخیره خودکار فعال شد');
  } else {
    showMsg('ذخیره خودکار غیرفعال شد. فراموش نکنید تغییرات را ذخیره کنید');
  }
}

async function triggerSaveIfAuto() {
  if (isAutoSave) {
    await saveProjectsOrder(true);
  }
}

export async function moveProjectOrderUp(globalIdx) {
  if (globalIdx <= 0 || !state.projects || globalIdx >= state.projects.length) return;
  const temp = state.projects[globalIdx];
  state.projects[globalIdx] = state.projects[globalIdx - 1];
  state.projects[globalIdx - 1] = temp;
  state.site.projectsOrder = state.projects.map(p => p.slug);
  renderProjectsOrder();
  await triggerSaveIfAuto();
}

export async function moveProjectOrderDown(globalIdx) {
  if (!state.projects || globalIdx < 0 || globalIdx >= state.projects.length - 1) return;
  const temp = state.projects[globalIdx];
  state.projects[globalIdx] = state.projects[globalIdx + 1];
  state.projects[globalIdx + 1] = temp;
  state.site.projectsOrder = state.projects.map(p => p.slug);
  renderProjectsOrder();
  await triggerSaveIfAuto();
}

export async function moveProjectOrderToTop(globalIdx) {
  if (globalIdx <= 0 || !state.projects || globalIdx >= state.projects.length) return;
  const [item] = state.projects.splice(globalIdx, 1);
  state.projects.unshift(item);
  state.site.projectsOrder = state.projects.map(p => p.slug);
  renderProjectsOrder();
  await triggerSaveIfAuto();
}

export async function moveProjectOrderToBottom(globalIdx) {
  if (!state.projects || globalIdx < 0 || globalIdx >= state.projects.length - 1) return;
  const [item] = state.projects.splice(globalIdx, 1);
  state.projects.push(item);
  state.site.projectsOrder = state.projects.map(p => p.slug);
  renderProjectsOrder();
  await triggerSaveIfAuto();
}

export function handleDragStartPo(e, globalIdx) {
  draggedPoIndex = globalIdx;
  e.dataTransfer.effectAllowed = 'move';
  const target = e.currentTarget || e.target;
  if (target) {
    target.style.opacity = '0.4';
    target.style.transform = 'scale(0.98)';
  }
}

export function handleDragOverPo(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const row = e.currentTarget.closest('.po-row');
  if (row) {
    row.style.borderColor = 'var(--primary)';
  }
}

export async function handleDropPo(e, dropGlobalIdx) {
  e.preventDefault();
  const row = e.currentTarget.closest('.po-row');
  if (row) {
    row.style.borderColor = 'var(--border)';
  }
  if (draggedPoIndex === null || draggedPoIndex === dropGlobalIdx) return;

  const item = state.projects.splice(draggedPoIndex, 1)[0];
  state.projects.splice(dropGlobalIdx, 0, item);
  state.site.projectsOrder = state.projects.map(p => p.slug);
  draggedPoIndex = null;
  renderProjectsOrder();
  await triggerSaveIfAuto();
}

export function handleDragEndPo(e) {
  const target = e.currentTarget || e.target;
  if (target) {
    target.style.opacity = '1';
    target.style.transform = '';
  }
  document.querySelectorAll('.po-row').forEach(el => {
    el.style.borderColor = 'var(--border)';
  });
  draggedPoIndex = null;
}

export async function sortProjectsOrderQuick(type) {
  if (!state.projects || !state.projects.length) return;

  if (type === 'date-desc') {
    state.projects.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  } else if (type === 'date-asc') {
    state.projects.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
  } else if (type === 'title') {
    state.projects.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fa'));
  } else if (type === 'reverse') {
    state.projects.reverse();
  } else if (type === 'reset') {
    if (originalSavedOrder) {
      const orderMap = new Map(originalSavedOrder.map((s, i) => [s, i]));
      state.projects.sort((a, b) => (orderMap.get(a.slug) ?? 9999) - (orderMap.get(b.slug) ?? 9999));
    }
  }

  state.site.projectsOrder = state.projects.map(p => p.slug);
  renderProjectsOrder();
  await triggerSaveIfAuto();
}

export async function saveProjectsOrder(isSilent = false) {
  ensureProjectsOrder();
  const order = state.projects.map(p => p.slug);
  state.site.projectsOrder = order;

  try {
    let res = null;
    try {
      res = await api('/api/projects/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order })
      });
    } catch (_) {}

    if (!res || !res.ok) {
      res = await api('/api/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.site)
      });
    }

    if (res && res.ok) {
      originalSavedOrder = [...order];
      if (!isSilent) {
        showMsg('ترتیب پروژه‌ها با موفقیت ذخیره شد');
      }

      // Visual feedback on buttons
      ['btn-save-projects-order', 'btn-save-projects-order-bottom'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = 'ذخیره شد ✓';
          btn.classList.add('ok');
          setTimeout(() => {
            btn.innerHTML = orig;
            btn.classList.remove('ok');
          }, 2000);
        }
      });
    } else {
      showMsg('خطا در ذخیره ترتیب: ' + (res?.error || 'ناشناخته'), true);
    }
  } catch (e) {
    showMsg('خطا در ارتباط با سرور هنگام ذخیره ترتیب', true);
  }
}
