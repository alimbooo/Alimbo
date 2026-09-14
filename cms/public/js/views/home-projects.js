import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { loadAll } from '../core/data.js';
import { show } from '../core/router.js';
import { icon } from '../icons.js';

let searchQuery = '';
let draggedHomeProjIndex = null;

function getHomeProjectsConfig() {
  if (!state.site.homeLayout || !Array.isArray(state.site.homeLayout)) {
    state.site.homeLayout = [
      { id: 'projects', display: true, maxItems: 6, grid: 3, selectedProjects: [], mode: 'manual' },
      { id: 'posts', display: true, maxItems: 6, grid: 3 }
    ];
  }
  let projSection = state.site.homeLayout.find(item => item.id === 'projects');
  if (!projSection) {
    projSection = { id: 'projects', display: true, maxItems: 6, grid: 3, selectedProjects: [], mode: 'manual' };
    state.site.homeLayout.unshift(projSection);
  }
  if (!Array.isArray(projSection.selectedProjects)) {
    projSection.selectedProjects = [];
  }
  if (!projSection.mode) {
    projSection.mode = projSection.selectedProjects.length > 0 ? 'manual' : 'manual';
  }
  return projSection;
}

export function renderHomeProjects() {
  const config = getHomeProjectsConfig();
  const allProjects = state.projects || [];
  const projectMap = new Map(allProjects.map(p => [p.slug, p]));

  // Valid selected projects in order
  const selectedSlugs = config.selectedProjects.filter(slug => projectMap.has(slug));
  config.selectedProjects = selectedSlugs; // Clean up any stale slugs

  const selectedProjects = selectedSlugs.map(slug => projectMap.get(slug));
  const selectedSet = new Set(selectedSlugs);

  // Available projects (not yet selected)
  const availableProjects = allProjects.filter(p => !selectedSet.has(p.slug)).filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (p.title || '').toLowerCase().includes(q) || (p.slug || '').toLowerCase().includes(q);
  });

  const isManual = config.mode !== 'auto';

  dom.content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px">
      <div>
        <h2 style="margin-bottom:4px">پروژه‌های صفحه اصلی</h2>
        <p class="sub" style="margin-bottom:0">پروژه‌هایی که در صفحه اول سایت نمایش داده می‌شوند و ترتیب قرارگیری آن‌ها را مشخص کنید.</p>
      </div>
      <div style="display:flex; gap:10px; align-items:center">
        <button class="btn sec" onclick="show('hero')">تنظیمات صفحه اصلی</button>
        <button class="btn" onclick="saveHomeProjects()" id="btn-save-home-projects">ذخیره تغییرات</button>
      </div>
    </div>

    <!-- تنظیمات کلی بخش پروژه‌ها -->
    <div class="card" style="padding:20px; margin-bottom:24px;">
      <h3 style="margin-top:0; margin-bottom:16px; font-size:1.1rem; color:var(--primary)">تنظیمات نمایش بخش پروژه‌ها در صفحه اصلی</h3>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:20px; align-items:flex-end">
        <div>
          <label style="margin-top:0; font-size:0.85rem">وضعیت نمایش در صفحه اصلی</label>
          <div style="display:flex; align-items:center; gap:8px; margin-top:8px">
            <input type="checkbox" id="hp-display" ${config.display ? 'checked' : ''} onchange="toggleHomeProjectsDisplay(this.checked)" style="width:auto; cursor:pointer">
            <label for="hp-display" style="margin:0; cursor:pointer; font-weight:bold; color:var(--foreground)">نمایش این بخش در صفحه اصلی</label>
          </div>
        </div>

        <div>
          <label style="margin-top:0; font-size:0.85rem">نحوه انتخاب پروژه‌ها</label>
          <select id="hp-mode" onchange="setHomeProjectsMode(this.value)">
            <option value="manual" ${isManual ? 'selected' : ''}>انتخاب دستی پروژه‌ها (پروژه‌های منتخب)</option>
            <option value="auto" ${!isManual ? 'selected' : ''}>خودکار (جدیدترین پروژه‌ها بر اساس تاریخ)</option>
          </select>
        </div>

        <div>
          <label style="margin-top:0; font-size:0.85rem">حداکثر تعداد مجاز برای نمایش</label>
          <input type="number" id="hp-max" min="1" max="50" value="${config.maxItems || 6}" onchange="setHomeProjectsMax(this.value)">
        </div>

        <div>
          <label style="margin-top:0; font-size:0.85rem">تعداد ستون‌ها در دسکتاپ</label>
          <select id="hp-grid" onchange="setHomeProjectsGrid(this.value)">
            <option value="2" ${config.grid === 2 ? 'selected' : ''}>۲ ستونه</option>
            <option value="3" ${config.grid === 3 || !config.grid ? 'selected' : ''}>۳ ستونه (استاندارد)</option>
            <option value="4" ${config.grid === 4 ? 'selected' : ''}>۴ ستونه</option>
          </select>
        </div>
      </div>
    </div>

    ${!isManual ? `
      <div class="card" style="padding:32px; text-align:center; border:1px dashed var(--border)">
        <p style="color:var(--muted); margin-bottom:16px; font-size:1rem">در حالت «خودکار»، سیستم به صورت خودکار جدیدترین پروژه‌ها را به تعداد تعیین‌شده (${config.maxItems || 6} عدد) بر اساس تاریخ در صفحه اول نمایش می‌دهد.</p>
        <button class="btn sec" onclick="setHomeProjectsMode('manual')">تغییر به انتخاب دستی پروژه‌ها</button>
      </div>
    ` : `
      <!-- حالت انتخاب دستی -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; align-items:start">
        
        <!-- ستون سمت راست: پروژه‌های انتخاب‌شده برای صفحه اصلی -->
        <div class="card" style="padding:20px; margin:0">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:12px">
            <div>
              <h3 style="margin:0; font-size:1.1rem; color:var(--primary)">پروژه‌های در حال نمایش (${selectedProjects.length})</h3>
              <p class="sub" style="margin:4px 0 0 0; font-size:0.8rem">ترتیب نمایش از بالا به پایین است. با دکمه‌های فلش یا درگ می‌توانید ترتیب را تغییر دهید.</p>
            </div>
            ${selectedProjects.length > 0 ? `
              <button class="btn sec" style="padding:4px 8px; font-size:0.75rem; color:var(--error)" onclick="clearAllHomeProjects()">حذف همه</button>
            ` : ''}
          </div>

          <div id="hp-selected-list" style="display:flex; flex-direction:column; gap:10px">
            ${selectedProjects.length === 0 ? `
              <div style="padding:32px 16px; text-align:center; color:var(--muted); border:1px dashed var(--border); border-radius:8px">
                <p style="margin:0 0 8px 0; font-size:0.95rem">هنوز هیچ پروژه‌ای انتخاب نشده است.</p>
                <p style="margin:0; font-size:0.8rem">از ستون «سایر پروژه‌ها»، پروژه‌های مورد نظرتان را اضافه کنید.</p>
              </div>
            ` : selectedProjects.map((p, i) => `
              <div class="card" draggable="true" data-index="${i}"
                   style="display:flex; align-items:center; gap:12px; padding:10px; margin:0; border:1px solid var(--border); background:var(--background); cursor:grab"
                   ondragstart="handleDragStartHp(event, ${i})" ondragover="handleDragOverHp(event)" ondrop="handleDropHp(event, ${i})" ondragend="handleDragEndHp(event)">
                <div style="color:var(--muted); display:flex; align-items:center; padding:4px" title="جابجایی">${icon('move')}</div>
                <div style="width:24px; height:24px; border-radius:50%; background:var(--card); display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:bold; color:var(--primary)">
                  ${i + 1}
                </div>
                ${p.cover ? `
                  <img src="${p.cover}" style="width:48px; height:48px; object-fit:cover; border-radius:6px; border:1px solid var(--border); flex-shrink:0">
                ` : `
                  <div style="width:48px; height:48px; border-radius:6px; background:var(--card); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:0.7rem; color:var(--muted); flex-shrink:0">بدون کاور</div>
                `}
                <div style="flex:1; min-width:0">
                  <strong style="display:block; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${p.title || '(بدون عنوان)'}</strong>
                  <span style="font-size:0.75rem; color:var(--muted)">/${p.slug}</span>
                </div>
                <div style="display:flex; align-items:center; gap:4px">
                  <button class="btn sec" style="padding:6px; border-radius:6px" title="بالاتر" onclick="moveHomeProjectUp(${i})" ${i === 0 ? 'disabled' : ''}>
                    ${icon('arrow_up')}
                  </button>
                  <button class="btn sec" style="padding:6px; border-radius:6px" title="پایین‌تر" onclick="moveHomeProjectDown(${i})" ${i === selectedProjects.length - 1 ? 'disabled' : ''}>
                    ${icon('arrow_down')}
                  </button>
                  <button class="btn danger" style="padding:6px; border-radius:6px" title="حذف از صفحه اصلی" onclick="removeHomeProject('${p.slug}')">
                    ${icon('trash_small')}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- ستون سمت چپ: سایر پروژه‌ها جهت افزودن -->
        <div class="card" style="padding:20px; margin:0">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:12px">
            <div>
              <h3 style="margin:0; font-size:1.1rem">سایر پروژه‌ها (${availableProjects.length})</h3>
              <p class="sub" style="margin:4px 0 0 0; font-size:0.8rem">برای افزودن به صفحه اول روی دکمه «+ افزودن» کلیک کنید.</p>
            </div>
            ${availableProjects.length > 0 ? `
              <button class="btn sec" style="padding:4px 8px; font-size:0.75rem" onclick="addAllAvailableHomeProjects()">+ افزودن همه</button>
            ` : ''}
          </div>

          <div style="margin-bottom:12px">
            <input type="text" placeholder="جستجو بین پروژه‌ها..." value="${searchQuery}" oninput="searchHomeProjects(this.value)" style="font-size:0.85rem; padding:8px 12px">
          </div>

          <div id="hp-available-list" style="display:flex; flex-direction:column; gap:10px; max-height:550px; overflow-y:auto; padding-left:4px">
            ${availableProjects.length === 0 ? `
              <div style="padding:32px 16px; text-align:center; color:var(--muted); border:1px dashed var(--border); border-radius:8px">
                ${allProjects.length === 0 ? 'هیچ پروژه‌ای در سایت ثبت نشده است.' : (searchQuery ? 'پروژه‌ای با این عنوان یافت نشد.' : 'همه پروژه‌ها به صفحه اصلی اضافه شده‌اند.')}
              </div>
            ` : availableProjects.map(p => `
              <div class="card" style="display:flex; align-items:center; gap:12px; padding:10px; margin:0; border:1px solid var(--border); background:var(--background)">
                ${p.cover ? `
                  <img src="${p.cover}" style="width:44px; height:44px; object-fit:cover; border-radius:6px; border:1px solid var(--border); flex-shrink:0">
                ` : `
                  <div style="width:44px; height:44px; border-radius:6px; background:var(--card); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:0.7rem; color:var(--muted); flex-shrink:0">بدون کاور</div>
                `}
                <div style="flex:1; min-width:0">
                  <strong style="display:block; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${p.title || '(بدون عنوان)'}</strong>
                  <span style="font-size:0.75rem; color:var(--muted)">/${p.slug}</span>
                </div>
                <button class="btn sec" style="padding:6px 12px; font-size:0.8rem; display:flex; align-items:center; gap:4px" onclick="addHomeProject('${p.slug}')">
                  ${icon('plus')} افزودن
                </button>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `}
  `;
}

export function searchHomeProjects(query) {
  searchQuery = query;
  renderHomeProjects();
}

export function toggleHomeProjectsDisplay(checked) {
  const config = getHomeProjectsConfig();
  config.display = checked;
}

export function setHomeProjectsMode(mode) {
  const config = getHomeProjectsConfig();
  config.mode = mode;
  renderHomeProjects();
}

export function setHomeProjectsMax(val) {
  const config = getHomeProjectsConfig();
  config.maxItems = parseInt(val) || 6;
}

export function setHomeProjectsGrid(val) {
  const config = getHomeProjectsConfig();
  config.grid = parseInt(val) || 3;
}

export function addHomeProject(slug) {
  const config = getHomeProjectsConfig();
  if (!config.selectedProjects.includes(slug)) {
    config.selectedProjects.push(slug);
    renderHomeProjects();
  }
}

export function removeHomeProject(slug) {
  const config = getHomeProjectsConfig();
  config.selectedProjects = config.selectedProjects.filter(s => s !== slug);
  renderHomeProjects();
}

export function addAllAvailableHomeProjects() {
  const config = getHomeProjectsConfig();
  const allSlugs = (state.projects || []).map(p => p.slug);
  allSlugs.forEach(slug => {
    if (!config.selectedProjects.includes(slug)) {
      config.selectedProjects.push(slug);
    }
  });
  renderHomeProjects();
}

export function clearAllHomeProjects() {
  const config = getHomeProjectsConfig();
  config.selectedProjects = [];
  renderHomeProjects();
}

export function moveHomeProjectUp(index) {
  const config = getHomeProjectsConfig();
  if (index <= 0) return;
  const temp = config.selectedProjects[index];
  config.selectedProjects[index] = config.selectedProjects[index - 1];
  config.selectedProjects[index - 1] = temp;
  renderHomeProjects();
}

export function moveHomeProjectDown(index) {
  const config = getHomeProjectsConfig();
  if (index >= config.selectedProjects.length - 1) return;
  const temp = config.selectedProjects[index];
  config.selectedProjects[index] = config.selectedProjects[index + 1];
  config.selectedProjects[index + 1] = temp;
  renderHomeProjects();
}

export function handleDragStartHp(e, index) {
  draggedHomeProjIndex = index;
  e.target.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
}

export function handleDragOverHp(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

export function handleDropHp(e, dropIndex) {
  e.preventDefault();
  const config = getHomeProjectsConfig();
  if (draggedHomeProjIndex === null || draggedHomeProjIndex === dropIndex) return;
  const temp = config.selectedProjects[draggedHomeProjIndex];
  config.selectedProjects.splice(draggedHomeProjIndex, 1);
  config.selectedProjects.splice(dropIndex, 0, temp);
  renderHomeProjects();
}

export function handleDragEndHp(e) {
  e.target.style.opacity = '1';
  draggedHomeProjIndex = null;
}

export async function saveHomeProjects() {
  const config = getHomeProjectsConfig();
  const displayEl = document.getElementById('hp-display');
  const maxEl = document.getElementById('hp-max');
  const gridEl = document.getElementById('hp-grid');
  const modeEl = document.getElementById('hp-mode');

  if (displayEl) config.display = displayEl.checked;
  if (maxEl) config.maxItems = parseInt(maxEl.value) || 6;
  if (gridEl) config.grid = parseInt(gridEl.value) || 3;
  if (modeEl) config.mode = modeEl.value;

  // Also sync top-level featuredProjects on site if needed
  state.site.featuredProjects = [...config.selectedProjects];

  await api('/api/site', {
    method: 'POST',
    body: JSON.stringify(state.site),
    headers: { 'Content-Type': 'application/json' }
  });
  await loadAll();

  const btn = document.getElementById('btn-save-home-projects') || document.querySelector('button[onclick="saveHomeProjects()"]');
  if (btn) {
    const origText = btn.innerHTML;
    btn.innerHTML = 'ذخیره شد ✓';
    btn.classList.add('ok');
    setTimeout(() => {
      btn.innerHTML = origText;
      btn.classList.remove('ok');
    }, 2000);
  }
}
