import { useState, useRef, useEffect } from 'react';
import { getResponsiveImageProps } from '../../utils/imageOptimization';

function LazyImage({ src, alt, className, loading = 'lazy', ...props }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {isInView && !hasError && (
        <img
          {...getResponsiveImageProps(src, alt)}
          loading={loading}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...props}
        />
      )}
      {hasError && (
        <div
          className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-400 ${className}`}
        >
          <span className="text-sm">Image unavailable</span>
        </div>
      )}
      {!isLoaded && !hasError && isInView && (
        <div className={`animate-shimmer ${className}`} />
      )}
    </div>
  );
}

export default LazyImage;
