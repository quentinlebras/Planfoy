import { useEffect } from 'react';
import type { Photo } from '../types';

interface Props {
  photos: Photo[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function Lightbox({ photos, index, onIndexChange, onClose }: Props) {
  const photo = photos[index];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onIndexChange((index + 1) % photos.length);
      if (event.key === 'ArrowLeft') onIndexChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, photos.length, onClose, onIndexChange]);

  if (!photo) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={photo.title}>
      <button type="button" className="lightbox__backdrop" onClick={onClose} aria-label="Fermer" />
      <img className="lightbox__img" src={photo.full} alt={photo.title} />
      <button
        type="button"
        className="lightbox__close round"
        onClick={onClose}
        aria-label="Fermer la photo"
      >
        ✕
      </button>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="lightbox__prev round"
            onClick={() => onIndexChange((index - 1 + photos.length) % photos.length)}
            aria-label="Photo précédente"
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox__next round"
            onClick={() => onIndexChange((index + 1) % photos.length)}
            aria-label="Photo suivante"
          >
            ›
          </button>
        </>
      )}
      <figcaption className="lightbox__caption">
        <span>{photo.title}</span>
        <span className="muted">
          {photo.author ? `© ${photo.author}` : 'Wikimedia Commons'}
          {photo.license ? ` · ${photo.license}` : ''} ·{' '}
          <a href={photo.descriptionUrl} target="_blank" rel="noreferrer noopener">
            source
          </a>
          {' · '}
          {index + 1}/{photos.length}
        </span>
      </figcaption>
    </div>
  );
}
