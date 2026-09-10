'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, DownloadSimple } from '@phosphor-icons/react';
import styles from './ImageLightbox.module.css';

interface ImageLightboxProps {
  src: string;
  caption?: string;
  onClose: () => void;
  /** Reserved for future multi-image navigation — wire up without a rewrite. */
  onPrev?: () => void;
  onNext?: () => void;
}

export function ImageLightbox({ src, caption, onClose }: ImageLightboxProps) {
  const [visible, setVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Two-phase mount: add to DOM first, then trigger CSS transitions on next frame.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Focus close button on open for keyboard accessibility.
  useEffect(() => {
    if (visible) closeBtnRef.current?.focus();
  }, [visible]);

  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    // Wait for exit transition to complete before unmounting.
    setTimeout(onClose, 260);
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose]);

  function onBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) handleClose();
  }

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const ext = blob.type.split('/')[1]?.split(';')[0] || 'jpg';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silent — user will retry
    } finally {
      setDownloading(false);
    }
  }

  return createPortal(
    <div
      ref={backdropRef}
      className={`${styles.backdrop} ${visible ? styles.backdropVisible : ''}`}
      onClick={onBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Toolbar lives outside the panel so it doesn't shift with the image */}
      <div className={`${styles.toolbar} ${visible ? styles.toolbarVisible : ''}`}>
        <button
          className={`${styles.toolBtn} ${downloading ? styles.toolBtnBusy : ''}`}
          onClick={handleDownload}
          aria-label="Download image"
          title="Download"
          disabled={downloading}
        >
          <DownloadSimple size={17} weight="light" />
        </button>
        <button
          ref={closeBtnRef}
          className={styles.toolBtn}
          onClick={handleClose}
          aria-label="Close"
          title="Close (Esc)"
        >
          <X size={17} weight="light" />
        </button>
      </div>

      {/* Panel: the image + optional caption */}
      <div className={`${styles.panel} ${visible ? styles.panelVisible : ''}`}>
        <div className={styles.imageBezel}>
          <img src={src} alt="Full size" className={styles.fullImage} draggable={false} />
        </div>

        {caption && (
          <div className={styles.caption}>{caption}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
