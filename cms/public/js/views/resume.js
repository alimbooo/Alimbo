import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { loadAll } from '../core/data.js';
import { show } from '../core/router.js';
import { val } from '../utils/helpers.js';
import { icon } from '../icons.js';

export function renderResume() {
  dom.content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
      <div>
        <h2 style="margin-bottom:4px">رزومه</h2>
        <p class="sub" style="margin-bottom:0">اطلاعات رزومه خود را ویرایش و ذخیره کنید.</p>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 320px; gap:24px;">
      <div>
        <div class="card" style="padding:24px">
          <h3 style="margin-bottom:16px; color:var(--primary)">اطلاعات کلی و مهارت‌ها</h3>
          <label style="margin-top:0">خلاصه (درباره من در رزومه)</label>
          <textarea id="r-summary" style="min-height:100px; margin-bottom:16px">${state.resume.summary || ''}</textarea>

          <div class="grid2">
            <div><label style="margin-top:0">مهارت‌های اصلی (با کاما جدا کنید)</label><input id="r-skills" value="${(state.resume.skills || []).join(', ')}"></div>
            <div><label style="margin-top:0">ابزارها و فناوری‌ها (با کاما)</label><input id="r-tools" value="${(state.resume.tools || []).join(', ')}"></div>
          </div>
        </div>

        <div class="card" style="padding:24px">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
            <div>
              <h3 style="color:var(--primary); margin:0">زبان‌ها</h3>
              <p class="sub" style="margin:4px 0 0 0; font-size:0.85rem">زبان‌های مسلط یا آشنایی خود را همراه با سطح تسلط اضافه کنید.</p>
            </div>
            <button class="btn sec" style="padding:6px 12px; font-size:0.85rem" onclick="addLang()">+ افزودن زبان</button>
          </div>
          <div id="r-langs-list" style="display:flex; flex-direction:column; gap:10px"></div>
        </div>

        <div class="card" style="padding:24px">
          <h3 style="margin-bottom:16px; color:var(--primary)">اطلاعات شخصی و تماس</h3>
          <div class="grid2">
            <div><label style="margin-top:0">لوکیشن</label><input id="r-location" value="${state.resume.location || ''}"></div>
            <div><label style="margin-top:0">وضعیت تاهل</label><input id="r-marital" value="${state.resume.maritalStatus || ''}"></div>
            <div><label style="margin-top:0">وضعیت سربازی</label><input id="r-military" value="${state.resume.militaryService || ''}"></div>
            <div><label style="margin-top:0">تاریخ تولد</label><input id="r-birth" value="${state.resume.birthDate || ''}"></div>
            <div><label style="margin-top:0">شماره تماس</label><input id="r-phone" value="${state.resume.phone || ''}" dir="ltr"></div>
            <div><label style="margin-top:0">ایمیل</label><input id="r-email" value="${state.resume.email || ''}" dir="ltr"></div>
          </div>
          <hr>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
            <h4 style="margin:0; color:var(--muted)">لینک‌ها</h4>
            <button class="btn sec" style="padding:4px 8px; font-size:0.8rem" onclick="addLink()">+ افزودن لینک</button>
          </div>
          <div id="r-links" style="display:flex; flex-direction:column; gap:12px"></div>
        </div>

        <div class="card" style="padding:24px">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
            <div>
              <h3 style="color:var(--primary); margin:0">سوابق شغلی و تجربه‌ها</h3>
              <p class="sub" style="margin:4px 0 0 0; font-size:0.85rem">می‌توانید با دکمه‌های بالاتر و پایین‌تر یا کشیدن، ترتیب موارد را تغییر دهید.</p>
            </div>
            <button class="btn sec" onclick="addExp()">+ افزودن تجربه جدید</button>
          </div>
          <div id="r-exp" style="display:flex; flex-direction:column; gap:16px"></div>
        </div>

        <div class="card" style="padding:24px">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
            <div>
              <h3 style="color:var(--primary); margin:0">سوابق تحصیلی</h3>
              <p class="sub" style="margin:4px 0 0 0; font-size:0.85rem">سوابق تحصیلی و دانشگاهی خود را مدیریت کنید.</p>
            </div>
            <button class="btn sec" onclick="addEdu()">+ افزودن تحصیلات جدید</button>
          </div>
          <div id="r-edu" style="display:flex; flex-direction:column; gap:16px"></div>
        </div>
      </div>

      <aside>
        <div style="position:sticky; top:24px; padding:16px; border-radius:12px; background:var(--card); border:1px solid var(--border); box-shadow:0 1px 2px rgba(0,0,0,0.05)">
          <div style="display:flex; flex-direction:column; gap:12px">
            <button class="btn" onclick="saveResume()" style="width:100%; justify-content:center; padding:12px">ذخیره</button>
            <button class="btn sec" onclick="cancelResume()" style="width:100%; justify-content:center; padding:12px">انصراف</button>
          </div>
        </div>
      </aside>
    </div>
  `;
  renderLangs();
  renderExp();
  renderEdu();
  renderLinks();
}

// ------------------- LANGUAGES -------------------
export function syncLangs() {
  const container = document.getElementById('r-langs-list');
  if (!container) return;
  const inputs = container.querySelectorAll('.r-lang-input');
  state.resume.languages = Array.from(inputs).map(inp => inp.value);
}

export function renderLangs() {
  const container = document.getElementById('r-langs-list');
  if (!container) return;
  const list = state.resume.languages || [];

  if (list.length === 0) {
    container.innerHTML = '<p style="color:var(--muted); font-size:0.9rem">هیچ زبانی ثبت نشده است. برای افزودن، دکمه «+ افزودن زبان» را بزنید.</p>';
    return;
  }

  container.innerHTML = list.map((lang, i) => `
    <div class="lang-item" style="display:flex; gap:8px; align-items:center; background:var(--background); padding:8px 12px; border:1px solid var(--border); border-radius:8px">
      <div style="color:var(--muted); padding:4px; display:flex; align-items:center;" title="ردیف ${i + 1}">
        <span style="font-size:0.8rem; font-weight:bold; width:18px; text-align:center;">${i + 1}</span>
      </div>
      <input class="r-lang-input" value="${lang.replace(/"/g, '&quot;')}" oninput="state.resume.languages[${i}]=this.value" placeholder="مثال: انگلیسی — B2 یا فرانسوی — متوسط" style="flex:1">
      <div style="display:flex; gap:4px">
        <button class="btn sec" style="padding:6px 8px; border-radius:6px; display:flex; align-items:center;" title="بالاتر" onclick="moveLangUp(${i})" ${i === 0 ? 'disabled' : ''}>${icon('arrow_up')}</button>
        <button class="btn sec" style="padding:6px 8px; border-radius:6px; display:flex; align-items:center;" title="پایین‌تر" onclick="moveLangDown(${i})" ${i === list.length - 1 ? 'disabled' : ''}>${icon('arrow_down')}</button>
        <button class="btn danger" style="padding:6px 8px; border-radius:6px; display:flex; align-items:center;" title="حذف" onclick="deleteLang(${i})">${icon('trash_small')}</button>
      </div>
    </div>
  `).join('');
}

export function addLang() {
  syncLangs();
  (state.resume.languages ||= []).push('');
  renderLangs();
  const inputs = document.querySelectorAll('.r-lang-input');
  if (inputs.length) inputs[inputs.length - 1].focus();
}

export function deleteLang(index) {
  syncLangs();
  state.resume.languages.splice(index, 1);
  renderLangs();
}

export function moveLangUp(index) {
  if (index <= 0) return;
  syncLangs();
  const temp = state.resume.languages[index];
  state.resume.languages[index] = state.resume.languages[index - 1];
  state.resume.languages[index - 1] = temp;
  renderLangs();
}

export function moveLangDown(index) {
  if (index >= (state.resume.languages || []).length - 1) return;
  syncLangs();
  const temp = state.resume.languages[index];
  state.resume.languages[index] = state.resume.languages[index + 1];
  state.resume.languages[index + 1] = temp;
  renderLangs();
}

// ------------------- LINKS -------------------
export function renderLinks() {
  const container = document.getElementById('r-links');
  if (!container) return;
  container.innerHTML = (state.resume.links || []).length ? (state.resume.links || []).map((l, i) => `
    <div style="display:flex; gap:8px; align-items:center">
      <div style="flex:1"><input value="${l.label.replace(/"/g, '&quot;')}" onchange="state.resume.links[${i}].label=this.value" placeholder="عنوان لینک (مثلا وبسایت من)"></div>
      <div style="flex:2"><input value="${l.url.replace(/"/g, '&quot;')}" onchange="state.resume.links[${i}].url=this.value" placeholder="https://..." dir="ltr"></div>
      <button class="btn danger" style="padding:6px; border-radius:6px; display:flex; align-items:center; justify-content:center" title="حذف" onclick="state.resume.links.splice(${i},1);renderLinks()">${icon('trash_small')}</button>
    </div>
  `).join('') : '<p style="color:var(--muted); font-size:0.9rem">هیچ لینکی ثبت نشده است.</p>';
}

export function addLink() {
  (state.resume.links ||= []).push({ label: '', url: '' });
  renderLinks();
}

// ------------------- WORK EXPERIENCE -------------------
export function syncExpInputs() {
  const container = document.getElementById('r-exp');
  if (!container) return;
  const items = container.querySelectorAll('.exp-item');
  items.forEach((itemEl, i) => {
    if (state.resume.experience && state.resume.experience[i]) {
      const titleEl = itemEl.querySelector('.exp-title');
      const companyEl = itemEl.querySelector('.exp-company');
      const periodEl = itemEl.querySelector('.exp-period');
      const descEl = itemEl.querySelector('.exp-desc');
      if (titleEl) state.resume.experience[i].title = titleEl.value;
      if (companyEl) state.resume.experience[i].company = companyEl.value;
      if (periodEl) state.resume.experience[i].period = periodEl.value;
      if (descEl) state.resume.experience[i].description = descEl.value;
    }
  });
}

export function renderExp() {
  const container = document.getElementById('r-exp');
  if (!container) return;
  const list = state.resume.experience || [];

  if (list.length === 0) {
    container.innerHTML = '<p style="color:var(--muted); font-size:0.9rem">هیچ سابقه شغلی ثبت نشده است.</p>';
    return;
  }

  container.innerHTML = list.map((e, i) => `
    <div class="exp-item" draggable="true" data-index="${i}" style="border:1px solid var(--border); padding:16px; border-radius:8px; background:var(--background); position:relative"
         ondragstart="handleDragStartExp(event, ${i})" ondragover="handleDragOverExp(event)" ondrop="handleDropExp(event, ${i})" ondragend="handleDragEndExp(event)">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid var(--border)">
        <div style="display:flex; align-items:center; gap:8px">
          <div style="color:var(--muted); cursor:grab; padding:4px; display:flex; align-items:center" title="جابجایی با کشیدن">${icon('move')}</div>
          <strong style="font-size:0.95rem; color:var(--foreground)">#${i + 1} ${e.title || '(بدون عنوان)'}</strong>
          ${e.company ? `<span class="tag" style="font-size:0.75rem">${e.company}</span>` : ''}
        </div>
        <div style="display:flex; align-items:center; gap:6px">
          <button class="btn sec" style="padding:4px 8px; font-size:0.8rem; display:flex; align-items:center; gap:4px" title="انتقال به بالا" onclick="moveExpUp(${i})" ${i === 0 ? 'disabled' : ''}>
            ${icon('arrow_up')} بالاتر
          </button>
          <button class="btn sec" style="padding:4px 8px; font-size:0.8rem; display:flex; align-items:center; gap:4px" title="انتقال به پایین" onclick="moveExpDown(${i})" ${i === list.length - 1 ? 'disabled' : ''}>
            ${icon('arrow_down')} پایین‌تر
          </button>
          <button class="btn danger" style="padding:4px 8px; font-size:0.8rem; display:flex; align-items:center; gap:4px" title="حذف" onclick="deleteExp(${i})">
            ${icon('trash_small')} حذف
          </button>
        </div>
      </div>
      <div class="grid2" style="margin-bottom:12px">
        <div>
          <label style="margin-top:0; font-size:0.8rem">عنوان شغلی</label>
          <input class="exp-title" value="${(e.title || '').replace(/"/g, '&quot;')}" oninput="state.resume.experience[${i}].title=this.value" placeholder="مثال: توسعه دهنده ارشد">
        </div>
        <div>
          <label style="margin-top:0; font-size:0.8rem">نام شرکت/سازمان</label>
          <div style="display:flex; gap:8px;">
            <input class="exp-company" style="flex:1;" value="${(e.company || '').replace(/"/g, '&quot;')}" oninput="state.resume.experience[${i}].company=this.value" placeholder="مثال: گوگل">
            <button class="btn sec" style="padding:0 12px; font-size:0.8rem;" onclick="syncExpInputs(); openMediaModal((url) => { state.resume.experience[${i}].logo = url; renderExp(); })" title="انتخاب لوگو">
              ${e.logo ? `<img src="${e.logo}" style="width:20px; height:20px; object-fit:cover; border-radius:4px; margin-left:4px;"> تغییر لوگو` : '+ لوگو'}
            </button>
            ${e.logo ? `<button class="btn danger" style="padding:0 8px; font-size:0.8rem;" onclick="syncExpInputs(); state.resume.experience[${i}].logo = ''; renderExp();" title="حذف لوگو">✕</button>` : ''}
          </div>
        </div>
        <div>
          <label style="margin-top:0; font-size:0.8rem">مدت زمان</label>
          <input class="exp-period" value="${(e.period || '').replace(/"/g, '&quot;')}" oninput="state.resume.experience[${i}].period=this.value" placeholder="مثال: ۱۴۰۰ - تاکنون">
        </div>
      </div>
      <div>
        <label style="margin-top:0; font-size:0.8rem">توضیحات تکمیلی</label>
        <textarea class="exp-desc" oninput="state.resume.experience[${i}].description=this.value" placeholder="شرح وظایف و دستاوردها..." style="min-height:60px">${e.description || ''}</textarea>
      </div>
    </div>
  `).join('');
}

export function addExp() {
  syncExpInputs();
  (state.resume.experience ||= []).push({ id: 'e' + Date.now(), title: '', company: '', period: '', description: '' });
  renderExp();
}

export function deleteExp(index) {
  syncExpInputs();
  state.resume.experience.splice(index, 1);
  renderExp();
}

export function moveExpUp(index) {
  if (index <= 0) return;
  syncExpInputs();
  const temp = state.resume.experience[index];
  state.resume.experience[index] = state.resume.experience[index - 1];
  state.resume.experience[index - 1] = temp;
  renderExp();
}

export function moveExpDown(index) {
  if (index >= (state.resume.experience || []).length - 1) return;
  syncExpInputs();
  const temp = state.resume.experience[index];
  state.resume.experience[index] = state.resume.experience[index + 1];
  state.resume.experience[index + 1] = temp;
  renderExp();
}

export function handleDragStartExp(e, index) {
  syncExpInputs();
  state.draggedExpIndex = index;
  e.target.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
}

export function handleDragOverExp(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

export function handleDropExp(e, dropIndex) {
  e.preventDefault();
  if (state.draggedExpIndex === null || state.draggedExpIndex === dropIndex) return;
  syncExpInputs();
  const temp = state.resume.experience[state.draggedExpIndex];
  state.resume.experience.splice(state.draggedExpIndex, 1);
  state.resume.experience.splice(dropIndex, 0, temp);
  renderExp();
}

export function handleDragEndExp(e) {
  e.target.style.opacity = '1';
  state.draggedExpIndex = null;
}

// ------------------- EDUCATION -------------------
export function syncEduInputs() {
  const container = document.getElementById('r-edu');
  if (!container) return;
  const items = container.querySelectorAll('.edu-item');
  items.forEach((itemEl, i) => {
    if (state.resume.education && state.resume.education[i]) {
      const titleEl = itemEl.querySelector('.edu-title');
      const schoolEl = itemEl.querySelector('.edu-school');
      const periodEl = itemEl.querySelector('.edu-period');
      if (titleEl) state.resume.education[i].title = titleEl.value;
      if (schoolEl) state.resume.education[i].school = schoolEl.value;
      if (periodEl) state.resume.education[i].period = periodEl.value;
    }
  });
}

export function renderEdu() {
  const container = document.getElementById('r-edu');
  if (!container) return;
  const list = state.resume.education || [];

  if (list.length === 0) {
    container.innerHTML = '<p style="color:var(--muted); font-size:0.9rem">هیچ سابقه تحصیلی ثبت نشده است.</p>';
    return;
  }

  container.innerHTML = list.map((e, i) => `
    <div class="edu-item" style="border:1px solid var(--border); padding:16px; border-radius:8px; background:var(--background); position:relative">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid var(--border)">
        <div style="display:flex; align-items:center; gap:8px">
          <strong style="font-size:0.95rem; color:var(--foreground)">#${i + 1} ${e.title || '(بدون عنوان)'}</strong>
          ${e.school ? `<span class="tag" style="font-size:0.75rem">${e.school}</span>` : ''}
        </div>
        <div style="display:flex; align-items:center; gap:6px">
          <button class="btn sec" style="padding:4px 8px; font-size:0.8rem; display:flex; align-items:center; gap:4px" title="انتقال به بالا" onclick="moveEduUp(${i})" ${i === 0 ? 'disabled' : ''}>
            ${icon('arrow_up')} بالاتر
          </button>
          <button class="btn sec" style="padding:4px 8px; font-size:0.8rem; display:flex; align-items:center; gap:4px" title="انتقال به پایین" onclick="moveEduDown(${i})" ${i === list.length - 1 ? 'disabled' : ''}>
            ${icon('arrow_down')} پایین‌تر
          </button>
          <button class="btn danger" style="padding:4px 8px; font-size:0.8rem; display:flex; align-items:center; gap:4px" title="حذف" onclick="deleteEdu(${i})">
            ${icon('trash_small')} حذف
          </button>
        </div>
      </div>
      <div class="grid2">
        <div>
          <label style="margin-top:0; font-size:0.8rem">مقطع و رشته</label>
          <input class="edu-title" value="${(e.title || '').replace(/"/g, '&quot;')}" oninput="state.resume.education[${i}].title=this.value" placeholder="مثال: کارشناسی مهندسی کامپیوتر">
        </div>
        <div>
          <label style="margin-top:0; font-size:0.8rem">دانشگاه/موسسه</label>
          <div style="display:flex; gap:8px;">
            <input class="edu-school" style="flex:1;" value="${(e.school || '').replace(/"/g, '&quot;')}" oninput="state.resume.education[${i}].school=this.value" placeholder="مثال: دانشگاه تهران">
            <button class="btn sec" style="padding:0 12px; font-size:0.8rem;" onclick="syncEduInputs(); openMediaModal((url) => { state.resume.education[${i}].logo = url; renderEdu(); })" title="انتخاب لوگو">
              ${e.logo ? `<img src="${e.logo}" style="width:20px; height:20px; object-fit:cover; border-radius:4px; margin-left:4px;"> تغییر لوگو` : '+ لوگو'}
            </button>
            ${e.logo ? `<button class="btn danger" style="padding:0 8px; font-size:0.8rem;" onclick="syncEduInputs(); state.resume.education[${i}].logo = ''; renderEdu();" title="حذف لوگو">✕</button>` : ''}
          </div>
        </div>
        <div>
          <label style="margin-top:0; font-size:0.8rem">مدت زمان</label>
          <input class="edu-period" value="${(e.period || '').replace(/"/g, '&quot;')}" oninput="state.resume.education[${i}].period=this.value" placeholder="مثال: ۱۳۹۶ - ۱۴۰۰">
        </div>
      </div>
    </div>
  `).join('');
}

export function addEdu() {
  syncEduInputs();
  (state.resume.education ||= []).push({ id: 'd' + Date.now(), title: '', school: '', period: '' });
  renderEdu();
}

export function deleteEdu(index) {
  syncEduInputs();
  state.resume.education.splice(index, 1);
  renderEdu();
}

export function moveEduUp(index) {
  if (index <= 0) return;
  syncEduInputs();
  const temp = state.resume.education[index];
  state.resume.education[index] = state.resume.education[index - 1];
  state.resume.education[index - 1] = temp;
  renderEdu();
}

export function moveEduDown(index) {
  if (index >= (state.resume.education || []).length - 1) return;
  syncEduInputs();
  const temp = state.resume.education[index];
  state.resume.education[index] = state.resume.education[index + 1];
  state.resume.education[index + 1] = temp;
  renderEdu();
}

export async function cancelResume() {
  state.resume = await api('/api/resume');
  show('pages');
}

export async function saveResume() {
  syncExpInputs();
  syncEduInputs();
  syncLangs();

  state.resume.summary = val('r-summary');
  state.resume.skills = val('r-skills').split(/[,،\n]/).map((s) => s.trim()).filter(Boolean);
  state.resume.tools = val('r-tools').split(/[,،\n]/).map((s) => s.trim()).filter(Boolean);
  state.resume.languages = (state.resume.languages || []).flatMap((s) => s.split(/[,،\n]/).map((x) => x.trim())).filter(Boolean);
  state.resume.location = val('r-location');
  state.resume.maritalStatus = val('r-marital');
  state.resume.militaryService = val('r-military');
  state.resume.birthDate = val('r-birth');
  state.resume.phone = val('r-phone');
  state.resume.email = val('r-email');

  await api('/api/resume', { method: 'POST', body: JSON.stringify(state.resume), headers: { 'Content-Type': 'application/json' } });
  await loadAll();

  const btn = document.querySelector('button[onclick="saveResume()"]');
  if (btn) {
    const origText = btn.innerHTML;
    btn.innerHTML = 'ذخیره شد ✓';
    btn.classList.add('ok');
    setTimeout(() => { btn.innerHTML = origText; btn.classList.remove('ok'); }, 2000);
  }
}
