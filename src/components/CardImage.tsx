import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
  /** Eager-load (e.g. the detail modal hero image). */
  eager?: boolean;
}

/** Card art with a loading skeleton and a graceful error fallback. */
export default function CardImage({ src, alt, className = '', eager = false }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div className={`relative overflow-hidden bg-space-850 ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-space-800 to-space-850" />
      )}
      {status === 'error' ? (
        <div className="absolute inset-0 grid place-items-center p-2 text-center text-[11px] text-slate-500">
          <span>Image unavailable<br />(offline?)</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`h-full w-full object-contain transition-opacity duration-300 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
