import { state } from '../core/state.js';
import { api } from '../core/api.js';
import { loadMedia } from '../core/data.js';

let galleryMode = false;
let selectedPaths = [];

export async function openMediaModal(callback, isGallery = false) {
  state.mediaModalCallback = callback;
  galleryMode = isGallery;
  selectedPaths = [];

  const modal = document.getElementById('media-modal');
  if (modal) {
      modal.style.display = 'flex';
  }

  const galleryBtn = document.getElementById('media-modal-gallery-btn');
  if(galleryBtn) { galleryBtn.innerHTML = icon('gallery') + ' گالری'; }
  if (galleryBtn) {
    if (galleryMode) {
      galleryBtn.classList.add('sec'); galleryBtn.style.borderColor = 'var(--primary)'; galleryBtn.style.color = 'var(--primary)';
    } else {
      galleryBtn.style.borderColor = ''; galleryBtn.style.color = '';
    }
  }

  updateSelectionCount();

  await loadMedia();
  renderMediaModalGrid();
}

export function closeMediaModal() {
  const modal = document.getElementById('media-modal');
  if (modal) {
      modal.style.display = 'none';
  }
  state.mediaModalCallback = null;
  galleryMode = false;
  selectedPaths = [];
}

export function toggleMediaModalGalleryMode() {
  galleryMode = !galleryMode;
  const galleryBtn = document.getElementById('media-modal-gallery-btn');
  if (galleryBtn) {
    if (galleryMode) {
      galleryBtn.style.borderColor = 'var(--primary)';
      galleryBtn.style.color = 'var(--primary)';
    } else {
      galleryBtn.style.borderColor = '';
      galleryBtn.style.color = '';
      if (selectedPaths.length > 1) {
        selectedPaths = [selectedPaths[selectedPaths.length - 1]];
      }
    }
  }
  updateSelectionCount();
  renderMediaModalGrid();
}

function updateSelectionCount() {
  const countSpan = document.getElementById('media-modal-selection-count');
  if (countSpan) {
    if (galleryMode && selectedPaths.length > 0) {
      countSpan.style.display = 'inline';
      countSpan.innerText = selectedPaths.length + ' مورد انتخاب شده';
    } else {
      countSpan.style.display = 'none';
    }
  }
}

export function renderMediaModalGrid() {
  const grid = document.getElementById('media-modal-grid');
  if (!grid) return;
  if (!state.media.length) {
    grid.innerHTML = '<p style="color:#9ba6b5">هیچ رسانه‌ای موجود نیست.</p>';
    return;
  }

  grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(120px, 1fr))";
  grid.innerHTML = state.media.map((m) => {
    const isSelected = selectedPaths.includes(m.path);
    const checkmarkHtml = isSelected
      ? '<div style="position:absolute; top:8px; right:8px; background:var(--primary); color:var(--background); border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px; box-shadow:0 2px 4px rgba(0,0,0,0.3)">✓</div>'
      : '';

    const borderStyle = isSelected ? 'border: 2px solid var(--primary);' : 'border: 2px solid transparent;';

    return `<div class="card" style="cursor:pointer; position:relative; padding:0; ${borderStyle} border-radius:8px; overflow:hidden; aspect-ratio:1; display:flex; flex-direction:column;" onclick="selectMediaFromModal('${m.path}')">
      ${checkmarkHtml}
      <img src="${m.path}" style="width:100%; height:100%; object-fit:cover; margin:0; flex:1;">
      <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.7); padding:4px 8px; font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; direction:ltr; text-align:left;">${m.name}</div>
    </div>`;
  }).join('');
}

export function selectMediaFromModal(path) {
  const idx = selectedPaths.indexOf(path);
  if (galleryMode) {
    if (idx > -1) {
      selectedPaths.splice(idx, 1);
    } else {
      selectedPaths.push(path);
    }
  } else {
    // Single mode: just set the selected path
    if (idx > -1) {
      selectedPaths = []; // deselect if clicked again
    } else {
      selectedPaths = [path];
    }
  }
  updateSelectionCount();
  renderMediaModalGrid();
}

export function confirmMediaSelection() {
  if (state.mediaModalCallback) {
    if (galleryMode) {
      state.mediaModalCallback(selectedPaths);
    } else {
      state.mediaModalCallback(selectedPaths.length > 0 ? selectedPaths[0] : null);
    }
  }
  closeMediaModal();
}

export async function uploadMediaFromModal() {
  const fileInput = document.getElementById('media-modal-upload');
  const file = fileInput.files[0];
  if (!file) return alert('لطفاً یک فایل انتخاب کنید.');
  const buf = await file.arrayBuffer();
  const res = await api('/api/media?name=' + encodeURIComponent(file.name), {
    method: 'POST',
    body: buf,
    headers: { 'Content-Type': 'application/octet-stream' }
  });
  if (res.ok) {
    fileInput.value = ''; // Reset input
    await loadMedia();
    selectMediaFromModal(res.path);
  } else {
    alert('خطا در آپلود');
  }
}
