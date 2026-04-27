import { useState } from 'react';

export default function usePhotoViewer() {
  const [photoViewer, setPhotoViewer] = useState<{ src: string; title?: string } | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoPan, setPhotoPan] = useState({ x: 0, y: 0 });
  const [photoDragging, setPhotoDragging] = useState(false);
  const [photoDragStart, setPhotoDragStart] = useState({ x: 0, y: 0 });

  const openPhotoViewer = (src: string, title?: string) => {
    setPhotoViewer({ src, title });
    setPhotoZoom(1);
    setPhotoPan({ x: 0, y: 0 });
    setPhotoDragging(false);
  };

  const closePhotoViewer = () => {
    setPhotoViewer(null);
    setPhotoDragging(false);
  };

  const zoomOut = () => {
    setPhotoZoom((prev) => Math.max(0.5, Number((prev - 0.2).toFixed(2))));
    setPhotoDragging(false);
  };

  const zoomIn = () => {
    setPhotoZoom((prev) => Math.min(3, Number((prev + 0.2).toFixed(2))));
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!photoDragging || photoZoom <= 1) return;
    setPhotoPan({ x: event.clientX - photoDragStart.x, y: event.clientY - photoDragStart.y });
  };

  const stopDragging = () => {
    setPhotoDragging(false);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLImageElement>) => {
    if (photoZoom <= 1) return;
    setPhotoDragging(true);
    setPhotoDragStart({ x: event.clientX - photoPan.x, y: event.clientY - photoPan.y });
  };

  return {
    photoViewer,
    photoZoom,
    photoPan,
    photoDragging,
    openPhotoViewer,
    closePhotoViewer,
    zoomOut,
    zoomIn,
    handleMouseMove,
    stopDragging,
    handleMouseDown
  };
}
