import fs from 'fs';
import path from 'path';

function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (url === '') return '';
  url = url.replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}


let basePath = '';
let baseUrl = 'https://example.github.io';

try {
  const siteConfigPath = path.join(process.cwd(), 'content', 'site.json');
  if (fs.existsSync(siteConfigPath)) {
    const siteConfig = JSON.parse(fs.readFileSync(siteConfigPath, 'utf8'));
    if (siteConfig.siteUrl) {
      try {
        const normalized = normalizeUrl(siteConfig.siteUrl);
        const urlObj = new URL(normalized);
        baseUrl = normalized;
        if (process.env.NODE_ENV !== 'development') {
          let pathname = urlObj.pathname;
          if (pathname !== '/') {
            basePath = pathname.replace(/\/+$/, ''); // Remove trailing slash
          }
        }
      } catch (e) {
        console.warn('Failed to parse siteUrl from site.json');
      }
    }
  }
} catch (e) {
  console.error('Error computing basePath:', e);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath || '',
    NEXT_PUBLIC_BASE_URL: baseUrl,
  },
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
    );
    if (fileLoaderRule) {
      config.module.rules.push(
        {
          ...fileLoaderRule,
          test: /\.svg$/i,
          resourceQuery: /url/,
        },
        {
          test: /\.svg$/i,
          issuer: fileLoaderRule.issuer,
          resourceQuery: { not: [...(fileLoaderRule.resourceQuery?.not || []), /url/] },
          use: ['@svgr/webpack'],
        }
      );
      fileLoaderRule.exclude = /\.svg$/i;
    } else {
       config.module.rules.push({
          test: /\.svg$/,
          use: ['@svgr/webpack'],
       });
    }
    return config;
  },
};
export default nextConfig;
