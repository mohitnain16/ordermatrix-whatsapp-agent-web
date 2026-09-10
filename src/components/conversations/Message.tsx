'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import { ArrowsOut } from '@phosphor-icons/react';
import { formatTimestamp } from '@/lib/utils';
import { CustomerAvatar } from '@/components/ui/CustomerAvatar';
import { ToolCallBadge, type ToolCall } from './ToolCallBadge';
import { ImageLightbox } from './ImageLightbox';
import styles from './Message.module.css';

export interface MessageData {
  _id?: string;
  tenantId?: string;
  conversationId?: string;
  whatsappMessageId?: string;
  direction: 'inbound' | 'outbound';
  type?: string;
  content: string;
  timestamp: string;
  mediaId?: string;
  imageUrl?: string;
  toolCall?: ToolCall;
  deliveryStatus?: 'sent' | 'delivered' | 'read' | 'failed' | null;
}

interface MessageProps {
  message: MessageData;
  customerPhone?: string;
  customerName?: string;
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

// Delivery status indicator for outbound messages only.
// null/undefined → nothing (e.g. optimistic send before server confirms)
// sent      → single grey tick
// delivered → double grey tick
// read      → double blue tick (#378ADD — WhatsApp read-receipt blue)
// failed    → red exclamation mark
function MessageTicks({ status }: { status: MessageData['deliveryStatus'] }) {
  if (!status) return null;

  const grey = '#94A3B8';
  const blue = '#378ADD'; // WhatsApp read-receipt blue

  if (status === 'failed') {
    return (
      <svg className={styles.ticks} viewBox="0 0 11 11" fill="none" aria-label="Failed to deliver" role="img">
        <circle cx="5.5" cy="5.5" r="5" stroke="#DC2626" strokeWidth="1.4" />
        <line x1="5.5" y1="3" x2="5.5" y2="6.2" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="5.5" cy="8" r="0.7" fill="#DC2626" />
      </svg>
    );
  }

  if (status === 'sent') {
    return (
      <svg className={styles.ticks} viewBox="0 0 13 11" fill="none" aria-label="Sent" role="img">
        <path d="M1.5 5.5L4.8 9L11.5 1.5" stroke={grey} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // delivered or read — two overlapping ticks
  const color = status === 'read' ? blue : grey;
  return (
    <svg className={styles.ticks} viewBox="0 0 18 11" fill="none" aria-label={status === 'read' ? 'Read' : 'Delivered'} role="img">
      <path d="M1.5 5.5L4.8 9L11.5 1.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 5.5L9.3 9L16 1.5"     stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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

export function Message({ message, customerPhone, customerName }: MessageProps) {
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
      {isInbound && customerPhone && (
        <div className={styles.inboundAvatarSlot}>
          <CustomerAvatar phone={customerPhone} name={customerName} size={28} />
        </div>
      )}
      <div className={clsx(styles.bubble, isImageMessage && styles.imageBubble)}>
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
        <div className={styles.meta}>
          <time dateTime={message.timestamp}>
            {formatTimestamp(message.timestamp)}
          </time>
          {!isInbound && <MessageTicks status={message.deliveryStatus} />}
        </div>
      </div>
    </div>
  );
}
