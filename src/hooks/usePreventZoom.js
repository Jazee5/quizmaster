import { useEffect } from 'react';

export const usePreventZoom = () => {
  useEffect(() => {
    // Reset viewport
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }

    // Reset any zoom
    document.body.style.zoom = "1.0";
    window.scrollTo(0, 0);
  }, []);
};