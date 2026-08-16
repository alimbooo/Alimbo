import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const errors = [];
const fail = (msg) => errors.push(msg);
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

function validate() {
  // site.json
  const site = readJson('content/site.json');
  if (!site.name) fail('site.json: name is required');
  if (!site.title) fail('site.json: title is required');
  if (!site.theme) fail('site.json: theme is required');
  if (site.theme && !['light', 'dark', 'system'].includes(site.theme.mode)) fail('site.json: theme.mode must be light, dark, or system');

  // categories.json
  const categoriesRaw = readJson('content/categories.json');
  const projectCats = categoriesRaw.projects || [];
  const postCats = categoriesRaw.posts || [];

  const projectCatSlugs = new Set();
  const postCatSlugs = new Set();

  for (const cat of projectCats) {
    if (!cat.slug) fail('project category missing slug');
    if (projectCatSlugs.has(cat.slug)) fail(`duplicate project category slug: ${cat.slug}`);
    projectCatSlugs.add(cat.slug);
    if (cat.parent && !projectCatSlugs.has(cat.parent) && !projectCats.find((c) => c.slug === cat.parent)) fail(`project category "${cat.slug}" has invalid parent "${cat.parent}"`);
  }

  for (const cat of postCats) {
    if (!cat.slug) fail('post category missing slug');
    if (postCatSlugs.has(cat.slug)) fail(`duplicate post category slug: ${cat.slug}`);
    postCatSlugs.add(cat.slug);
    if (cat.parent && !postCatSlugs.has(cat.parent) && !postCats.find((c) => c.slug === cat.parent)) fail(`post category "${cat.slug}" has invalid parent "${cat.parent}"`);
  }

  // circular check
  const checkCircular = (cats) => {
    for (const cat of cats) {
      let current = cat;
      const seen = new Set();
      while (current && current.parent) {
        if (seen.has(current.slug)) { fail(`circular category reference: ${cat.slug}`); break; }
        seen.add(current.slug);
        current = cats.find((c) => c.slug === current.parent);
      }
    }
  };
  checkCircular(projectCats);
  checkCircular(postCats);

  // projects
  const dir = path.join(root, 'content/projects');
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const parsed = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
      const d = parsed.data;
      if (!d.slug) fail(`${file}: slug is required`);
      if (!d.title) fail(`${file}: title is required`);
      if (d.categories) for (const c of d.categories) if (!projectCatSlugs.has(c)) fail(`${file}: invalid category "${c}"`);
      if (d.videoMode && !['youtube', 'embed', 'none'].includes(d.videoMode)) fail(`${file}: invalid videoMode`);
      if (d.cover && !fs.existsSync(path.join(root, 'public', d.cover.replace(/^\//, '')))) fail(`${file}: cover image not found: ${d.cover}`);
    }
  }

  // blog posts
  const blogDir = path.join(root, 'content/blog');
  if (fs.existsSync(blogDir)) {
    for (const file of fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'))) {
      const parsed = matter(fs.readFileSync(path.join(blogDir, file), 'utf8'));
      const d = parsed.data;
      if (!d.slug) fail(`${file}: slug is required`);
      if (!d.title) fail(`${file}: title is required`);
      if (d.categories) for (const c of d.categories) if (!postCatSlugs.has(c)) fail(`${file}: invalid post category "${c}"`);
      if (d.videoMode && !['youtube', 'embed', 'none'].includes(d.videoMode)) fail(`${file}: invalid videoMode`);
      if (d.cover && !fs.existsSync(path.join(root, 'public', d.cover.replace(/^\//, '')))) fail(`${file}: cover image not found: ${d.cover}`);
    }
  }

  // resume.json
  const resume = readJson('content/resume.json');
  if (!resume.summary) fail('resume.json: summary is required');

  if (errors.length) { console.error('\n❌ Validation failed:'); for (const e of errors) console.error('  - ' + e); process.exit(1); }
  console.log('✅ Content is valid.');
}

validate();
