import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';

const STEP_LABELS = {
  preparing: 'آماده‌سازی بروزرسانی',
  backup: 'ایجاد پشتیبان کامل',
  download: 'دریافت آخرین نسخه',
  restore_content: 'بازگردانی محتوای کاربری',
  deps_install: 'نصب وابستگی‌ها',
  test: 'اجرای تست‌ها',
  finalize: 'نهایی‌سازی بروزرسانی',
};

function spinnerHTML() {
  return `<span class="update-spinner"></span>`;
}

function checkHTML() {
  return `<span class="update-check" style="color: var(--primary); font-size: 1.2rem;">✓</span>`;
}

function skipHTML(reason) {
  return `<span class="update-skip" style="color: var(--muted); font-size: 0.9rem;" title="${reason || ''}">—</span>`;
}

function errorHTML() {
  return `<span class="update-error-icon" style="color: #ef4444; font-size: 1.2rem;">✗</span>`;
}

function renderProgressUI(steps) {
  const stepKeys = Object.keys(STEP_LABELS);

  let html = `<div class="update-progress-panel">`;
  for (const key of stepKeys) {
    const label = STEP_LABELS[key];
    const status = steps[key] || 'pending';
    let iconHtml = '';
    if (status === 'running') iconHtml = spinnerHTML();
    else if (status === 'done') iconHtml = checkHTML();
    else if (status === 'skipped') iconHtml = skipHTML(steps[key + '_reason'] || '');
    else if (status === 'error') iconHtml = errorHTML();
    else iconHtml = `<span class="update-pending-dot" style="color: var(--muted); opacity: 0.4;">○</span>`;

    html += `
      <div class="update-step ${status}" style="display:flex; align-items:center; gap: 12px; padding: 12px 16px; border-radius: 8px; margin-bottom: 4px; border: 1px solid transparent; transition: all 0.3s;">
        <div class="update-step-icon" style="width: 24px; height: 24px; display:flex; align-items:center; justify-content:center; flex-shrink: 0;">
          ${iconHtml}
        </div>
        <span class="update-step-label" style="flex:1; font-size: 0.95rem;">${label}</span>
        ${status === 'error' ? `<span class="update-step-error-msg" style="font-size:0.8rem; color:#ef4444;"></span>` : ''}
      </div>`;
  }
  html += `</div>`;

  // Action log area
  html += `<div id="update-action-log" style="margin-top: 12px; font-size: 0.85rem; color: var(--muted); min-height: 20px;"></div>`;

  return html;
}

function updateStepUI(stepKey, status, extra) {
  const panel = document.querySelector('.update-progress-panel');
  if (!panel) return;

  const stepDivs = panel.querySelectorAll('.update-step');
  const keys = Object.keys(STEP_LABELS);
  const idx = keys.indexOf(stepKey);
  if (idx < 0 || idx >= stepDivs.length) return;

  const stepDiv = stepDivs[idx];
  const iconDiv = stepDiv.querySelector('.update-step-icon');

  stepDiv.className = `update-step ${status}`;

  // Update icon
  let iconHtml = '';
  if (status === 'running') iconHtml = spinnerHTML();
  else if (status === 'done') iconHtml = checkHTML();
  else if (status === 'skipped') iconHtml = skipHTML(extra);
  else if (status === 'error') iconHtml = errorHTML();
  else iconHtml = `<span class="update-pending-dot" style="color: var(--muted); opacity: 0.4;">○</span>`;

  if (iconDiv) iconDiv.innerHTML = iconHtml;

  // For skipped steps, update the label to show the reason
  if (status === 'skipped' && extra) {
    const labelEl = stepDiv.querySelector('.update-step-label');
    if (labelEl) {
      const baseLabel = STEP_LABELS[stepKey] || '';
      labelEl.textContent = `${baseLabel} — ${extra}`;
    }
  }

  // For error, add subtle highlight
  if (status === 'error') {
    stepDiv.style.borderColor = '#ef4444';
    stepDiv.style.background = 'rgba(239,68,68,0.08)';
  } else if (status === 'running') {
    stepDiv.style.borderColor = 'var(--primary)';
    stepDiv.style.background = 'rgba(184,245,66,0.05)';
  } else {
    stepDiv.style.borderColor = 'transparent';
    stepDiv.style.background = '';
  }

  // Update error message area
  if (extra && status === 'error') {
    const errorMsgEl = stepDiv.querySelector('.update-step-error-msg');
    if (errorMsgEl) errorMsgEl.textContent = extra;
  }
}

