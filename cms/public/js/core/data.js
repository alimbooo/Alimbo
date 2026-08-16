import { state } from './state.js';
import { api } from './api.js';
import { show, render } from './router.js';

export async function loadAll() {
  const [siteData, categoriesData, resumeData, projectsData, pagesData, menuData, postsData] = await Promise.all([
    api('/api/site'),
    api('/api/categories').then(d => {
      // transform from { projects: [...], posts: [...] } to array
      if (Array.isArray(d)) return d; // fallback
      const cats = [];
      if (d.projects) cats.push(...d.projects.map(c => ({...c, type: 'projects'})));
      if (d.posts) cats.push(...d.posts.map(c => ({...c, type: 'posts'})));
      return cats;
    }),
    api('/api/resume'),
    api('/api/projects'),
    api('/api/pages').catch(()=>[]),
    api('/api/menu').catch(()=>[]),
    api('/api/posts').catch(()=>[])
  ]);

  state.site = siteData;
  state.categories = categoriesData;
  state.resume = resumeData;
  state.projects = projectsData;
  state.pagesList = pagesData;
  state.siteMenu = menuData;
  state.posts = postsData;

  const hash = window.location.hash.slice(1);
  if (hash) {
    show(hash, false);
  } else {
    render();
  }
}

export async function loadFonts() {
  state.fonts = await api('/api/fonts');
}

export async function loadMedia() {
  state.media = await api('/api/media');
}
