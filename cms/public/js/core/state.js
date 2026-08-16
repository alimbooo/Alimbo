export const state = {
  currentView: 'pages',
  projects: [],
  pagesList: [],
  siteMenu: [],
  editingPage: null,
  categories: [],
  posts: [],
    editingPost: null,
  site: {},
  resume: {},
  media: [],
  fonts: [],
  editingProject: null,
  publishStatus: '',
  draggedMenuIndex: null,
  mediaModalCallback: null
};

export const dom = {
  get content() { return document.getElementById('content'); }
};
