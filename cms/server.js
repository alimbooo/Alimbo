import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import matter from 'gray-matter';

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const writeJson = (file, data) => fs.writeFileSync(path.join(root, file), JSON.stringify(data, null, 2) + '\n');
const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
const readBody = (req) => new Promise((resolve) => { let data = ''; req.on('data', (c) => (data += c)); req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } }); });
const readRawBody = (req) => new Promise((resolve) => { const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => resolve(Buffer.concat(chunks))); });

let devProcess = null;
let buildProcess = null;

const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.webp':'image/webp', '.woff2':'font/woff2', '.woff':'font/woff', '.ttf':'font/ttf', '.otf':'font/otf', '.ico':'image/x-icon' };

function postToMarkdown(data) {
  const fm = {
    title: data.title || '',
    slug: data.slug || '',
    description: data.description || '',
    cover: data.cover || '',
    date: data.date || '',
    categories: data.categories || [],
    template: data.template || 'image',
    videoSource: data.videoSource || 'host',
    videoUrl: data.videoUrl || '',
    images: data.images || [],
  };
  return matter.stringify(data.content || '', fm);
}

function projectToMarkdown(data) {
  const fm = {
    title: data.title || '',
    slug: data.slug || '',
    description: data.description || '',
    cover: data.cover || '',
    year: data.year || '',
    date: data.date || '',
    client: data.client || '',
    technologies: data.technologies || [],
    categories: data.categories || [],
    template: data.template || 'image',
    videoSource: data.videoSource || 'host',
    videoUrl: data.videoUrl || '',
    images: data.images || [],
  };
  return matter.stringify(data.content || '', fm);
}

function runCommand(cmd, args, label, res) {
  const proc = spawn(cmd, args, { cwd: root, shell: true });
  let output = '';
  proc.stdout.on('data', (d) => (output += d.toString()));
  proc.stderr.on('data', (d) => (output += d.toString()));
  proc.on('close', (code) => {
    if (res && !res.writableEnded) send(res, code === 0 ? 200 : 500, { ok: code === 0, output, code });
  });
  return proc;
}

function runGit(args) {
    return new Promise((resolve, reject) => {
      const proc = spawn('git.exe', args, {
        cwd: root,
        shell: false,
        windowsVerbatimArguments: false,
      });
  
      let output = '';
  
      proc.stdout.on('data', (d) => (output += d.toString()));
      proc.stderr.on('data', (d) => (output += d.toString()));
  
      proc.on('error', reject);
      proc.on('close', (code) => {
        resolve({
          code,
          output: output.trim(),
        });
      });
    });
  }

function randomCommitMessage() {
  const id = Math.random().toString(36).slice(2, 8);
  return `cms-update-${Date.now().toString(36)}-${id}`;
}

const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)$/;

