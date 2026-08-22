import { renderPostCategories } from '../views/categories.js';
import { state } from './state.js';
import { renderDashboard } from '../views/dashboard.js';
import { renderPages, renderPageEdit } from '../views/pages.js';
import { renderMenu } from '../views/menu.js';
import { renderProjects, renderProjectEdit } from '../views/projects.js';
import { renderCategories } from '../views/categories.js';
import { renderPosts, renderPostEdit } from '../views/posts.js';
import { renderResume } from '../views/resume.js';
import { renderMedia } from '../views/media.js';
import { renderSettings } from '../views/settings.js';
import { renderTheme } from '../views/theme.js';
import { renderTypography } from '../views/typography.js';
import { renderPublish } from '../views/publish.js';
import { renderHero } from '../views/hero.js';
import { renderUpdate } from '../views/update.js';
import { renderPreview } from '../views/preview.js';

export function toggleGroup(id) {
  const group = document.getElementById('group-' + id);
  if (group) group.classList.toggle('open');
}

export function show(view, updateHash = true) {
  state.currentView = view;
  if (updateHash) {
    window.location.hash = view;
  }
  document.querySelectorAll('.nav-item, .nav-child').forEach((el) => el.classList.remove('active'));
  const navEl = document.getElementById('nav-' + view);
  if (navEl) navEl.classList.add('active');
  // اگر view مربوط به گروه تنظیمات باشد، گروه را باز نگه دار
  if (['settings', 'color-scheme', 'typography'].includes(view)) {
    const group = document.getElementById('group-settings');
    if (group && !group.classList.contains('open')) group.classList.add('open');
  }
  if (['projects', 'categories'].includes(view)) {
    const group = document.getElementById('group-projects');
    if (group && !group.classList.contains('open')) group.classList.add('open');
  }
  if (['posts', 'post-categories'].includes(view)) {
    const group = document.getElementById('group-posts');
    if (group && !group.classList.contains('open')) group.classList.add('open');
  }
  render();
}

export function render() {
  if (state.currentView === 'dashboard') return renderDashboard();
  if (state.currentView === 'pages') return renderPages();
  if (state.currentView === 'menu') return renderMenu();
  if (state.currentView === 'page-edit') return renderPageEdit();
  if (state.currentView === 'projects') return renderProjects();
  if (state.currentView === 'categories') return renderCategories();
  if (state.currentView === 'resume') return renderResume();
  if (state.currentView === 'media') return renderMedia();
  if (state.currentView === 'settings') return renderSettings();
  if (state.currentView === 'theme' || state.currentView === 'color-scheme') return renderTheme();
  if (state.currentView === 'typography') return renderTypography();
  if (state.currentView === 'publish') return renderPublish();
  if (state.currentView === 'project-edit') return renderProjectEdit();
  if (state.currentView === 'posts') return renderPosts();
  if (state.currentView === 'post-categories') return renderPostCategories();
    if (state.currentView === 'post-edit') return renderPostEdit();
  if (state.currentView === 'hero') return renderHero();
  if (state.currentView === 'update') return renderUpdate();
  if (state.currentView === 'preview') return renderPreview();
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1);
  if (hash && hash !== state.currentView) {
    show(hash, false);
  }
});
