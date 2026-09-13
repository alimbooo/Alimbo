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
 * - /file/d/{id}/preview or /file/d/{id}/view
 * - ?id={id} or &id={id}
 * - Full <iframe src="..."> code containing drive.google.com
 */
export function extractGoogleDriveId(input: string): string | null {
  if (!input) return null;
  const matchFile = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile && matchFile[1]) return matchFile[1];

  const matchId = input.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchId && matchId[1]) return matchId[1];

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

/**
 * Google Drive Poster Overlay:
 * Shows the project cover image with a play button.
 * When user taps play, the overlay hides and the iframe becomes visible/active.
 * This avoids showing Google Drive's ugly center controls overlay on initial load.
 */
function GoogleDrivePosterOverlay({ poster, title, onPlay }: { poster?: string; title: string; onPlay: () => void }) {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer bg-black"
      onClick={onPlay}
      role="button"
      aria-label={`پخش ویدیوی ${title}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPlay(); }}
    >
      {poster && (
        <img
          src={assetUrl(poster)}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Dark gradient overlay for better button visibility */}
      <div className="absolute inset-0 bg-black/30" />
      {/* Play button */}
      <div className="relative z-10 flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 shadow-xl backdrop-blur-sm transition-transform hover:scale-110 active:scale-95">
        <svg viewBox="0 0 24 24" className="w-7 h-7 md:w-9 md:h-9 text-gray-900 ml-1" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}

export function VideoPlayer({ url, source = 'host', title, orientation = 'horizontal', poster }: VideoPlayerProps) {
  const [driveActivated, setDriveActivated] = useState(false);

  if (!url) return null;

  const isVertical = orientation === 'vertical';
  const wrapperClass = isVertical ? 'flex justify-center w-full my-4' : 'w-full my-4';
  const playerClass = isVertical
    ? 'relative aspect-[9/16] w-full max-w-[380px] rounded-2xl border border-[var(--border)] shadow-md overflow-hidden bg-black'
    : 'relative aspect-video w-full rounded-2xl border border-[var(--border)] shadow-md overflow-hidden bg-black';

  const driveId = extractGoogleDriveId(url);

  // 1. Google Drive embed — poster overlay + cropped iframe
  // Google Drive blocks direct <video> streaming from browsers (403 on Sec-Fetch-Dest: video).
  // So we use the /preview iframe, but with two key improvements:
  //   a) Poster overlay: shows clean cover image + play button initially (no Drive controls visible)
  //   b) CSS crop: pushes iframe up by 48px to hide Google Drive's top toolbar bar
  if (driveId) {
    const previewUrl = `https://drive.google.com/file/d/${driveId}/preview`;

    // Google Drive top bar is 48px. We push the iframe up and make it taller to crop it out.
    // This makes the video content fill the visible area properly.
    const DRIVE_TOPBAR_HEIGHT = 48;

    return (
      <div className={wrapperClass}>
        <div className={playerClass}>
          {/* Poster overlay — shown initially, hides Google Drive's controls */}
          {!driveActivated && poster && (
            <GoogleDrivePosterOverlay
              poster={poster}
              title={title}
              onPlay={() => setDriveActivated(true)}
            />
          )}
          {/* If no poster, or after user taps play, show the iframe */}
          {/* Even before activation we render the iframe (hidden behind poster) so it preloads */}
          <iframe
            title={`ویدیوی ${title}`}
            src={previewUrl}
            className="absolute border-0"
            style={{
              left: 0,
              top: `-${DRIVE_TOPBAR_HEIGHT}px`,
              width: '100%',
              height: `calc(100% + ${DRIVE_TOPBAR_HEIGHT}px)`,
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  // 2. Local or direct video file (host)
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

  // 3. Other embed code or HTML snippet (non-Drive: YouTube, Aparat, custom iframe)
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
    // Fallback: render raw HTML inside responsive container
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

  // 4. Default URL (YouTube / Aparat / etc.)
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
