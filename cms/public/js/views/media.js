import { state, dom } from '../core/state.js';
import { api } from '../core/api.js';
import { loadMedia } from '../core/data.js';

export async function renderMedia() {
  await loadMedia();
  dom.content.innerHTML = `
      <h2 style="margin-bottom:4px">رسانه</h2>
      <p class="sub" style="margin-bottom:24px">مدیریت فایل‌های آپلود شده.</p>
      <div style="margin-bottom:24px; width:fit-content; display:flex; gap:8px; align-items:center; background:var(--card); padding:8px 16px; border-radius:8px; border:1px solid var(--border)">
        <input type="file" id="media-upload" style="background:transparent; border:none; padding:0; width:auto">
        <button class="btn" onclick="uploadMedia()">آپلود فایل</button>
      </div>
    <div class="grid2" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px">
      ${state.media.map((m) => `
        <div class="card" style="padding:12px; position:relative; display:flex; flex-direction:column; align-items:center; text-align:center">
          <button onclick="deleteMedia('${m.path}')" style="position:absolute; top:8px; left:8px; background:rgba(239, 68, 68, 0.9); color:white; border:none; border-radius:4px; padding:4px; cursor:pointer" title="حذف">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
          <div style="width:100%; height:120px; display:flex; align-items:center; justify-content:center; cursor:pointer; background:#0b111b; border-radius:8px; margin-bottom:12px; overflow:hidden" onclick="openLightbox('${m.path}')">
            <img src="${m.path}" style="max-width:100%; max-height:100%; object-fit:contain">
          </div>
          <strong style="word-break:break-all; font-size:0.9rem; line-height:1.4; margin-bottom:4px; width:100%">${m.name}</strong>
          <span style="color:#9ba6b5; font-size:0.8rem">${Math.round(m.size / 1024)} کیلوبایت</span>
        </div>
      `).join('')}
    </div>
  `;
}
export async function uploadMedia() { const file = document.getElementById('media-upload').files[0]; if (!file) return; const buffer = await file.arrayBuffer(); await fetch('/api/media?name=' + encodeURIComponent(file.name), { method: 'POST', body: buffer }); renderMedia(); }
export async function deleteMedia(p) { if(confirm('این فایل حذف شود؟')) { await api('/api/media', { method: 'DELETE', body: JSON.stringify({ path: p }), headers: { 'Content-Type': 'application/json' } }); renderMedia(); } }

export function openLightbox(url) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'lightbox-modal';
  overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div style="position:relative; max-width:90%; max-height:90vh; display:flex; flex-direction:column; align-items:center">
      <button class="modal-close" style="position:absolute; top:-40px; right:0; font-size:2rem" onclick="document.getElementById('lightbox-modal').remove()">×</button>
      <img src="${url}" class="lightbox-img">
    </div>
  `;
  document.body.appendChild(overlay);
}
