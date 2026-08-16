import { state, dom } from '../core/state.js';

export function renderDashboard() {
  dom.content.innerHTML = `<h2>داشبورد</h2><p class="sub">خلاصه‌ای از وضعیت محتوای شما.</p>
    <div class="grid2">
      <div class="card"><h3>${state.projects.length}</h3><p>پروژه‌ها</p></div>
      <div class="card"><h3>${state.categories.length}</h3><p>دسته‌ها</p></div>
    </div>
    `;
}
