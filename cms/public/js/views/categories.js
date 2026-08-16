import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { loadAll } from '../core/data.js';
import { val, showMsg } from '../utils/helpers.js';


export function switchCatType(type) {
  state.currentCatType = type;
  renderCategories();
}

export function renderCategories() {
  state.currentCatType = 'projects';
  let currentCatType = state.currentCatType || 'projects';
  dom.content.innerHTML = `
    <div style="margin-bottom:24px">
        <h2 style="margin-bottom:4px">دسته‌های پروژه‌ها</h2>
        <p class="sub" style="margin-bottom:16px">مدیریت ساختار درختی دسته‌بندی‌ها.</p>

    </div>
    <button class="btn" style="margin-bottom:24px" onclick="openCatModal()">+ ایجاد دسته جدید</button>
    <div id="cat-list" style="max-width: 600px;"></div>`;
  renderCatList();

}

function renderCatNode(c, i, depth = 0, isLast = false) {
  const children = state.categories.filter(child => child.parent === c.slug);
  const indent = depth * 28;

  const connector = depth > 0 ? `
    <div style="
      position:absolute;
      right:${indent - 20}px;
      top:50%;
      width:16px;
      height:0;
      border-top:1px solid var(--border);
    "></div>` : '';

  let html = `
    <div style="position:relative; margin-bottom:6px;">
      ${connector}
      <div
        style="
          margin-right:${indent}px;
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:7px 12px;
          border-radius:8px;
          border:1px solid var(--border);
          background:var(--card);
          cursor:pointer;
          transition:border-color .15s, background .15s;
          min-width:160px;
        "
        onmouseenter="this.style.borderColor='var(--primary)'; this.style.background='var(--card-hover)'"
        onmouseleave="this.style.borderColor='var(--border)'; this.style.background='var(--card)'"
        onclick="openCatModal(${i})"
      >
        ${icon('chevron_right')}
        <span style="color:var(--foreground); font-size:.9rem">${c.name || '(بدون نام)'}</span>
      </div>
    </div>`;

  if (children.length > 0) {
    const railRight = indent + 8;
    html += `<div style="position:relative; margin-bottom:2px;">
      <div style="
        position:absolute;
        right:${railRight}px;
        top:0;
        bottom:6px;
        width:0;
        border-right:1px solid var(--border);
      "></div>`;
    children.forEach((child, ci) => {
      const childIndex = state.categories.findIndex(cat => cat.slug === child.slug);
      html += renderCatNode(child, childIndex, depth + 1, ci === children.length - 1);
    });
    html += `</div>`;
  }

  return html;
}

export function renderCatList() {
  const list = document.getElementById('cat-list');
  if (!list) return;
  list.innerHTML = '';

  const rootCats = state.categories.filter(c => !c.parent && c.type === (state.currentCatType || 'projects'));
  if (rootCats.length === 0) {
    list.innerHTML = '<p class="sub">هنوز دسته‌ای ایجاد نشده است.</p>';
    return;
  }

  let html = '<div style="padding-top:4px;">';
  rootCats.forEach((c, ri) => {
    const i = state.categories.findIndex(cat => cat.slug === c.slug);
    html += renderCatNode(c, i, 0, ri === rootCats.length - 1);
  });
  html += '</div>';
  list.innerHTML = html;
}

