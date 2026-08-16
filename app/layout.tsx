import { assetUrl, getBaseUrl } from '@/lib/url';
import type { Metadata } from 'next';
import './globals.css';
import { getSite } from '@/lib/content';
import { Header, Footer } from '@/components/layout';

export const dynamic = 'force-static';
export function generateMetadata(): Metadata {
  const site = getSite();
  return {
    title: String(site.seoTitle),
    description: String(site.seoDescription),
    metadataBase: new URL(getBaseUrl()),
    icons: site.favicon ? { icon: assetUrl(String(site.favicon)) } : undefined,
    openGraph: { title: String(site.seoTitle), description: String(site.seoDescription), images: [assetUrl(String(site.ogImage))] },
  };
}

type FontConfig = {
  source: 'builtin' | 'google' | 'custom';
  name: string;
  googleFamily?: string;
  customFont?: { path: string; format: string; isVariable: boolean; weights?: number[] };
};

function buildFontStyles(site: Record<string, unknown>): { headTags: React.ReactNode; bodyFont: string; headingFont: string } {
  const fonts = (site.fonts as FontConfig[]) || [];
  const typo = (site.typography as Record<string, string>) || {};

  const bodyFontName = typo.bodyFont || 'Tahoma';
  const headingFontName = typo.headingFont || bodyFontName;

  const headTags: React.ReactNode[] = [];

  // Find configurations for selected fonts
  const bodyConfig = fonts.find(f => f.name === bodyFontName);
  const headingConfig = fonts.find(f => f.name === headingFontName);

  const processConfig = (config: FontConfig | undefined) => {
    if (!config) return;
    if (config.source === 'google' && config.googleFamily) {
      headTags.push(<link key={config.name} rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(config.googleFamily)}&display=swap`} />);
    } else if (config.source === 'custom' && config.customFont) {
      const cf = config.customFont;
      const range = cf.isVariable && cf.weights && cf.weights.length ? `font-weight: ${Math.min(...cf.weights)} ${Math.max(...cf.weights)};` : 'font-weight: 400;';
      const face = `@font-face{font-family:'${config.name}';src:url('${assetUrl(cf.path)}') format('${cf.format}');font-display:swap;${range}}`;
      headTags.push(<style key={config.name} dangerouslySetInnerHTML={{ __html: face }} />);
    }
  };

  processConfig(bodyConfig);
  if (headingConfig !== bodyConfig) processConfig(headingConfig);

  return {
    headTags: <>{headTags}</>,
    bodyFont: bodyConfig && bodyConfig.source !== 'builtin' ? `'${bodyFontName}', Tahoma, sans-serif` : bodyFontName,
    headingFont: headingConfig && headingConfig.source !== 'builtin' ? `'${headingFontName}', Tahoma, sans-serif` : headingFontName
  };
}

const noFlash = `(function(){try{var t=localStorage.getItem('theme');var m=(typeof window !== 'undefined') ? ${JSON.stringify((getSite().theme as Record<string, string>)?.mode || 'dark')} : 'dark';if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.setAttribute('data-theme',m==='light'?'light':'dark');}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const site = getSite() as Record<string, unknown>;
  const theme = site.theme as Record<string, string>;
  const { headTags, bodyFont, headingFont } = buildFontStyles(site);

  return (
    <html lang="fa" dir="rtl" data-theme="dark" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
        :root{--primary:${(theme.dark as any)?.primary || theme.baseColor || '#b8f542'};--secondary:${(theme.dark as any)?.secondary || '#8adcf0'};--background:${(theme.dark as any)?.background || '#161616'};--foreground:${(theme.dark as any)?.foreground || '#f0f0f0'};--muted:${(theme.dark as any)?.muted || '#888888'};--border:${(theme.dark as any)?.border || '#2e2e2e'};--card:${(theme.dark as any)?.card || '#1e1e1e'};--font-heading:${headingFont};}
        :root[data-theme="light"]{--primary:${(theme.light as any)?.primary || theme.baseColor || '#3a6b2a'};--secondary:${(theme.light as any)?.secondary || '#2a7a9b'};--background:${(theme.light as any)?.background || '#f7f7f7'};--foreground:${(theme.light as any)?.foreground || '#1a1a1a'};--muted:${(theme.light as any)?.muted || '#6b6b6b'};--border:${(theme.light as any)?.border || '#dedede'};--card:${(theme.light as any)?.card || '#f0f0f0'};}
        ` }} />
        {headTags}
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body style={{ fontFamily: bodyFont }} suppressHydrationWarning>
        <Header site={site} />
        <main>{children}</main>
        <Footer site={site} />
      </body>
    </html>
  );
}