function parseSemver(version) {
  const match = version.match(SEMVER_REGEX);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function isNewer(latest, current) {
  const l = parseSemver(latest);
  const c = parseSemver(current);
  if (!l || !c) return false;

  if (l.major > c.major) return true;
  if (l.major === c.major && l.minor > c.minor) return true;
  if (l.major === c.major && l.minor === c.minor && l.patch > c.patch) return true;
  return false;
}

function getLatestVersion(tags) {
  const validTags = tags.filter(t => SEMVER_REGEX.test(t));
  if (validTags.length === 0) return null;

  validTags.sort((a, b) => {
    const pa = parseSemver(a);
    const pb = parseSemver(b);
    if (pa.major !== pb.major) return pb.major - pa.major;
    if (pa.minor !== pb.minor) return pb.minor - pa.minor;
    return pb.patch - pa.patch;
  });

  return validTags[0];
}

const PRESERVED_DIRS = ['content', 'public'];

function backupPreservedDirs(backupRoot) {
  for (const dirName of PRESERVED_DIRS) {
    const src = path.join(root, dirName);
    if (fs.existsSync(src)) {
      fs.cpSync(src, path.join(backupRoot, dirName), { recursive: true });
    }
  }
}

function restorePreservedDirs(backupRoot) {
  for (const dirName of PRESERVED_DIRS) {
    const src = path.join(backupRoot, dirName);
    const dest = path.join(root, dirName);
    if (fs.existsSync(src)) {
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
      }
      fs.cpSync(src, dest, { recursive: true });
    }
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const method = req.method;
  const pathname = url.pathname;

  if (method === 'OPTIONS') return send(res, 200, '');

  // API routes
  if (pathname.startsWith('/api')) {
    try {
      if (pathname === '/api/site' && method === 'GET') return send(res, 200, readJson('content/site.json'));
      if (pathname === '/api/site' && method === 'POST') { const d = await readBody(req); writeJson('content/site.json', d); return send(res, 200, { ok: true }); }
      if (pathname === '/api/categories' && method === 'GET') return send(res, 200, readJson('content/categories.json'));
      if (pathname === '/api/categories' && method === 'POST') { const d = await readBody(req); writeJson('content/categories.json', d); return send(res, 200, { ok: true }); }
      if (pathname === '/api/resume' && method === 'GET') return send(res, 200, readJson('content/resume.json'));
      if (pathname === '/api/resume' && method === 'POST') { const d = await readBody(req); writeJson('content/resume.json', d); return send(res, 200, { ok: true }); }

      if (pathname === '/api/projects' && method === 'GET') {
        const dir = path.join(root, 'content/projects');
        const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')) : [];
        const projects = files.map((f) => { const parsed = matter(fs.readFileSync(path.join(dir, f), 'utf8')); return { ...parsed.data, content: parsed.content }; });
        return send(res, 200, projects);
      }
      if (pathname === '/api/projects' && method === 'POST') {
        const d = await readBody(req);
        if (!d.slug) return send(res, 400, { error: 'slug is required' });

        if (d.originalSlug && d.originalSlug !== d.slug) {
          const oldFile = path.join(root, 'content/projects', `${d.originalSlug}.md`);
          if (fs.existsSync(oldFile)) {
            fs.unlinkSync(oldFile);
          }
        }

        const file = path.join(root, 'content/projects', `${d.slug}.md`);
        fs.writeFileSync(file, projectToMarkdown(d));
        return send(res, 200, { ok: true });
      }
      if (pathname === '/api/projects' && method === 'DELETE') {
        const d = await readBody(req);
        const file = path.join(root, 'content/projects', `${d.slug}.md`);
        if (fs.existsSync(file)) fs.unlinkSync(file);
        return send(res, 200, { ok: true });
      }

      if (pathname === '/api/posts' && method === 'GET') {
        const dir = path.join(root, 'content/blog');
        const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')) : [];
        const posts = files.map((f) => { const parsed = matter(fs.readFileSync(path.join(dir, f), 'utf8')); return { ...parsed.data, content: parsed.content }; });
        return send(res, 200, posts);
      }
      if (pathname === '/api/posts' && method === 'POST') {
        const d = await readBody(req);
        if (!d.slug) return send(res, 400, { error: 'slug is required' });

        if (d.originalSlug && d.originalSlug !== d.slug) {
          const oldFile = path.join(root, 'content/blog', `${d.originalSlug}.md`);
          if (fs.existsSync(oldFile)) {
            fs.unlinkSync(oldFile);
          }
        }

        const file = path.join(root, 'content/blog', `${d.slug}.md`);
        fs.writeFileSync(file, postToMarkdown(d));
        return send(res, 200, { ok: true });
      }
      if (pathname === '/api/posts' && method === 'DELETE') {
        const d = await readBody(req);
        const file = path.join(root, 'content/blog', `${d.slug}.md`);
        if (fs.existsSync(file)) fs.unlinkSync(file);
        return send(res, 200, { ok: true });
      }

      if (pathname === '/api/menu' && method === 'GET') {
        return send(res, 200, fs.existsSync(path.join(root, 'content/menu.json')) ? readJson('content/menu.json') : []);
      }
      if (pathname === '/api/menu' && method === 'POST') {
        const d = await readBody(req);
        writeJson('content/menu.json', d);
        return send(res, 200, { ok: true });
      }

      if (pathname === '/api/pages' && method === 'GET') {
        const dir = path.join(root, 'content/pages');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
        const pages = files.map((f) => { const parsed = matter(fs.readFileSync(path.join(dir, f), 'utf8')); return { ...parsed.data, content: parsed.content }; });
        return send(res, 200, pages);
      }
      if (pathname === '/api/pages' && method === 'POST') {
        const d = await readBody(req);
        if (!d.slug) return send(res, 400, { error: 'slug is required' });
        const file = path.join(root, 'content/pages', `${d.slug}.md`);
        const fm = { title: d.title || '', slug: d.slug || '' };
        fs.writeFileSync(file, matter.stringify(d.content || '', fm));
        return send(res, 200, { ok: true });
      }
      if (pathname === '/api/pages' && method === 'DELETE') {
        const d = await readBody(req);
        const file = path.join(root, 'content/pages', `${d.slug}.md`);
        if (fs.existsSync(file)) fs.unlinkSync(file);
        return send(res, 200, { ok: true });
      }

      // Media API
      if (pathname === '/api/media' && method === 'GET') {
        const dir = url.searchParams.get('dir') || '';
        const mediaPath = path.join(root, 'public/media', dir);
        if (!fs.existsSync(mediaPath)) return send(res, 200, []);
        return send(res, 200, fs.readdirSync(mediaPath).filter((f) => !f.startsWith('.')).map((f) => { const stat = fs.statSync(path.join(mediaPath, f)); return { name: f, size: stat.size, path: `/media/${dir ? dir + '/' : ''}${f}` }; }));
      }
      if (pathname === '/api/media' && method === 'POST') {
        const dir = url.searchParams.get('dir') || '';
        const name = url.searchParams.get('name') || 'upload.bin';
        const mediaPath = path.join(root, 'public/media', dir);
        if (!fs.existsSync(mediaPath)) fs.mkdirSync(mediaPath, { recursive: true });
        const buffer = await readRawBody(req);
        fs.writeFileSync(path.join(mediaPath, name), buffer);
        return send(res, 200, { ok: true, path: `/media/${dir ? dir + '/' : ''}${name}` });
      }
      if (pathname === '/api/media' && method === 'DELETE') {
        const d = await readBody(req);
        const file = path.join(root, 'public/media', d.path.replace('/media/', ''));
        if (fs.existsSync(file)) fs.unlinkSync(file);
        return send(res, 200, { ok: true });
      }

      // Font API
      if (pathname === '/api/fonts' && method === 'GET') {
        const fontDir = path.join(root, 'public/fonts');
        if (!fs.existsSync(fontDir)) return send(res, 200, []);
        const fonts = [];
        for (const f of fs.readdirSync(fontDir)) {
          const ext = path.extname(f).toLowerCase();
          if (!['.woff2','.woff','.ttf','.otf'].includes(ext)) continue;
          const stat = fs.statSync(path.join(fontDir, f));
          fonts.push({ name: f, path: `/fonts/${f}`, size: stat.size, format: ext.slice(1) });
        }
        return send(res, 200, fonts);
      }
      if (pathname === '/api/fonts' && method === 'POST') {
        const name = url.searchParams.get('name') || 'font.bin';
        const fontDir = path.join(root, 'public/fonts');
        if (!fs.existsSync(fontDir)) fs.mkdirSync(fontDir, { recursive: true });
        const buffer = await readRawBody(req);
        fs.writeFileSync(path.join(fontDir, name), buffer);
        return send(res, 200, { ok: true, path: `/fonts/${name}` });
      }
      if (pathname === '/api/fonts' && method === 'DELETE') {
        const d = await readBody(req);
        const file = path.join(root, 'public/fonts', path.basename(d.path));
        if (fs.existsSync(file)) fs.unlinkSync(file);
        return send(res, 200, { ok: true });
      }

      // Dev server
      if (pathname === '/api/dev' && method === 'POST') {
        if (devProcess && !devProcess.killed) return send(res, 200, { ok: true, message: 'already running' });
        devProcess = spawn('npm', ['run', 'dev'], { cwd: root, shell: true, stdio: 'ignore' });
        return send(res, 200, { ok: true, message: 'started' });
      }

      // Build
      if (pathname === '/api/build' && method === 'POST') {
        if (buildProcess && !buildProcess.killed) return send(res, 200, { ok: false, message: 'build already running' });
        buildProcess = runCommand('npm', ['run', 'build'], 'build', res);
        return;
      }

      // Git status
      if (pathname === '/api/git/status' && method === 'GET') {
        const status = await runGit(['status', '--porcelain']);
        const remote = await runGit(['remote', 'get-url', 'origin']);
        const branch = await runGit(['branch', '--show-current']);
        return send(res, 200, {
          ok: true,
          hasChanges: Boolean(status.output),
          changes: status.output,
          remote: remote.code === 0 ? remote.output : '',
          branch: branch.output || '',
        });
      }

      // Test endpoint
      if (pathname === '/api/test' && method === 'POST') {
        const testProc = spawn('npm', ['run', 'test'], { cwd: root, shell: true });
        let output = '';
        testProc.stdout.on('data', (d) => (output += d.toString()));
        testProc.stderr.on('data', (d) => (output += d.toString()));
        return new Promise((resolve) => {
          testProc.on('close', (code) => {
            resolve(send(res, code === 0 ? 200 : 500, { ok: code === 0, output }));
          });
        });
      }

      // ==================== Update Check ====================
      if (pathname === '/api/update/check' && method === 'GET') {
        try {
          const versionFile = path.join(root, 'VERSION');
          let currentVersion = '0.0.0';
          if (fs.existsSync(versionFile)) {
            currentVersion = fs.readFileSync(versionFile, 'utf8').trim();
          }

          await runGit(['fetch', 'upstream', '--tags']).catch(() => {});

          const tagsRes = await runGit(['tag', '-l']);
          let latestVersion = currentVersion;

          if (tagsRes.code === 0 && tagsRes.output) {
            const tags = tagsRes.output.split('\n').map(t => t.trim()).filter(Boolean);
            const found = getLatestVersion(tags);
            if (found) latestVersion = found;
          }

          const updateAvailable = isNewer(latestVersion, currentVersion);

          return send(res, 200, { currentVersion, latestVersion, updateAvailable });
        } catch (err) {
          return send(res, 500, { error: err.message || String(err) });
        }
      }

      // ==================== Update Start ====================
      if (pathname === '/api/update/start' && method === 'POST') {
        const backupDir = path.join(path.dirname(root), `backup-update-${Date.now()}`);
        try {
          const statusRes = await runGit(['status', '--porcelain']);
          if (statusRes.code !== 0) throw new Error('Failed to check git status.');
          if (statusRes.output.trim() !== '') {
            return send(res, 400, { error: 'Your git working tree is not clean. Please commit or push your changes first.' });
          }

          const versionFile = path.join(root, 'VERSION');
          let currentVersion = '0.0.0';
          if (fs.existsSync(versionFile)) {
            currentVersion = fs.readFileSync(versionFile, 'utf8').trim();
          }

          const fetchRes = await runGit(['fetch', 'upstream', '--tags']);
          if (fetchRes.code !== 0) throw new Error('Failed to fetch tags from upstream.');

          const tagsRes = await runGit(['tag', '-l']);
          if (tagsRes.code !== 0) throw new Error('Failed to list tags.');

          let latestVersion = currentVersion;
          const tags = tagsRes.output.split('\n').map(t => t.trim()).filter(Boolean);
          const found = getLatestVersion(tags);
          if (found) latestVersion = found;

          if (!isNewer(latestVersion, currentVersion)) {
            return send(res, 400, { error: 'You are already on the latest version.' });
          }

          // Backup step
          try {
            backupPreservedDirs(backupDir);
          } catch (e) {
            throw new Error('Failed to backup content/public directories: ' + e.message);
          }

          // Full Replacement step
          const rmRes = await runGit(['rm', '-rf', '.']);
          if (rmRes.code !== 0 && !rmRes.output.includes('did not match any files')) {
            throw new Error('Git rm failed: ' + rmRes.output);
          }

          const checkoutRes = await runGit(['checkout', latestVersion, '--', '.']);
          if (checkoutRes.code !== 0) throw new Error('Git checkout failed: ' + checkoutRes.output);

          const cleanRes = await runGit(['clean', '-fd']);
          if (cleanRes.code !== 0) throw new Error('Git clean failed: ' + cleanRes.output);

          // Restore content and public
          if (fs.existsSync(backupDir)) {
            restorePreservedDirs(backupDir);
          }

          // Update VERSION
          fs.writeFileSync(versionFile, latestVersion + '\n');

          // Validate everything and commit
          const addRes = await runGit(['add', '-A']);
          if (addRes.code !== 0) throw new Error('Git add failed: ' + addRes.output);

          const commitRes = await runGit(['commit', '-m', `Update template to ${latestVersion}`]);
          if (commitRes.code !== 0 && !commitRes.output.includes('nothing to commit')) {
            throw new Error('Git commit failed: ' + commitRes.output);
          }

          const pushRes = await runGit(['push', 'origin', 'HEAD']);
          if (pushRes.code !== 0) {
            throw new Error('Git push failed: ' + pushRes.output);
          }

          // If everything succeeds, remove the backup
          if (fs.existsSync(backupDir)) {
            fs.rmSync(backupDir, { recursive: true, force: true });
          }

          return send(res, 200, { newVersion: latestVersion });
        } catch (err) {
          // On failure, rollback working directory as much as possible
          await runGit(['reset', '--hard', 'HEAD']).catch(() => {});
          await runGit(['clean', '-fd']).catch(() => {});
          if (fs.existsSync(backupDir)) {
            restorePreservedDirs(backupDir);
          }
          return send(res, 500, { error: err.message || String(err) });
        }
      }

      // Publish to GitHub
      if (pathname === '/api/publish' && method === 'POST') {
        const status = await runGit(['status', '--porcelain']);
        if (!status.output) {
          return send(res, 200, { ok: true, noChanges: true, message: 'تغییری ایجاد نشده' });
        }

        const steps = [];
        const add = await runGit(['add', '-A']);
        steps.push({ step: 'git add', ok: add.code === 0, output: add.output });
        if (add.code !== 0) return send(res, 500, { ok: false, steps });

        const message = randomCommitMessage();
        const commit = await runGit(['commit', '-m', message]);
        steps.push({ step: 'git commit', ok: commit.code === 0, output: commit.output, message });
        if (commit.code !== 0) return send(res, 500, { ok: false, steps });

        const push = await runGit(['push']);
        steps.push({ step: 'git push', ok: push.code === 0, output: push.output });
        const allOk = steps.every((s) => s.ok);
        return send(res, allOk ? 200 : 500, { ok: allOk, steps, message });
      }

      return send(res, 404, { error: 'not found' });
    } catch (e) {
      return send(res, 500, { error: String(e) });
    }
  }

  // Serve static files from public/ (media, fonts) then cms/public/
  if (pathname !== '/') {
    const publicFile = path.join(root, 'public', pathname);
    if (fs.existsSync(publicFile) && fs.statSync(publicFile).isFile()) {
      const type = MIME[path.extname(publicFile)] || 'application/octet-stream';
      return send(res, 200, fs.readFileSync(publicFile), type);
    }
  }

  // Serve CMS static files
  const filePath = path.join(root, 'cms/public', pathname === '/' ? 'index.html' : pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const type = MIME[path.extname(filePath)] || 'text/plain';
    return send(res, 200, fs.readFileSync(filePath), type);
  }
  return send(res, 404, 'not found');
});

server.listen(3100, () => console.log('CMS running at http://localhost:3100'));