function setActionLog(msg) {
  const log = document.getElementById('update-action-log');
  if (log) log.textContent = msg;
}

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
          <p style="font-size: 0.9em; color: var(--muted);">محتوای سایت شما (پروژه‌ها، پست‌ها، تنظیمات) پس از بروزرسانی حفظ خواهد شد.</p>
        </div>
        <button class="btn" id="start-update-btn">
          <span data-icon="update"></span> شروع بروزرسانی
        </button>
      `;
    } else {
      html += `
        <p style="color: var(--primary);">شما از آخرین نسخه استفاده می‌کنید.</p>
      `;
    }

    card.innerHTML = html;

    const startBtn = document.getElementById('start-update-btn');
    if (startBtn) {
      startBtn.addEventListener('click', startUpdate);
    }
  } catch (err) {
    const card = document.getElementById('update-status-card');
    if (card) {
      card.innerHTML = `<p style="color: #ef4444;">خطای شبکه در ارتباط با سرور</p>`;
    }
  }
}

export async function startUpdate() {
  if (!confirm('آیا از شروع فرآیند بروزرسانی اطمینان دارید؟\nاین عملیات ممکن است چند دقیقه طول بکشد. لطفاً این صفحه را نبندید.')) return;

  const card = document.getElementById('update-status-card');
  if (!card) return;

  // Initialize step state
  const steps = {};
  for (const key of Object.keys(STEP_LABELS)) {
    steps[key] = 'pending';
  }

  // Render progress UI
  card.innerHTML = `
    <h3 style="margin-bottom: 16px;">فرآیند بروزرسانی</h3>
    ${renderProgressUI(steps)}
    <div id="update-result" style="margin-top: 20px;"></div>
  `;

  try {
    const response = await fetch('/api/update/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Server returned ' + response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const lines = buffer.split('\n');
      // Keep last partial line in buffer
      buffer = lines.pop() || '';

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          try {
            const data = JSON.parse(dataStr);
            handleSSEEvent(currentEvent, data, card, steps);
          } catch {
            // skip unparseable
          }
        }
      }
    }
  } catch (err) {
    // The SSE stream terminated but check if we have a result div already
    const resultDiv = document.getElementById('update-result');
    if (resultDiv && !resultDiv.innerHTML.trim()) {
      resultDiv.innerHTML = `
        <p style="color: #ef4444;">خطای ارتباط با سرور در حین بروزرسانی.</p>
        <pre style="background: var(--background); padding: 12px; border-radius: 8px; direction: ltr; text-align: left; overflow-x: auto; font-size: 0.85em; margin-top: 8px;">${err.message || String(err)}</pre>
      `;
    }
  }
}

function handleSSEEvent(event, data, card, steps) {
  const resultDiv = document.getElementById('update-result');

  if (event === 'step') {
    const stepKey = data.step;
    const status = data.status;

    if (stepKey && steps.hasOwnProperty(stepKey)) {
      steps[stepKey] = status;
      if (data.reason) steps[stepKey + '_reason'] = data.reason;
      updateStepUI(stepKey, status, status === 'error' ? data.error : data.reason);
    }

    // If a generic error without a step key (current step failed)
    if (!stepKey && status === 'error') {
      // Find the running step and mark it as error
      for (const key of Object.keys(steps)) {
        if (steps[key] === 'running') {
          steps[key] = 'error';
          updateStepUI(key, 'error', data.error);
          break;
        }
      }
    }
  } else if (event === 'action') {
    if (data.action === 'rollback_start') {
      setActionLog('بروزرسانی ناموفق بود. در حال بازگردانی نسخه قبلی...');
    } else if (data.action === 'rollback_done') {
      if (data.success) {
        setActionLog('بازگردانی با موفقیت انجام شد. سایت به وضعیت قبلی بازگشته است.');
      } else {
        setActionLog('⚠️ بازگردانی خودکار ناقص ماند: ' + (data.error || 'خطای ناشناخته'));
      }
    }
  } else if (event === 'done') {
    if (data.error) {
      // Update failed
      const errorDetails = data.error;

      // Mark any still-running step as error
      for (const key of Object.keys(steps)) {
        if (steps[key] === 'running') {
          steps[key] = 'error';
          updateStepUI(key, 'error');
        }
      }

      if (resultDiv) {
        resultDiv.innerHTML = `
          <div style="margin-top: 20px; padding: 16px; background: rgba(239,68,68,0.1); border: 1px solid #ef4444; border-radius: 8px;">
            <p style="color: #ef4444; font-weight: bold; margin-bottom: 12px;">بروزرسانی ناموفق بود</p>
            ${data.rolledBack ? '<p style="color: var(--primary); margin-bottom: 8px;">✓ بازگردانی خودکار انجام شد — سایت به وضعیت قبلی بازگشته است.</p>' : ''}
            <details style="margin-top: 8px;">
              <summary style="cursor: pointer; color: var(--muted); font-size: 0.9rem;">جزئیات خطا</summary>
              <pre style="background: var(--background); padding: 12px; border-radius: 8px; direction: ltr; text-align: left; overflow-x: auto; font-size: 0.85em; margin-top: 8px; white-space: pre-wrap;">${errorDetails}</pre>
            </details>
          </div>
          <button class="btn sec" style="margin-top: 16px;" onclick="checkUpdate()">بازگشت</button>
        `;
      }
    } else {
      // Update succeeded
      const remainingSteps = Object.keys(steps).filter(k => steps[k] === 'pending' || steps[k] === 'running');
      for (const key of remainingSteps) {
        steps[key] = 'done';
        updateStepUI(key, 'done');
      }

      if (resultDiv) {
        resultDiv.innerHTML = `
          <div style="margin-top: 20px; padding: 16px; background: rgba(184,245,66,0.1); border: 1px solid var(--primary); border-radius: 8px;">
            <p style="color: var(--primary); font-weight: bold; margin-bottom: 8px;">✓ بروزرسانی با موفقیت انجام شد!</p>
            <p>نسخه جدید: <strong>${data.newVersion}</strong></p>
          </div>
          <button class="btn" style="margin-top: 16px;" onclick="window.location.reload()">بارگذاری مجدد پنل</button>
        `;
      }
    }
  }
}