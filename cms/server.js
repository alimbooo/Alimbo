import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import matter from 'gray-matter';

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const writeJson = (file, data) => fs.writeFileSync(path.join(root, file), JSON.stringify(data, null, 2) + '\n');
const send = (res, status, body, type = 'application/json') => {
  if (res.writableEnded || res.destroyed) return;
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
      const gitCmd = process.platform === 'win32' ? 'git.exe' : 'git';
      const proc = spawn(gitCmd, args, {
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

function runCommandAsync(cmd, args, opts = {}) {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, {
        cwd: opts.cwd || root,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (d) => (stdout += d.toString()));
      proc.stderr.on('data', (d) => (stderr += d.toString()));
      proc.on('error', reject);
      proc.on('close', (code) => {
        resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
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

// ----- Update helpers -----

// Directories and files to skip during full backup (generated, caches, large binaries)
const BACKUP_SKIP = new Set([
  'node_modules', '.next', 'out', '.git',
  '.freebuff', '.github',
  'backup-update-', // prefix match
]);

function readGitignorePatterns() {
  const patterns = [];
  const gitignorePath = path.join(root, '.gitignore');
  if (!fs.existsSync(gitignorePath)) return patterns;
  const lines = fs.readFileSync(gitignorePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    let p = trimmed;
    // Remove trailing slash for directory matching
    const isDirPattern = p.endsWith('/');
    if (isDirPattern) p = p.slice(0, -1);
    // Strip leading slash
    if (p.startsWith('/')) p = p.slice(1);
    if (!p) continue;
    patterns.push({ raw: p, isDir: isDirPattern });
  }
  return patterns;
}

function isSkippedByGitignore(name, isDir, patterns) {
  for (const pat of patterns) {
    // Simple glob matching: support * and ** prefixes
    if (pat.raw.startsWith('**/')) {
      const suffix = pat.raw.slice(3);
      if (name === suffix || name.endsWith('/' + suffix)) return true;
      continue;
    }
    if (pat.raw.includes('*')) {
      // Simple glob: *.log, .env*.local
      const regex = new RegExp('^' + pat.raw.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      if (regex.test(name)) return true;
      continue;
    }
    if (name === pat.raw) return true;
    if (name.startsWith(pat.raw + '/')) return true;
  }
  return false;
}

function shouldSkipBackup(name, isDir, gitignorePatterns) {
  if (BACKUP_SKIP.has(name)) return true;
  // Skip any backup directories from previous runs
  if (name.startsWith('backup-update-')) return true;
  if (isSkippedByGitignore(name, isDir, gitignorePatterns)) return true;
  return false;
}

function fullBackup(backupDir, sendEvent) {
  const gitignorePatterns = readGitignorePatterns();
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const entries = fs.readdirSync(root);
  for (const entry of entries) {
    const fullPath = path.join(root, entry);
    let stat;
    try { stat = fs.statSync(fullPath); } catch { continue; }
    if (shouldSkipBackup(entry, stat.isDirectory(), gitignorePatterns)) continue;

    const dest = path.join(backupDir, entry);
    if (stat.isDirectory()) {
      fs.cpSync(fullPath, dest, { recursive: true });
    } else {
      fs.copyFileSync(fullPath, dest);
    }
  }
}

function fullRestore(backupDir, sendEvent) {
  if (!fs.existsSync(backupDir)) throw new Error('Backup directory not found: ' + backupDir);

  const entries = fs.readdirSync(backupDir);
  // Remove current project files (except .git, node_modules, .next)
  const currentEntries = fs.readdirSync(root);
  for (const entry of currentEntries) {
    if (entry === '.git' || entry === 'node_modules' || entry === '.next') continue;
    if (entry.startsWith('backup-update-')) continue;
    try {
      fs.rmSync(path.join(root, entry), { recursive: true, force: true });
    } catch { /* best effort */ }
  }

  // Copy backup entries back
  for (const entry of entries) {
    const src = path.join(backupDir, entry);
    const dest = path.join(root, entry);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

function restoreContentOnly(backupDir) {
  for (const dirName of ['content', 'public']) {
    const src = path.join(backupDir, dirName);
    const dest = path.join(root, dirName);
    if (fs.existsSync(src)) {
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
      }
      fs.cpSync(src, dest, { recursive: true });
    }
  }
}

function depsChanged(oldBackupDir) {
  const oldPkg = path.join(oldBackupDir, 'package-lock.json');
  const newPkg = path.join(root, 'package-lock.json');
  if (!fs.existsSync(oldPkg) || !fs.existsSync(newPkg)) return true;
  const oldContent = fs.readFileSync(oldPkg, 'utf8');
  const newContent = fs.readFileSync(newPkg, 'utf8');
  return oldContent !== newContent;
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

      if (pathname === '/api/categories/delete' && method === 'POST') {
        try {
          const d = await readBody(req);
          const slug = d.slug;
          if (!slug) return send(res, 400, { error: 'شناسه دسته الزامی است' });

          const cats = readJson('content/categories.json');

          // Collect all descendant slugs recursively
          const toDelete = new Set();
          const queue = [slug];
          while (queue.length) {
            const cur = queue.pop();
            if (toDelete.has(cur)) continue;
            toDelete.add(cur);
            for (const key of ['projects', 'posts']) {
              for (const c of (cats[key] || [])) {
                if (c.parent === cur && !toDelete.has(c.slug)) {
                  queue.push(c.slug);
                }
              }
            }
          }

          // Remove from categories.json
          for (const key of ['projects', 'posts']) {
            cats[key] = (cats[key] || []).filter(c => !toDelete.has(c.slug));
          }
          writeJson('content/categories.json', cats);

          // Remove references from all project .md files
          const projectsDir = path.join(root, 'content/projects');
          if (fs.existsSync(projectsDir)) {
            for (const f of fs.readdirSync(projectsDir).filter(f => f.endsWith('.md'))) {
              const filePath = path.join(projectsDir, f);
              const parsed = matter(fs.readFileSync(filePath, 'utf8'));
              if (Array.isArray(parsed.data.categories)) {
                const filtered = parsed.data.categories.filter(c => !toDelete.has(c));
                if (filtered.length !== parsed.data.categories.length) {
                  const updated = matter.stringify(parsed.content, { ...parsed.data, categories: filtered });
                  fs.writeFileSync(filePath, updated);
                }
              }
            }
          }

          // Remove references from all blog post .md files
          const blogDir = path.join(root, 'content/blog');
          if (fs.existsSync(blogDir)) {
            for (const f of fs.readdirSync(blogDir).filter(f => f.endsWith('.md'))) {
              const filePath = path.join(blogDir, f);
              const parsed = matter(fs.readFileSync(filePath, 'utf8'));
              if (Array.isArray(parsed.data.categories)) {
                const filtered = parsed.data.categories.filter(c => !toDelete.has(c));
                if (filtered.length !== parsed.data.categories.length) {
                  const updated = matter.stringify(parsed.content, { ...parsed.data, categories: filtered });
                  fs.writeFileSync(filePath, updated);
                }
              }
            }
          }

          return send(res, 200, { ok: true, deletedCount: toDelete.size });
        } catch (e) {
          return send(res, 500, { error: 'خطا در حذف دسته: ' + (e.message || String(e)) });
        }
      }

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

        try {
          const dir = path.join(root, 'content/projects');
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

          if (d.originalSlug && d.originalSlug !== d.slug) {
            const oldFile = path.join(dir, `${d.originalSlug}.md`);
            if (fs.existsSync(oldFile)) {
              fs.unlinkSync(oldFile);
            }
          }

          const file = path.join(dir, `${d.slug}.md`);
          fs.writeFileSync(file, projectToMarkdown(d));
          return send(res, 200, { ok: true });
        } catch (e) {
          return send(res, 500, { error: 'خطا در ذخیره پروژه: ' + (e.message || String(e)) });
        }
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

        try {
          const dir = path.join(root, 'content/blog');
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

          if (d.originalSlug && d.originalSlug !== d.slug) {
            const oldFile = path.join(dir, `${d.originalSlug}.md`);
            if (fs.existsSync(oldFile)) {
              fs.unlinkSync(oldFile);
            }
          }

          const file = path.join(dir, `${d.slug}.md`);
          fs.writeFileSync(file, postToMarkdown(d));
          return send(res, 200, { ok: true });
        } catch (e) {
          return send(res, 500, { error: 'خطا در ذخیره نوشته: ' + (e.message || String(e)) });
        }
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

      // ==================== Preview server ====================
      // Health-check the local Next.js dev server
      const isPreviewRunning = async () => {
        try {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), 2000);
          try {
            const resp = await fetch('http://localhost:3000', { signal: controller.signal, cache: 'no-store' });
            return resp.ok || resp.status === 404 || resp.status === 200;
          } finally {
            clearTimeout(t);
          }
        } catch (_) {
          return false;
        }
      };

      // Terminate the whole process tree spawned by this server (cmd/npm wrapper + Next.js child).
      // On Windows, .kill() only kills the cmd.exe wrapper, so use taskkill /T /F for the full tree.
      const killPreviewTree = async () => {
        const proc = devProcess;
        if (!proc || !proc.pid) return false;
        const pid = proc.pid;
        try {
          if (process.platform === 'win32') {
            await new Promise((resolve) => {
              const killer = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
              killer.on('close', resolve);
              killer.on('error', resolve);
            });
          } else {
            // detached:true gives the spawned shell its own process group; kill the whole group
            try { process.kill(-pid, 'SIGTERM'); } catch (_) { try { process.kill(pid, 'SIGTERM'); } catch (__) {} }
            // Grace period, then escalate to SIGKILL in case children ignore SIGTERM
            await new Promise((r) => setTimeout(r, 2000));
            try { process.kill(-pid, 'SIGKILL'); } catch (_) { try { process.kill(pid, 'SIGKILL'); } catch (__) {} }
          }
        } catch (_) {
          try { proc.kill(); } catch (__) {}
        }
        return true;
      };

      const waitForPortFree = async (timeoutMs = 10000) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          if (!(await isPreviewRunning())) return true;
          await new Promise((r) => setTimeout(r, 300));
        }
        return !(await isPreviewRunning());
      };

      if (pathname === '/api/preview/status' && method === 'GET') {
        const running = await isPreviewRunning();
        return send(res, 200, { running, url: 'http://localhost:3000' });
      }

      if (pathname === '/api/preview/start' && method === 'POST') {
        // Already responding — do not start another process
        if (await isPreviewRunning()) {
          return send(res, 200, { ok: true, alreadyRunning: true, url: 'http://localhost:3000' });
        }
        // Our own process exists but isn't answering yet (still booting) — don't double-spawn
        if (devProcess && !devProcess.killed) {
          return send(res, 200, { ok: true, starting: true, url: 'http://localhost:3000' });
        }
        // detached:true so the tree can be killed as a group on POSIX; on Windows taskkill /T walks the tree
        devProcess = spawn('npm', ['run', 'dev'], { cwd: root, shell: true, stdio: 'ignore', detached: true });
        devProcess.on('exit', () => { devProcess = null; });
        return send(res, 200, { ok: true, started: true, url: 'http://localhost:3000' });
      }

      if (pathname === '/api/preview/stop' && method === 'POST') {
        // Only terminate a process this server started (devProcess is only ever set when we spawn).
        // A pre-existing server is never touched — devProcess stays null for it.
        let stopped = false;
        if (devProcess) {
          stopped = await killPreviewTree();
          devProcess = null; // clear stored state immediately — refresh must not see the old preview
          // Do not report success until the port is actually released
          const portFree = await waitForPortFree();
          return send(res, 200, { ok: true, stopped, portFree });
        }
        // Nothing of ours to stop — never wait on or touch an unrelated process
        return send(res, 200, { ok: true, stopped: false, portFree: !(await isPreviewRunning()) });
      }

      // Legacy alias kept for compatibility
      if (pathname === '/api/dev' && method === 'POST') {
        if (await isPreviewRunning()) return send(res, 200, { ok: true, message: 'already running' });
        if (devProcess && !devProcess.killed) return send(res, 200, { ok: true, message: 'already running' });
        devProcess = spawn('npm', ['run', 'dev'], { cwd: root, shell: true, stdio: 'ignore', detached: true });
        devProcess.on('exit', () => { devProcess = null; });
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

      // ==================== Update Start (SSE) ====================
      if (pathname === '/api/update/start' && method === 'POST') {
        // Set SSE headers
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'X-Accel-Buffering': 'no',
        });

        const sse = (event, data) => {
          if (res.writableEnded || res.destroyed) return;
          res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        const backupDir = path.join(path.dirname(root), `backup-update-${Date.now()}`);
        const versionFile = path.join(root, 'VERSION');
        let latestVersion = '';
        let currentVersion = '0.0.0';
        let rollbackNeeded = false;
        let backupCreated = false;

        try {
          // --- Step: preparing ---
          sse('step', { step: 'preparing', status: 'running' });

          const statusRes = await runGit(['status', '--porcelain']);
          if (statusRes.code !== 0) throw new Error('Failed to check git status.');
          if (statusRes.output.trim() !== '') {
            throw new Error('مخزن گیت تغییرات ذخیره‌نشده دارد. لطفاً ابتدا تغییرات خود را منتشر کنید.');
          }

          if (fs.existsSync(versionFile)) {
            currentVersion = fs.readFileSync(versionFile, 'utf8').trim();
          }

          const fetchRes = await runGit(['fetch', 'upstream', '--tags']);
          if (fetchRes.code !== 0) throw new Error('Failed to fetch tags from upstream.');

          const tagsRes = await runGit(['tag', '-l']);
          if (tagsRes.code !== 0) throw new Error('Failed to list tags.');

          latestVersion = currentVersion;
          const tags = tagsRes.output.split('\n').map(t => t.trim()).filter(Boolean);
          const found = getLatestVersion(tags);
          if (found) latestVersion = found;

          if (!isNewer(latestVersion, currentVersion)) {
            throw new Error('شما از آخرین نسخه استفاده می‌کنید.');
          }

          sse('step', { step: 'preparing', status: 'done' });

          // --- Step: creating backup ---
          sse('step', { step: 'backup', status: 'running' });
          fullBackup(backupDir, sse);
          backupCreated = true;
          sse('step', { step: 'backup', status: 'done' });

          // --- Step: downloading & applying update ---
          sse('step', { step: 'download', status: 'running' });

          const rmRes = await runGit(['rm', '-rf', '.']);
          if (rmRes.code !== 0 && !rmRes.output.includes('did not match any files')) {
            throw new Error('Git rm failed: ' + rmRes.output);
          }

          const checkoutRes = await runGit(['checkout', latestVersion, '--', '.']);
          if (checkoutRes.code !== 0) throw new Error('Git checkout failed: ' + checkoutRes.output);

          const cleanRes = await runGit(['clean', '-fd']);
          if (cleanRes.code !== 0) throw new Error('Git clean failed: ' + cleanRes.output);

          sse('step', { step: 'download', status: 'done' });

          // --- Step: restoring user content ---
          sse('step', { step: 'restore_content', status: 'running' });
          restoreContentOnly(backupDir);
          sse('step', { step: 'restore_content', status: 'done' });

          // --- Step: installing dependencies ---
          if (depsChanged(backupDir)) {
            sse('step', { step: 'deps_install', status: 'running' });
            const installRes = await runCommandAsync('npm', ['ci'], { cwd: root });
            if (installRes.code !== 0) {
              throw new Error('npm ci failed:\n' + (installRes.stderr || installRes.stdout));
            }
            sse('step', { step: 'deps_install', status: 'done' });
          } else {
            sse('step', { step: 'deps_install', status: 'skipped', reason: 'بدون تغییر' });
          }

          // --- Step: running tests ---
          sse('step', { step: 'test', status: 'running' });
          const testRes = await runCommandAsync('npm', ['run', 'test'], { cwd: root });
          if (testRes.code !== 0) {
            throw new Error('npm run test failed with code ' + testRes.code + ':\n' + (testRes.stderr || testRes.stdout));
          }
          sse('step', { step: 'test', status: 'done' });

          // --- Step: finalizing ---
          sse('step', { step: 'finalize', status: 'running' });

          fs.writeFileSync(versionFile, latestVersion + '\n');

          const addRes = await runGit(['add', '-A']);
          if (addRes.code !== 0) throw new Error('Git add failed: ' + addRes.output);

          const commitRes = await runGit(['commit', '-m', `Update template to ${latestVersion}`]);
          if (commitRes.code !== 0 && !commitRes.output.includes('nothing to commit')) {
            throw new Error('Git commit failed: ' + commitRes.output);
          }

          // No auto-push — user controls publishing
          sse('step', { step: 'finalize', status: 'done' });

          // Success — clean up backup
          if (fs.existsSync(backupDir)) {
            fs.rmSync(backupDir, { recursive: true, force: true });
          }

          sse('done', { newVersion: latestVersion });
        } catch (err) {
          const errorMsg = err.message || String(err);

          // Mark current step as failed
          sse('step', { status: 'error', error: errorMsg });

          // Attempt rollback if backup exists
          if (backupCreated) {
            rollbackNeeded = true;
            sse('action', { action: 'rollback_start' });

            try {
              const rollbackRes = await runGit(['reset', '--hard', 'HEAD']).catch(() => ({ code: -1 }));
              await runGit(['clean', '-fd']).catch(() => {});

              // Full restore from backup
              fullRestore(backupDir, sse);

              // Restore dependencies
              await runCommandAsync('npm', ['i'], { cwd: root });

              sse('action', { action: 'rollback_done', success: true });
            } catch (rollbackErr) {
              sse('action', { action: 'rollback_done', success: false, error: rollbackErr.message || String(rollbackErr) });
            }
          }

          sse('done', { error: errorMsg, rolledBack: rollbackNeeded });
        } finally {
          if (!res.writableEnded) {
            res.end();
          }
        }
        return; // response already streamed via SSE — never fall through to send()
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