import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { loadAll, loadMedia } from '../core/data.js';
import { show, render } from '../core/router.js';
import { val } from '../utils/helpers.js';

export function renderProjects() {
  dom.content.innerHTML = `
    <div style="margin-bottom:24px">
        <h2 style="margin-bottom:4px">پروژه‌ها</h2>
        <p class="sub" style="margin-bottom:0">مدیریت نمونه‌کارها و پروژه‌ها.</p>
      </div>
    <button class="btn" style="margin-bottom:24px" onclick="newProject()">+ ایجاد پروژه جدید</button>
    <div class="grid2">
      ${state.projects.map((p) => `
        <div class="card" style="display:flex; flex-direction:column; padding:0; overflow:hidden">
          <div style="height:140px; background:var(--card); position:relative">
             ${p.cover ? `<img src="${p.cover}" style="width:100%; height:100%; object-fit:cover">` : '<div style="display:flex; height:100%; align-items:center; justify-content:center; color:#9ba6b5">بدون تصویر</div>'}
             <span class="tag" style="position:absolute; top:8px; right:8px; background:rgba(23, 48, 59, 0.9)">${p.template === 'video' ? 'ویدیو' : 'تصویر'}</span>
          </div>
          <div style="padding:16px; flex:1; display:flex; flex-direction:column">
            <h3 style="margin-bottom:8px; font-size:1.1rem">${p.title || '(بدون عنوان)'}</h3>
            <p style="color:#9ba6b5; font-size:0.85rem; margin-bottom:16px; flex:1; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden">${p.description || 'بدون توضیح'}</p>
            <div class="row" style="margin-top:auto">
              <button class="btn sec" style="flex:1; justify-content:center" onclick="editProject('${p.slug}')">ویرایش</button>
              <button class="btn sec" style="padding:10px" onclick="duplicateProject('${p.slug}')" title="کپی">${icon('copy')}</button>
              <button class="btn danger" style="padding:10px" onclick="deleteProject('${p.slug}')" title="حذف">${icon('trash')}</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export function newProject() { state.editingProject = { title: '', slug: '', description: '', content: '', cover: '', year: '', client: '', categories: [], images: [], template: 'image', videoUrl: '' }; show('project-edit', false); render(); }

export function editProject(slug) {
  const p = state.projects.find((p) => p.slug === slug);
  state.editingProject = JSON.parse(JSON.stringify(p));
  state.editingProject.originalSlug = slug;
  show('project-edit', false);
  render();
}


export async function duplicateProject(slug) {
  const p = state.projects.find((x) => x.slug === slug);
  const copy = JSON.parse(JSON.stringify(p));
  delete copy.originalSlug;
  copy.slug = copy.slug + '-' + Math.floor(Math.random() * 10000);
  copy.title = copy.title + ' (کپی)';
  await api('/api/projects', { method: 'POST', body: JSON.stringify(copy), headers: { 'Content-Type': 'application/json' } });
  await loadAll();
  show('projects');
}

export async function deleteProject(slug) { if (!confirm('حذف شود؟')) return; await api('/api/projects', { method: 'DELETE', body: JSON.stringify({ slug }), headers: { 'Content-Type': 'application/json' } }); await loadAll(); show('projects'); }

export function renderProjectEdit() {
  const p = state.editingProject;

  const selectedCats = state.categories.filter(c => c.type !== 'posts').filter(c => p.categories.includes(c.slug));
  const unselectedCats = state.categories.filter(c => c.type !== 'posts').filter(c => !p.categories.includes(c.slug));


  const imagesHtml = (p.template === 'image' && p.images && p.images.length) ? p.images.map((img, idx) => `
    <div style="display:flex; align-items:center; gap:8px; background:var(--card); padding:8px; border:1px solid var(--border); border-radius:8px; margin-bottom:8px;" draggable="true" ondragstart="event.dataTransfer.setData('text/plain', ${idx})" ondragover="event.preventDefault()" ondrop="event.preventDefault(); window.reorderProjectImage(${idx}, event.dataTransfer.getData('text/plain'))">
      <div style="cursor:grab; opacity:0.5">${icon('move_small')}</div>
      <img src="${img}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
      <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; direction:ltr; text-align:left; font-size:0.8rem;">${img}</div>
      <button class="btn sec" style="padding:4px 8px; color:var(--error); border-color:var(--error);" onclick="window.removeProjectImage(${idx})">${icon('trash')}</button>
    </div>
  `).join('') : '';

  const catsHtml = `
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">
      ${selectedCats.map(c => `<span class="tag">${c.name} <span style="cursor:pointer;color:#ef4444;margin-inline-start:4px" onclick="toggleProjectCat('${c.slug}', false)">×</span></span>`).join('')}
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap">
      ${unselectedCats.map(c => `<button class="btn sec" style="padding:4px 8px;font-size:0.8rem" onclick="toggleProjectCat('${c.slug}', true)">+ ${c.name}</button>`).join('')}
    </div>
  `;

  dom.content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
      <h2>${p.slug ? 'ویرایش پروژه' : 'پروژه جدید'}</h2>
    </div>
    <div style="display:grid; grid-template-columns: 1fr 320px; gap: 24px;">
      <div>
        <div class="card">
          <div class="grid2">
            <div><label>عنوان</label><input id="f-title" value="${p.title || ''}"></div>
            <div><label>شناسه (slug)</label><input id="f-slug" value="${p.slug || ''}"></div>
          </div>
          <label>توضیح کوتاه</label><input id="f-description" value="${p.description || ''}">
          <div class="grid2" style="margin-top:12px">
            <div><label>سال</label><input id="f-year" value="${p.year || ''}"></div>
            <div><label>کارفرما</label><input id="f-client" value="${p.client || ''}"></div>
          </div>
          <div style="margin-top:12px"><label>تاریخ (اختیاری)</label><input id="f-date" type="text" placeholder="YYYY-MM-DD" value="${p.date || ''}" style="direction:ltr; text-align:left"></div>

          <label style="margin-top:12px">محتوای کامل (Markdown)</label>
          <textarea id="f-content" style="min-height:300px">${p.content || ''}</textarea>
        </div>
      </div>

      <aside>
        <div class="card" style="position:sticky; top:24px;">
          <div class="row" style="margin-bottom:16px">
            <button class="btn" onclick="saveProject()" style="flex:1; justify-content:center">ذخیره</button>
            <button class="btn sec" onclick="show('projects')" style="flex:1; justify-content:center">انصراف</button>
          </div>

          <div style="margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid #263243">
            <label style="margin-top:0">قالب پروژه</label>
            <select id="f-template" onchange="onTemplateChange(this.value)">
              <option value="image" ${p.template !== 'video' ? 'selected' : ''}>تصویری</option>
              <option value="video" ${p.template === 'video' ? 'selected' : ''}>ویدئویی</option>
            </select>
            ${p.template === 'video' ? `
              <label style="margin-top:12px">منبع ویدئو</label>
              <select id="f-videoSource" onchange="onVideoSourceChange(this.value)">
                <option value="host" ${p.videoSource === 'host' || !p.videoSource ? 'selected' : ''}>هاست شخصی (MP4)</option>
                <option value="youtube" ${p.videoSource === 'youtube' ? 'selected' : ''}>یوتیوب</option>
                <option value="aparat" ${p.videoSource === 'aparat' ? 'selected' : ''}>آپارات / iframe</option>
                <option value="embed" ${p.videoSource === 'embed' ? 'selected' : ''}>کد امبد (Embed)</option>
              </select>
              ${p.videoSource === 'embed' ?
                `<label style="margin-top:12px">کد امبد</label><textarea id="f-videoUrl" style="min-height:100px;font-family:monospace;direction:ltr;text-align:left" onchange="state.editingProject.videoUrl=this.value">${p.videoUrl || ''}</textarea>`
                :
                `<label style="margin-top:12px">لینک ویدئو</label><input id="f-videoUrl" style="direction:ltr;text-align:left" value="${p.videoUrl || ''}" onchange="state.editingProject.videoUrl=this.value">`
              }
            ` : ''}
            ${p.template === 'image' ? `
              <div style="margin-top:16px;">
                <label>تصاویر پروژه</label>
                <div id="project-images-list" style="margin-bottom:8px;">${imagesHtml}</div>
                <button class="btn sec" style="width:100%; justify-content:center" onclick="window.openProjectImagePicker()">انتخاب تصویر</button>
              </div>
            ` : ''}

          </div>

          <div style="margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid #263243">
            <label style="margin-top:0">دسته‌ها</label>
            <div>${catsHtml}</div>
          </div>

          <div>
            <label style="margin-top:0">تصویر بند انگشتی</label>
            <div id="cover-preview" style="margin-bottom:8px">${p.cover ? `<img src="${p.cover}" class="preview" style="width:100%; max-width:100%; height:auto">` : ''}</div>
            <div class="row">
              <input id="f-cover" value="${p.cover || ''}" style="display:none">
              <button class="btn sec" style="width:100%; justify-content:center" onclick="openProjectCoverPickerModal()">انتخاب تصویر</button>
            </div>
          </div>
        </div>
      </aside>
    </div>`;
}


export function openCoverPickerModal() {
  window.openMediaModal((selected) => {
    selectCover(selected);
  });
}



export function selectCover(path) {
  if (!state.editingProject) return;
  const fCover = document.getElementById('f-cover');
  if(fCover) fCover.value = path;
  state.editingProject.cover = path;
  const preview = document.getElementById('cover-preview');
  if(preview) preview.innerHTML = `<img src="${path}" class="preview" style="width:100%; max-width:100%; height:auto">`;
}




export function syncEditingProject() {
  state.editingProject.title = val('f-title');
  state.editingProject.slug = val('f-slug');
  state.editingProject.description = val('f-description');
  state.editingProject.cover = val('f-cover');
  state.editingProject.year = val('f-year');
  state.editingProject.client = val('f-client');
  state.editingProject.date = val('f-date');
  state.editingProject.content = val('f-content');
  const videoSourceEl = document.getElementById('f-videoSource');
  if (videoSourceEl) state.editingProject.videoSource = videoSourceEl.value;
  const videoUrlEl = document.getElementById('f-videoUrl');
  if (videoUrlEl) state.editingProject.videoUrl = videoUrlEl.value;
}

export function toggleProjectCat(slug, checked) {
  syncEditingProject();
  if (checked) state.editingProject.categories.push(slug);
  else state.editingProject.categories = state.editingProject.categories.filter((c) => c !== slug);
  renderProjectEdit();
}

export function onTemplateChange(value) {
  syncEditingProject();
  state.editingProject.template = value;
  renderProjectEdit();
}

export function onVideoSourceChange(value) {
  syncEditingProject();
  state.editingProject.videoSource = value;
  renderProjectEdit();
}

export async function saveProject() {
  const videoSourceEl = document.getElementById('f-videoSource');
  const videoUrlEl = document.getElementById('f-videoUrl');
  const data = {
    ...state.editingProject,
    title: val('f-title'), slug: val('f-slug'), description: val('f-description'), cover: val('f-cover'),
    year: val('f-year'), client: val('f-client'), date: val('f-date'),
    template: val('f-template'),
    videoSource: videoSourceEl ? videoSourceEl.value : (state.editingProject.videoSource || 'host'),
    videoUrl: videoUrlEl ? videoUrlEl.value : (state.editingProject.videoUrl || ''),
    content: val('f-content'), images: state.editingProject.images || [], originalSlug: state.editingProject.originalSlug,
  };
  await api('/api/projects', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
  await loadAll();

  state.editingProject = state.projects.find(p => p.slug === data.slug) || data;
  state.editingProject.originalSlug = data.slug;
  renderProjectEdit();

  const btn = document.querySelector('button[onclick="saveProject()"]');
  if (btn) {
    const origText = btn.innerHTML;
    btn.innerHTML = 'ذخیره شد ✓';
    btn.classList.add('ok');
    setTimeout(() => { btn.innerHTML = origText; btn.classList.remove('ok'); }, 2000);
  }
}

export function openProjectImagePicker() {
  window.openMediaModal((selected) => {
    if (!state.editingProject.images) state.editingProject.images = [];
    if (Array.isArray(selected)) {
      state.editingProject.images.push(...selected);
    } else if (selected) {
      state.editingProject.images.push(selected);
    }
    // Remove duplicates
    state.editingProject.images = [...new Set(state.editingProject.images)];
    renderProjectEdit();
  }); // Use default single mode
};

export function removeProjectImage(index) {
  if (state.editingProject.images && state.editingProject.images.length > index) {
    state.editingProject.images.splice(index, 1);
    renderProjectEdit();
  }
};

export function reorderProjectImage(toIndex, fromIndexStr) {
  const fromIndex = parseInt(fromIndexStr, 10);
  if (isNaN(fromIndex) || fromIndex === toIndex || !state.editingProject.images) return;

  const img = state.editingProject.images.splice(fromIndex, 1)[0];
  state.editingProject.images.splice(toIndex, 0, img);
  renderProjectEdit();
};
