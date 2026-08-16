import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { loadAll, loadMedia } from '../core/data.js';
import { show, render } from '../core/router.js';
import { val } from '../utils/helpers.js';

export function renderPosts() {
  dom.content.innerHTML = `
    <div style="margin-bottom:24px">
        <h2 style="margin-bottom:4px">پست‌ها</h2>
        <p class="sub" style="margin-bottom:0">مدیریت نمونه‌کارها و پست‌ها.</p>
      </div>
    <button class="btn" style="margin-bottom:24px" onclick="newPost()">+ ایجاد پست جدید</button>
    <div class="grid2">
      ${state.posts.map((p) => `
        <div class="card" style="display:flex; flex-direction:column; padding:0; overflow:hidden">
          <div style="height:140px; background:var(--card); position:relative">
             ${p.cover ? `<img src="${p.cover}" style="width:100%; height:100%; object-fit:cover">` : '<div style="display:flex; height:100%; align-items:center; justify-content:center; color:#9ba6b5">بدون تصویر</div>'}
             <span class="tag" style="position:absolute; top:8px; right:8px; background:rgba(23, 48, 59, 0.9)">${p.template === 'video' ? 'ویدیو' : 'تصویر'}</span>
          </div>
          <div style="padding:16px; flex:1; display:flex; flex-direction:column">
            <h3 style="margin-bottom:8px; font-size:1.1rem">${p.title || '(بدون عنوان)'}</h3>
            <p style="color:#9ba6b5; font-size:0.85rem; margin-bottom:16px; flex:1; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden">${p.description || 'بدون توضیح'}</p>
            <div class="row" style="margin-top:auto">
              <button class="btn sec" style="flex:1; justify-content:center" onclick="editPost('${p.slug}')">ویرایش</button>
              <button class="btn sec" style="padding:10px" onclick="duplicatePost('${p.slug}')" title="کپی">${icon('copy')}</button>
              <button class="btn danger" style="padding:10px" onclick="deletePost('${p.slug}')" title="حذف">${icon('trash')}</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export function newPost() { state.editingPost = { title: '', slug: '', description: '', content: '', cover: '', categories: [], images: [], template: 'image', videoUrl: '' }; show('post-edit', false); render(); }

export function editPost(slug) {
  const p = state.posts.find((p) => p.slug === slug);
  state.editingPost = JSON.parse(JSON.stringify(p));
  state.editingPost.originalSlug = slug;
  show('post-edit', false);
  render();
}


export async function duplicatePost(slug) {
  const p = state.posts.find((x) => x.slug === slug);
  const copy = JSON.parse(JSON.stringify(p));
  delete copy.originalSlug;
  copy.slug = copy.slug + '-' + Math.floor(Math.random() * 10000);
  copy.title = copy.title + ' (کپی)';
  await api('/api/posts', { method: 'POST', body: JSON.stringify(copy), headers: { 'Content-Type': 'application/json' } });
  await loadAll();
  show('posts');
}

export async function deletePost(slug) { if (!confirm('حذف شود؟')) return; await api('/api/posts', { method: 'DELETE', body: JSON.stringify({ slug }), headers: { 'Content-Type': 'application/json' } }); await loadAll(); show('posts'); }

export function renderPostEdit() {

  const p = state.editingPost;

  const selectedCats = state.categories.filter(c => c.type === 'posts').filter(c => p.categories.includes(c.slug));
  const unselectedCats = state.categories.filter(c => c.type === 'posts').filter(c => !p.categories.includes(c.slug));


  const imagesHtml = (p.template === 'image' && p.images && p.images.length) ? p.images.map((img, idx) => `
    <div style="display:flex; align-items:center; gap:8px; background:var(--card); padding:8px; border:1px solid var(--border); border-radius:8px; margin-bottom:8px;" draggable="true" ondragstart="event.dataTransfer.setData('text/plain', ${idx})" ondragover="event.preventDefault()" ondrop="event.preventDefault(); window.reorderPostImage(${idx}, event.dataTransfer.getData('text/plain'))">
      <div style="cursor:grab; opacity:0.5">${icon('move_small')}</div>
      <img src="${img}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
      <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; direction:ltr; text-align:left; font-size:0.8rem;">${img}</div>
      <button class="btn sec" style="padding:4px 8px; color:var(--error); border-color:var(--error);" onclick="window.removePostImage(${idx})">${icon('trash')}</button>
    </div>
  `).join('') : '';


  let secondImagesHtml = p.images && p.images.length ? p.images.map((img, idx) => `
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; background:var(--card); padding:8px; border-radius:8px; border:1px solid var(--border);" draggable="true" ondragstart="event.dataTransfer.setData('text/plain', '${idx}')" ondragover="event.preventDefault()" ondrop="event.preventDefault(); window.reorderPostImage(${idx}, event.dataTransfer.getData('text/plain'))">
      <div style="cursor:grab; opacity:0.5">${icon('move_small')}</div>
      <img src="${img}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
      <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; direction:ltr; text-align:left; font-size:0.8rem;">${img}</div>
      <button class="btn sec" style="padding:4px 8px; color:var(--error); border-color:var(--error);" onclick="window.removePostImage(${idx})">${icon('trash')}</button>
    </div>
  `).join('') : '';

  const catsHtml = `
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">
      ${selectedCats.map(c => `<span class="tag">${c.name} <span style="cursor:pointer;color:#ef4444;margin-inline-start:4px" onclick="togglePostCat('${c.slug}', false)">×</span></span>`).join('')}
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap">
      ${unselectedCats.map(c => `<button class="btn sec" style="padding:4px 8px;font-size:0.8rem" onclick="togglePostCat('${c.slug}', true)">+ ${c.name}</button>`).join('')}
    </div>
  `;



  dom.content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
      <h2 style="margin:0">${p.originalSlug ? 'ویرایش پست' : 'پست جدید'}</h2>
      <button class="btn sec" onclick="show('posts')">بازگشت</button>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 320px; gap: 24px;">
      <div>
        <div class="card" style="margin-bottom:16px">
          <label style="margin-top:0">عنوان پست</label>
          <input id="f-title" value="${p.title || ''}" >
          <label style="margin-top:12px">نامک (Slug)</label>
          <input id="f-slug" value="${p.slug || ''}" style="direction:ltr; text-align:left">
          <label style="margin-top:12px">توضیحات کوتاه</label>
          <textarea id="f-description" style="min-height:80px">${p.description || ''}</textarea>
          <label style="margin-top:12px">تاریخ (اختیاری)</label>
          <input id="f-date" type="text" placeholder="YYYY-MM-DD" value="${p.date || ''}" style="direction:ltr; text-align:left">
        </div>
        <div class="card">
          <label style="margin-top:12px">محتوای کامل (Markdown)</label>
          <textarea id="f-content" style="min-height:300px" >${p.content || ''}</textarea>
        </div>
      </div>

      <aside>
        <div class="card" style="position:sticky; top:24px;">
          <div class="row" style="margin-bottom:16px">
            <button class="btn" onclick="savePost()" style="flex:1; justify-content:center">ذخیره</button>
            <button class="btn sec" onclick="show('posts')" style="flex:1; justify-content:center">انصراف</button>
          </div>

          <div style="margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid #263243">
            <label style="margin-top:0">قالب پست</label>
            <select id="f-template" onchange="onPostTemplateChange(this.value)">
              <option value="image" ${p.template !== 'video' ? 'selected' : ''}>تصویری</option>
              <option value="video" ${p.template === 'video' ? 'selected' : ''}>ویدئویی</option>
            </select>
            ${p.template === 'video' ? `
              <label style="margin-top:12px">منبع ویدئو</label>
              <select id="f-videoSource" onchange="onPostVideoSourceChange(this.value)">
                <option value="host" ${p.videoSource === 'host' || !p.videoSource ? 'selected' : ''}>هاست شخصی (MP4)</option>
                <option value="youtube" ${p.videoSource === 'youtube' ? 'selected' : ''}>یوتیوب</option>
                <option value="aparat" ${p.videoSource === 'aparat' ? 'selected' : ''}>آپارات / iframe</option>
                <option value="embed" ${p.videoSource === 'embed' ? 'selected' : ''}>کد امبد (Embed)</option>
              </select>
              ${p.videoSource === 'embed' ?
                `<label style="margin-top:12px">کد امبد</label><textarea id="f-videoUrl" style="min-height:100px;font-family:monospace;direction:ltr;text-align:left" onchange="state.editingPost.videoUrl=this.value">${p.videoUrl || ''}</textarea>`
                :
                `<label style="margin-top:12px">لینک ویدئو</label><input id="f-videoUrl" style="direction:ltr;text-align:left" value="${p.videoUrl || ''}" onchange="state.editingPost.videoUrl=this.value">`
              }
            ` : ''}
            ${p.template === 'image' ? `
              <div style="margin-top:16px;">
                <label>تصاویر پست</label>
                <div id="post-images-list" style="margin-bottom:8px;">${secondImagesHtml}</div>
                <button class="btn sec" style="width:100%; justify-content:center" onclick="window.openPostImagePicker()">انتخاب تصویر</button>
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
              <button class="btn sec" style="width:100%; justify-content:center" onclick="openPostCoverPickerModal()">انتخاب تصویر</button>
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
  if (!state.editingPost) return;
  const fCover = document.getElementById('f-cover');
  if(fCover) fCover.value = path;
  state.editingPost.cover = path;
  const preview = document.getElementById('cover-preview');
  if(preview) preview.innerHTML = `<img src="${path}" class="preview" style="width:100%; max-width:100%; height:auto">`;
}




export function syncEditingPost() {
  state.editingPost.title = val('f-title');
  state.editingPost.slug = val('f-slug');
  state.editingPost.description = val('f-description');
  state.editingPost.date = val('f-date');
  state.editingPost.cover = val('f-cover');
  state.editingPost.content = val('f-content');
  const videoSourceEl = document.getElementById('f-videoSource');
  if (videoSourceEl) state.editingPost.videoSource = videoSourceEl.value;
  const videoUrlEl = document.getElementById('f-videoUrl');
  if (videoUrlEl) state.editingPost.videoUrl = videoUrlEl.value;
  const templateEl = document.getElementById('f-template');
  if (templateEl) state.editingPost.template = templateEl.value;
}



export function togglePostCat(slug, checked) {
  syncEditingPost();
  if (checked) state.editingPost.categories.push(slug);
  else state.editingPost.categories = state.editingPost.categories.filter((c) => c !== slug);
  renderPostEdit();
}

export async function savePost() {
  const data = {
    ...state.editingPost,
    title: val('f-title'), slug: val('f-slug'), description: val('f-description'), cover: val('f-cover'), date: val('f-date'),
    content: val('f-content'),
    images: state.editingPost.images || [],
    template: val('f-template') || 'image',
    videoSource: document.getElementById('f-videoSource') ? document.getElementById('f-videoSource').value : (state.editingPost.videoSource || 'host'),
    videoUrl: document.getElementById('f-videoUrl') ? document.getElementById('f-videoUrl').value : (state.editingPost.videoUrl || ''),
    originalSlug: state.editingPost.originalSlug,
  };
  await api('/api/posts', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
  await loadAll();

  state.editingPost = state.posts.find(p => p.slug === data.slug) || data;
  state.editingPost.originalSlug = data.slug;
  renderPostEdit();

  const btn = document.querySelector('button[onclick="savePost()"]');
  if (btn) {
    const origText = btn.innerHTML;
    btn.innerHTML = 'ذخیره شد ✓';
    btn.classList.add('ok');
    setTimeout(() => { btn.innerHTML = origText; btn.classList.remove('ok'); }, 2000);
  }
}


export function onPostTemplateChange(value) {
  syncEditingPost();
  state.editingPost.template = value;
  renderPostEdit();
}

export function onPostVideoSourceChange(value) {
  syncEditingPost();
  state.editingPost.videoSource = value;
  renderPostEdit();
}

export function openPostImagePicker() {
  window.openMediaModal((selected) => {
    if (!state.editingPost.images) state.editingPost.images = [];
    if (Array.isArray(selected)) {
      state.editingPost.images.push(...selected);
    } else if (selected) {
      state.editingPost.images.push(selected);
    }
    state.editingPost.images = [...new Set(state.editingPost.images)];
    renderPostEdit();
  });
};

export function removePostImage(index) {
  if (state.editingPost.images && state.editingPost.images.length > index) {
    state.editingPost.images.splice(index, 1);
    renderPostEdit();
  }
};

export function reorderPostImage(toIndex, fromIndexStr) {
  const fromIndex = parseInt(fromIndexStr, 10);
  if (isNaN(fromIndex) || fromIndex === toIndex || !state.editingPost.images) return;
  const img = state.editingPost.images.splice(fromIndex, 1)[0];
  state.editingPost.images.splice(toIndex, 0, img);
  renderPostEdit();
};
