
import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage = ({
  src,
  alt,
  className = '',
  placeholderClassName = '',
  onLoad,
  onError
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // تعيين المراقب للتحميل الكسول
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px 0px', // بدء التحميل المسبق عندما تكون الصورة على بعد 200 بكسل
        threshold: 0.01
      }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // معالجة تحميل الصورة
  const handleImageLoaded = () => {
    setIsLoaded(true);
    onLoad && onLoad();
  };
  
  // معالجة خطأ الصورة
  const handleImageError = () => {
    setError(true);
    onError && onError();
  };
  
  return (
    <div className={`relative overflow-hidden ${className}`} ref={imgRef}>
      {/* عنصر النائب */}
      {!isLoaded && !error && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800 animate-pulse ${placeholderClassName}`}>
          <svg className="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      {/* عنصر الخطأ */}
      {error && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-red-100 dark:bg-red-900/20 ${placeholderClassName}`}>
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="mt-2 text-xs text-red-600 dark:text-red-400">فشل تحميل الصورة</span>
        </div>
      )}
      
      {/* الصورة الحقيقية - تُحمَّل فقط عندما تكون في نطاق العرض */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleImageLoaded}
          onError={handleImageError}
        />
      )}
    </div>
  );
};

export default LazyImage;
