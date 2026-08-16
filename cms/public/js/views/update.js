import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';

export function renderUpdate() {
  dom.content.innerHTML = `
    <h2>بروزرسانی</h2>
    <p class="sub">در این بخش می‌توانید سایت را به آخرین نسخه بروزرسانی کنید.</p>

    <div class="card" id="update-status-card">
      <p>در حال بررسی وضعیت بروزرسانی...</p>
    </div>
  `;
  checkUpdate();
}

export async function checkUpdate() {
  try {
    const card = document.getElementById('update-status-card');
    if (!card) return;

    card.innerHTML = '<p>در حال بررسی نسخه‌های جدید از مخزن...</p>';

    const res = await api('/api/update/check');

    if (res.error) {
      card.innerHTML = `<p style="color: #ef4444;">خطا در بررسی بروزرسانی: ${res.error}</p>`;
      return;
    }

    let html = `
      <div style="margin-bottom: 16px;">
        <p><strong>نسخه فعلی:</strong> ${res.currentVersion}</p>
        <p><strong>آخرین نسخه موجود:</strong> ${res.latestVersion || 'یافت نشد'}</p>
      </div>
    `;

    if (res.updateAvailable) {
      html += `
        <div style="padding: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; margin-bottom: 16px;">
          <p style="color: #ef4444; margin-bottom: 8px;"><strong>توجه:</strong> قبل از بروزرسانی، مطمئن شوید که تمام تغییرات خود را ذخیره کرده‌اید.</p>
          <p style="font-size: 0.9em; color: var(--muted);">در حین بروزرسانی، محتوای سایت شما (پروژه‌ها، پست‌ها، تنظیمات) حفظ خواهد شد.</p>
        </div>
        <button class="btn" onclick="startUpdate()">
          <span data-icon="update"></span> شروع بروزرسانی
        </button>
      `;
    } else {
      html += `
        <p style="color: var(--primary);">شما از آخرین نسخه استفاده می‌کنید.</p>
      `;
    }

    card.innerHTML = html;
    if (window.icon) {
      card.querySelectorAll('span[data-icon]').forEach(el => {
        const i = el.getAttribute('data-icon');
        if (window.icon[i]) el.innerHTML = window.icon[i];
      });
    }
  } catch (err) {
    const card = document.getElementById('update-status-card');
    if (card) {
      card.innerHTML = `<p style="color: #ef4444;">خطای شبکه در ارتباط با سرور</p>`;
    }
  }
}

export async function startUpdate() {
  if (!confirm('آیا از شروع فرآیند بروزرسانی اطمینان دارید؟\nاین عملیات ممکن است چند دقیقه طول بکشد.')) return;

  const card = document.getElementById('update-status-card');
  if (card) {
    card.innerHTML = `
      <p style="margin-bottom: 16px;">در حال انجام بروزرسانی...</p>
      <ul style="list-style-type: disc; margin-right: 20px; color: var(--muted); font-size: 0.9em; line-height: 2;">
        <li>پشتیبان‌گیری از محتوا</li>
        <li>دریافت آخرین تغییرات</li>
        <li>اعمال بروزرسانی</li>
        <li>بازگردانی محتوا</li>
      </ul>
      <p style="margin-top: 16px; color: var(--primary);">لطفاً تا پایان عملیات این صفحه را نبندید.</p>
    `;
  }

  try {
    const res = await api('/api/update/start', { method: 'POST' });

    if (res.error) {
      if (card) {
        card.innerHTML = `
          <p style="color: #ef4444; margin-bottom: 16px;">خطا در بروزرسانی:</p>
          <pre style="background: var(--background); padding: 12px; border-radius: 8px; direction: ltr; text-align: left; overflow-x: auto; font-size: 0.85em;">${res.error}</pre>
          <button class="btn" style="margin-top: 16px;" onclick="checkUpdate()">تلاش مجدد</button>
        `;
      }
    } else {
      if (card) {
        card.innerHTML = `
          <p style="color: var(--primary); font-size: 1.1em; margin-bottom: 16px;">بروزرسانی با موفقیت انجام شد!</p>
          <p>نسخه جدید: <strong>${res.newVersion}</strong></p>
          <button class="btn" style="margin-top: 16px;" onclick="window.location.reload()">بارگذاری مجدد پنل</button>
        `;
      }
    }
  } catch (err) {
    if (card) {
      card.innerHTML = `<p style="color: #ef4444;">خطای ارتباط با سرور در حین بروزرسانی.</p>`;
    }
  }
}