export function openCatModal(index = -1) {
  const isEdit = index > -1;
  const c = isEdit ? state.categories[index] : { name: '', slug: '', parent: '', type: state.currentCatType || 'projects' };
  const m = document.createElement('div');
  m.className = 'modal-overlay';

  let parentOptions = '<option value="">(بدون والد - ریشه)</option>';
  state.categories.filter(c => c.type === (state.currentCatType || 'projects')).forEach(cat => {
    if (isEdit && cat.slug === c.slug) return;
    parentOptions += `<option value="${cat.slug}" ${c.parent === cat.slug ? 'selected' : ''}>${cat.name}</option>`;
  });

  const delBtnHtml = isEdit ? `<button class="btn danger" style="margin-right:auto;" onclick="deleteCat(${index}); this.parentElement.parentElement.parentElement.remove()">حذف</button>` : '';

  m.innerHTML = `
    <div class="modal-content" style="max-width:400px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
        <h3 style="margin:0">${isEdit ? 'ویرایش دسته' : 'ایجاد دسته جدید'}</h3>
        <button class="modal-close" style="color:var(--foreground); margin:0" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
      </div>

      <div style="margin-bottom:16px">
        <label style="margin-top:0">نام دسته</label>
        <input type="text" id="cat-name" value="${c.name}" ${!isEdit ? ' ' : ''}>
      </div>
      <div style="margin-bottom:16px">
        <label style="margin-top:0">شناسه (URL Slug)</label>
        <input type="text" id="cat-slug" value="${c.slug}" dir="ltr">
        <input type="hidden" id="cat-original-slug" value="${c.slug}">
      </div>
      <div style="margin-bottom:24px">
        <label style="margin-top:0">دسته والد</label>
        <select id="cat-parent">${parentOptions}</select>
      </div>

      <div style="display:flex; gap:12px; align-items:center;">
        <button class="btn" onclick="saveCat(${index}, this.parentElement.parentElement.parentElement)">ذخیره دسته</button>
        ${delBtnHtml}
      </div>
    </div>
  `;
  document.body.appendChild(m);
}

export async function saveCat(index, modalNode) {
  const name = val('cat-name'), slug = val('cat-slug'), parent = val('cat-parent');
  const type = state.currentCatType || 'projects';
  const originalSlug = val('cat-original-slug');
  if (!name || !slug) return showMsg('نام و شناسه الزامی است', true);

  if (index === -1) {
    if (state.categories.find(c => c.slug === slug)) return showMsg('این شناسه قبلاً استفاده شده است', true);
    state.categories.push({ name, slug, parent, type, sort: 999 });
  } else {
    state.categories[index] = { ...state.categories[index], name, slug, parent, originalSlug };
  }

  try {
    await saveCategories();
    await loadAll();
    modalNode.remove();
    showMsg('دسته با موفقیت ذخیره شد');
    if (state.currentCatType === 'posts') renderPostCategories(); else renderCategories();
  } catch(e) {
    showMsg('خطا در ذخیره دسته', true);
  }
}

export async function deleteCat(i) {
  if(confirm('حذف شود؟ با حذف این دسته، تمامی زیردسته‌های آن نیز حذف خواهند شد.')) {
    const deletedSlug = state.categories[i].slug;

    let toDelete = new Set([deletedSlug]);
    let added = true;
    while(added) {
      added = false;
      state.categories.forEach(c => {
        if(toDelete.has(c.parent) && !toDelete.has(c.slug)) {
          toDelete.add(c.slug);
          added = true;
        }
      });
    }

    const newCategories = state.categories.filter(c => !toDelete.has(c.slug));

    for (const project of state.projects) {
      if (project.categories && project.categories.some(c => toDelete.has(c))) {
        project.categories = project.categories.filter(c => !toDelete.has(c));
        await api('/api/projects', { method: 'POST', body: JSON.stringify(project), headers: { 'Content-Type': 'application/json' } });
      }
    }

    for (const post of state.posts) {
      if (post.categories && post.categories.some(c => toDelete.has(c))) {
        post.categories = post.categories.filter(c => !toDelete.has(c));
        await api('/api/posts', { method: 'POST', body: JSON.stringify(post), headers: { 'Content-Type': 'application/json' } });
      }
    }

    state.categories.length = 0;
    state.categories.push(...newCategories);

    renderCatList();
    saveCategories();
  }
}

export async function saveCategories() {
  const data = {
    projects: state.categories.filter(c => c.type === 'projects').map(c => ({ name: c.name, slug: c.slug, parent: c.parent || null, sort: c.sort || 999 })),
    posts: state.categories.filter(c => c.type === 'posts').map(c => ({ name: c.name, slug: c.slug, parent: c.parent || null, sort: c.sort || 999 }))
  };
  await api('/api/categories', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
}


export function renderPostCategories() {
  state.currentCatType = 'posts';
  dom.content.innerHTML = `
    <div style="margin-bottom:24px">
        <h2 style="margin-bottom:4px">دسته‌های پست‌ها</h2>
        <p class="sub" style="margin-bottom:16px">مدیریت ساختار درختی دسته‌بندی‌ها.</p>
    </div>
    <button class="btn" style="margin-bottom:24px" onclick="openCatModal()">+ ایجاد دسته جدید</button>
    <div id="cat-list" style="max-width: 600px;"></div>`;
  renderCatList();
}
