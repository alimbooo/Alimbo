'use client';

import { useState } from 'react';
import { assetUrl } from '@/lib/url';

export interface VideoPlayerProps {
  url: string;
  source?: 'host' | 'embed' | string;
  title: string;
  orientation?: 'horizontal' | 'vertical';
  poster?: string;
}

/**
 * Extracts a Google Drive file ID from various formats:
 * - /file/d/{id}/preview
 * - /file/d/{id}/view
 * - /file/d/{id}
 * - ?id={id} or &id={id}
 * - /open?id={id} or /uc?id={id}
 * - Full <iframe src="..."> code
 */
export function extractGoogleDriveId(input: string): string | null {
  if (!input) return null;
  const matchFile = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) return matchFile[1];

  const matchId = input.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchId && matchId[1]) return matchId[1];

  const matchOpen = input.match(/\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  if (matchOpen && matchOpen[1]) return matchOpen[1];

  return null;
}

/**
 * Extracts the src URL from an iframe or embed HTML snippet,
 * or returns the URL if already clean.
 */
export function extractEmbedSrc(code: string): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  if (!trimmed.includes('<') && (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//'))) {
    return trimmed.startsWith('//') ? 'https:' + trimmed : trimmed;
  }
  const iframeSrcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    let src = iframeSrcMatch[1];
    return src.startsWith('//') ? 'https:' + src : src;
  }
  const embedSrcMatch = trimmed.match(/<embed[^>]+src=["']([^"']+)["']/i);
  if (embedSrcMatch && embedSrcMatch[1]) {
    let src = embedSrcMatch[1];
    return src.startsWith('//') ? 'https:' + src : src;
  }
  return null;
}

/**
 * Normalizes video URLs for YouTube, Aparat, Google Drive.
 */
export function normalizeVideoUrl(rawUrl: string): string {
  let cleaned = rawUrl.trim();
  try {
    const parsed = new URL(cleaned);
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    } else if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/watch')) {
        const id = parsed.searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${id}`;
      } else if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.slice(8);
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
    }
    if (parsed.hostname.includes('aparat.com') && parsed.pathname.startsWith('/v/')) {
      const id = parsed.pathname.slice(3).replace(/\/.*$/, '');
      if (id) return `https://www.aparat.com/video/video/embed/videohash/${id}/vt/frame`;
    }
    if (parsed.hostname.includes('drive.google.com') && parsed.pathname.includes('/view')) {
      return cleaned.replace(/\/view(\?.*)?$/, '/preview');
    }
  } catch {}
  return cleaned;
}

export function VideoPlayer({ url, source = 'host', title, orientation = 'horizontal', poster }: VideoPlayerProps) {
  const [driveStreamFailed, setDriveStreamFailed] = useState(false);

  if (!url) return null;

  const isVertical = orientation === 'vertical';
  const wrapperClass = isVertical ? 'flex justify-center w-full my-4' : 'w-full my-4';
  const playerClass = isVertical
    ? 'relative aspect-[9/16] w-full max-w-[380px] rounded-2xl border border-[var(--border)] shadow-md overflow-hidden bg-black'
    : 'relative aspect-video w-full rounded-2xl border border-[var(--border)] shadow-md overflow-hidden bg-black';

  const driveId = extractGoogleDriveId(url);

  // 1. Google Drive direct stream (works for any embed or direct URL containing drive ID)
  // Renders native HTML5 <video> with bottom-aligned mobile controls, zero center clutter,
  // perfect edge-to-edge fitting without top-bar clipping.
  if (driveId && !driveStreamFailed) {
    const directStreamUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download`;
    return (
      <div className={wrapperClass}>
        <div className={playerClass}>
          <video
            key={driveId}
            src={directStreamUrl}
            title={`ویدیوی ${title}`}
            controls
            playsInline
            preload="metadata"
            poster={poster ? assetUrl(poster) : undefined}
            onError={() => {
              // Graceful fallback to Google Drive preview iframe if direct streaming fails
              setDriveStreamFailed(true);
            }}
            className="absolute inset-0 h-full w-full object-contain bg-black"
          />
        </div>
      </div>
    );
  }

  // 2. Google Drive iframe fallback
  if (driveId && driveStreamFailed) {
    const fallbackPreviewUrl = `https://drive.google.com/file/d/${driveId}/preview`;
    return (
      <div className={wrapperClass}>
        <div className={playerClass}>
          <iframe
            title={`ویدیوی ${title}`}
            src={fallbackPreviewUrl}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  // 3. Local or direct video file (host)
  if (source === 'host') {
    return (
      <div className={wrapperClass}>
        <div className={playerClass}>
          <video
            src={assetUrl(url)}
            title={`ویدیوی ${title}`}
            controls
            playsInline
            preload="metadata"
            poster={poster ? assetUrl(poster) : undefined}
            className="absolute inset-0 h-full w-full object-contain bg-black"
          />
        </div>
      </div>
    );
  }

  // 4. Other Embed code or HTML snippet (YouTube, Aparat, custom iframe)
  if (source === 'embed' || url.trim().startsWith('<')) {
    const extractedSrc = extractEmbedSrc(url);
    if (extractedSrc) {
      const finalSrc = normalizeVideoUrl(extractedSrc);
      return (
        <div className={wrapperClass}>
          <div className={playerClass}>
            <iframe
              title={`ویدیوی ${title}`}
              src={finalSrc}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      );
    }
    return (
      <div className={wrapperClass}>
        <div className={playerClass}>
          <div
            className="absolute inset-0 h-full w-full overflow-hidden flex items-center justify-center [&_*]:!max-w-full [&_*]:!max-h-full [&_iframe]:!absolute [&_iframe]:!inset-0 [&_iframe]:!w-full [&_iframe]:!h-full [&_iframe]:!border-0 [&_video]:!absolute [&_video]:!inset-0 [&_video]:!w-full [&_video]:!h-full [&_video]:!object-contain [&_div]:!w-full [&_div]:!h-full [&_div]:!p-0 [&_div]:!m-0 [&_span]:!hidden"
            dangerouslySetInnerHTML={{ __html: url }}
          />
        </div>
      </div>
    );
  }

  // 5. Default URL (YouTube / Aparat / etc.)
  const normalizedUrl = normalizeVideoUrl(url);
  return (
    <div className={wrapperClass}>
      <div className={playerClass}>
        <iframe
          title={`ویدیوی ${title}`}
          src={assetUrl(normalizedUrl)}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
