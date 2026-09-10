'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import { ArrowsOut } from '@phosphor-icons/react';
import { formatTimestamp } from '@/lib/utils';
import { ToolCallBadge, type ToolCall } from './ToolCallBadge';
import { ImageLightbox } from './ImageLightbox';
import styles from './Message.module.css';

export interface MessageData {
  _id?: string;
  tenantId?: string;
  direction: 'inbound' | 'outbound';
  type?: string;
  content: string;
  timestamp: string;
  mediaId?: string;
  imageUrl?: string;
  toolCall?: ToolCall;
}

interface MessageProps {
  message: MessageData;
  isLast: boolean;
}

// Fallback for messages stored before the mediaId field was added:
// Meta's CDN URLs carry the media ID in the `mid` query parameter.
function extractMid(imageUrl: string): string | null {
  try {
    return new URL(imageUrl).searchParams.get('mid');
  } catch {
    return null;
  }
}

type LoadStatus = 'loading' | 'loaded' | 'error';

interface ImageBubbleProps {
  mediaId: string;
  tenantId: string;
  caption: string | null;
}

function ImageBubble({ mediaId, tenantId, caption }: ImageBubbleProps) {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const src = `/api/proxy/media/${encodeURIComponent(mediaId)}?tenantId=${encodeURIComponent(tenantId)}`;

  return (
    <>
      <button
        type="button"
        className={clsx(styles.imageTrigger, status === 'loaded' && styles.imageTriggerLoaded)}
        onClick={() => status === 'loaded' && setLightboxOpen(true)}
        disabled={status !== 'loaded'}
        aria-label="View full image"
      >
        {/* Shimmer placeholder — fades out once image is loaded */}
        <div
          className={clsx(styles.shimmer, status === 'loaded' && styles.shimmerGone)}
          aria-hidden
        />

        {/* Thumbnail image — fades in over the shimmer */}
        <img
          src={src}
          alt="Customer image"
          className={clsx(styles.thumbnail, status === 'loaded' && styles.thumbnailVisible)}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          draggable={false}
        />

        {/* Hover expand overlay — only shown when loaded */}
        {status === 'loaded' && (
          <div className={styles.expandOverlay} aria-hidden>
            <span className={styles.expandIcon}>
              <ArrowsOut size={18} weight="light" />
            </span>
          </div>
        )}

        {/* Broken-image state */}
        {status === 'error' && (
          <div className={styles.broken} role="img" aria-label="Image unavailable">
            <span>Image unavailable</span>
          </div>
        )}
      </button>

      {lightboxOpen && (
        <ImageLightbox
          src={src}
          caption={caption ?? undefined}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

export function Message({ message, isLast }: MessageProps) {
  const isInbound = message.direction === 'inbound';

  const effectiveMediaId =
    message.mediaId ||
    (message.imageUrl ? extractMid(message.imageUrl) : null);

  const isImageMessage =
    message.type === 'image' && effectiveMediaId && message.tenantId;

  const caption =
    message.content && message.content !== '[customer sent a product photo]'
      ? message.content
      : null;

  return (
    <div className={isInbound ? styles.inbound : styles.outbound}>
      <div className={styles.bubble}>
        {isImageMessage ? (
          <>
            <ImageBubble
              mediaId={effectiveMediaId!}
              tenantId={message.tenantId!}
              caption={caption}
            />
            {caption && (
              <p className={clsx(styles.content, styles.captionInBubble)}>{caption}</p>
            )}
          </>
        ) : (
          <>
            <p className={styles.content}>{message.content}</p>
            {message.toolCall && <ToolCallBadge toolCall={message.toolCall} />}
          </>
        )}
        <time
          className={styles.time}
          dateTime={message.timestamp}
          data-visible={isLast ? 'true' : undefined}
        >
          {formatTimestamp(message.timestamp)}
        </time>
      </div>
    </div>
  );
}
