import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { loadAll } from '../core/data.js';
import { show } from '../core/router.js';
import { val } from '../utils/helpers.js';

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
            <div><label style="margin-top:0">زبان‌ها (با کاما)</label><input id="r-langs" value="${(state.resume.languages || []).join(', ')}"></div>
          </div>
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
            <h3 style="color:var(--primary); margin:0">سوابق شغلی و تجربه‌ها</h3>
            <button class="btn sec" onclick="addExp()">+ افزودن تجربه جدید</button>
          </div>
          <div id="r-exp" style="display:flex; flex-direction:column; gap:16px"></div>
        </div>

        <div class="card" style="padding:24px">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
            <h3 style="color:var(--primary); margin:0">سوابق تحصیلی</h3>
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
  renderExp(); renderEdu(); renderLinks();
}

export function renderLinks() {
  document.getElementById('r-links').innerHTML = (state.resume.links || []).length ? (state.resume.links || []).map((l, i) => `
    <div style="display:flex; gap:8px; align-items:center">
      <div style="flex:1"><input value="${l.label}" onchange="state.resume.links[${i}].label=this.value" placeholder="عنوان لینک (مثلا وبسایت من)"></div>
      <div style="flex:2"><input value="${l.url}" onchange="state.resume.links[${i}].url=this.value" placeholder="https://..." dir="ltr"></div>
      <button class="btn danger" style="padding:6px; border-radius:6px; display:flex; align-items:center; justify-content:center" title="حذف" onclick="state.resume.links.splice(${i},1);renderLinks()">${icon('trash_small')}</button>
    </div>
  `).join('') : '<p style="color:var(--muted); font-size:0.9rem">هیچ لینکی ثبت نشده است.</p>';
}

export function addLink() {
  (state.resume.links ||= []).push({ label: '', url: '' });
  renderLinks();
}

export function renderExp() {
  document.getElementById('r-exp').innerHTML = (state.resume.experience || []).length ? (state.resume.experience || []).map((e, i) => `
    <div style="border:1px solid var(--border); padding:16px; border-radius:8px; background:var(--background); position:relative">
      <button class="btn danger" style="position:absolute; top:12px; left:12px; padding:6px; border-radius:6px; display:flex; align-items:center; justify-content:center" title="حذف" onclick="state.resume.experience.splice(${i},1);renderExp()">${icon('trash_small')}</button>
      <div class="grid2" style="margin-bottom:12px">
        <div><label style="margin-top:0; font-size:0.8rem">عنوان شغلی</label><input value="${e.title}" onchange="state.resume.experience[${i}].title=this.value" placeholder="مثال: توسعه دهنده ارشد"></div>
        <div>
          <label style="margin-top:0; font-size:0.8rem">نام شرکت/سازمان</label>
          <div style="display:flex; gap:8px;">
            <input style="flex:1;" value="${e.company}" onchange="state.resume.experience[${i}].company=this.value" placeholder="مثال: گوگل">
            <button class="btn sec" style="padding:0 12px; font-size:0.8rem;" onclick="openMediaModal((url) => { state.resume.experience[${i}].logo = url; renderExp(); })" title="انتخاب لوگو">
              ${e.logo ? `<img src="${e.logo}" style="width:20px; height:20px; object-fit:cover; border-radius:4px; margin-left:4px;"> تغییر لوگو` : '+ لوگو'}
            </button>
            ${e.logo ? `<button class="btn danger" style="padding:0 8px; font-size:0.8rem;" onclick="state.resume.experience[${i}].logo = ''; renderExp();" title="حذف لوگو">✕</button>` : ''}
          </div>
        </div>
        <div><label style="margin-top:0; font-size:0.8rem">مدت زمان</label><input value="${e.period}" onchange="state.resume.experience[${i}].period=this.value" placeholder="مثال: ۱۴۰۰ - تاکنون"></div>
      </div>
      <div><label style="margin-top:0; font-size:0.8rem">توضیحات تکمیلی</label><textarea onchange="state.resume.experience[${i}].description=this.value" placeholder="شرح وظایف و دستاوردها..." style="min-height:60px">${e.description}</textarea></div>
    </div>
  `).join('') : '<p style="color:var(--muted); font-size:0.9rem">هیچ سابقه شغلی ثبت نشده است.</p>';
}

export function addExp() { (state.resume.experience ||= []).push({ id: 'e' + Date.now(), title: '', company: '', period: '', description: '' }); renderExp(); }

export function renderEdu() {
  document.getElementById('r-edu').innerHTML = (state.resume.education || []).length ? (state.resume.education || []).map((e, i) => `
    <div style="border:1px solid var(--border); padding:16px; border-radius:8px; background:var(--background); position:relative">
      <button class="btn danger" style="position:absolute; top:12px; left:12px; padding:6px 12px; font-size:0.8rem; border-radius:6px; display:flex; align-items:center; justify-content:center" title="حذف" onclick="state.resume.education.splice(${i},1);renderEdu()">${icon('trash_small')}</button>
      <div class="grid2">
        <div><label style="margin-top:0; font-size:0.8rem">مقطع و رشته</label><input value="${e.title}" onchange="state.resume.education[${i}].title=this.value" placeholder="مثال: کارشناسی مهندسی کامپیوتر"></div>
        <div>
          <label style="margin-top:0; font-size:0.8rem">دانشگاه/موسسه</label>
          <div style="display:flex; gap:8px;">
            <input style="flex:1;" value="${e.school}" onchange="state.resume.education[${i}].school=this.value" placeholder="مثال: دانشگاه تهران">
            <button class="btn sec" style="padding:0 12px; font-size:0.8rem;" onclick="openMediaModal((url) => { state.resume.education[${i}].logo = url; renderEdu(); })" title="انتخاب لوگو">
              ${e.logo ? `<img src="${e.logo}" style="width:20px; height:20px; object-fit:cover; border-radius:4px; margin-left:4px;"> تغییر لوگو` : '+ لوگو'}
            </button>
            ${e.logo ? `<button class="btn danger" style="padding:0 8px; font-size:0.8rem;" onclick="state.resume.education[${i}].logo = ''; renderEdu();" title="حذف لوگو">✕</button>` : ''}
          </div>
        </div>
        <div><label style="margin-top:0; font-size:0.8rem">مدت زمان</label><input value="${e.period}" onchange="state.resume.education[${i}].period=this.value" placeholder="مثال: ۱۳۹۶ - ۱۴۰۰"></div>
      </div>
    </div>
  `).join('') : '<p style="color:var(--muted); font-size:0.9rem">هیچ سابقه تحصیلی ثبت نشده است.</p>';
}

export function addEdu() { (state.resume.education ||= []).push({ id: 'd' + Date.now(), title: '', school: '', period: '' }); renderEdu(); }

export async function cancelResume() {
  state.resume = await api('/api/resume');
  show('pages');
}

export async function saveResume() {
  state.resume.summary = val('r-summary');
  state.resume.skills = val('r-skills').split(',').map((s) => s.trim()).filter(Boolean);
  state.resume.tools = val('r-tools').split(',').map((s) => s.trim()).filter(Boolean);
  state.resume.languages = val('r-langs').split(',').map((s) => s.trim()).filter(Boolean);
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
