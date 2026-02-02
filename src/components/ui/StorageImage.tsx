"use client";

import { useState } from "react";

type Props = {
  urls: string[];
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
};

/**
 * 여러 URL을 시도하는 이미지 컴포넌트
 * 첫 번째 URL 로드 실패 시 다음 URL 시도
 */
export function StorageImage({ urls, alt, className, fallback }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (currentIndex < urls.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFailed(true);
    }
  };

  if (failed || urls.length === 0) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={urls[currentIndex]}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}
