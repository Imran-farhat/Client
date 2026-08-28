import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Aspect Ratio Modes
 */
const CROP_MODES = [
  { id: 'free', label: '✂️ Custom / Freeform', ratio: null },
  { id: 'passport', label: 'Passport (88×108)', ratio: 88 / 108 },
  { id: 'square', label: 'Square (1:1)', ratio: 1 / 1 },
];

/**
 * ImageCropperModal Component
 *
 * Custom Manual Crop Tool with direct draggable corner & edge handles
 * exactly matching the reference design.
 */
export default function ImageCropperModal({
  imageSrc,
  member = null,
  title = null,
  onCropComplete,
  onDirectSave,
  onClose,
  saving = false
}) {
  const [loadedImage, setLoadedImage] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Crop Mode
  const [cropMode, setCropMode] = useState('free');

  // Display dimensions of the image inside the container
  const [dispSize, setDispSize] = useState({ width: 0, height: 0 });

  // Crop Box relative to displayed image: { x, y, w, h } in pixels
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // Dragging interaction state
  // handleType: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'w' | 'e' | null
  const [activeHandle, setActiveHandle] = useState(null);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, startCrop: { x: 0, y: 0, w: 0, h: 0 } });

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Load and sanitize image source
  useEffect(() => {
    if (!imageSrc) {
      setLoadError('புகைப்படம் காணப்படவில்லை / No image provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    let isCancelled = false;
    let objectUrlToRevoke = null;

    const prepareImage = async () => {
      try {
        let srcToLoad = imageSrc;

        if (imageSrc instanceof Blob || imageSrc instanceof File) {
          srcToLoad = URL.createObjectURL(imageSrc);
          objectUrlToRevoke = srcToLoad;
        } else if (typeof imageSrc === 'string' && imageSrc.startsWith('http')) {
          try {
            const resp = await fetch(imageSrc, { mode: 'cors' });
            if (resp.ok) {
              const blob = await resp.blob();
              srcToLoad = URL.createObjectURL(blob);
              objectUrlToRevoke = srcToLoad;
            }
          } catch (e) {
            console.warn('Direct fetch failed, falling back to direct URL:', e);
            srcToLoad = imageSrc;
          }
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (!isCancelled) {
            setLoadedImage(img);
            setLoading(false);
          }
        };
        img.onerror = (e) => {
          if (!isCancelled) {
            console.error('Failed to load image into cropper:', e);
            setLoadError('புகைப்படத்தை ஏற்றுவதில் தோல்வி / Failed to load image');
            setLoading(false);
          }
        };
        img.src = srcToLoad;
      } catch (err) {
        if (!isCancelled) {
          console.error('Error preparing image:', err);
          setLoadError('புகைப்பட பிழை / Image error: ' + err.message);
          setLoading(false);
        }
      }
    };

    prepareImage();

    return () => {
      isCancelled = true;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [imageSrc]);

  // Initial Crop Box setup when image is rendered
  const initializeCropBox = useCallback((displayWidth, displayHeight, mode = cropMode) => {
    if (!displayWidth || !displayHeight) return;

    const activeRatio = CROP_MODES.find(m => m.id === mode)?.ratio;
    let boxW, boxH;

    if (activeRatio) {
      // Fit max centered box matching ratio
      const padding = 0.85; // 85% of display size
      if (displayWidth / displayHeight > activeRatio) {
        boxH = displayHeight * padding;
        boxW = boxH * activeRatio;
      } else {
        boxW = displayWidth * padding;
        boxH = boxW / activeRatio;
      }
    } else {
      // Freeform default (75% centered box)
      boxW = displayWidth * 0.8;
      boxH = displayHeight * 0.8;
    }

    const x = Math.max(0, (displayWidth - boxW) / 2);
    const y = Math.max(0, (displayHeight - boxH) / 2);

    setCrop({
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(boxW),
      h: Math.round(boxH)
    });
  }, [cropMode]);

  // Handle image layout when rendered
  const onImageLoad = () => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      setDispSize({ width, height });
      initializeCropBox(width, height, cropMode);
    }
  };

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDispSize({ width: rect.width, height: rect.height });
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When crop mode changes, re-adjust crop box to fit ratio
  const handleModeChange = (newMode) => {
    setCropMode(newMode);
    const targetRatio = CROP_MODES.find(m => m.id === newMode)?.ratio;
    if (!targetRatio) return; // Freeform keeps current dimensions

    const { width: dispW, height: dispH } = dispSize;
    if (!dispW || !dispH) return;

    let newW = crop.w;
    let newH = newW / targetRatio;

    // If newH overflows container or exceeds dispH, clamp to height
    if (crop.y + newH > dispH || newH > dispH) {
      newH = Math.min(dispH * 0.9, dispH - crop.y);
      newW = newH * targetRatio;
    }
    if (crop.x + newW > dispW || newW > dispW) {
      newW = Math.min(dispW * 0.9, dispW - crop.x);
      newH = newW / targetRatio;
    }

    const newX = Math.max(0, Math.min(dispW - newW, crop.x));
    const newY = Math.max(0, Math.min(dispH - newH, crop.y));

    setCrop({
      x: Math.round(newX),
      y: Math.round(newY),
      w: Math.round(newW),
      h: Math.round(newH)
    });
  };

  // Pointer Down (handles both mouse and touch on any corner, edge, or move area)
  const handlePointerDown = (handle, e) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setActiveHandle(handle);
    dragStartRef.current = {
      pointerX: clientX,
      pointerY: clientY,
      startCrop: { ...crop }
    };
  };

  // Pointer Move
  const handlePointerMove = useCallback((e) => {
    if (!activeHandle) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragStartRef.current.pointerX;
    const dy = clientY - dragStartRef.current.pointerY;
    const { startCrop } = dragStartRef.current;
    const { width: dispW, height: dispH } = dispSize;

    if (!dispW || !dispH) return;

    const MIN_SIZE = 36; // Min crop box dimension in pixels
    const activeRatio = CROP_MODES.find(m => m.id === cropMode)?.ratio;

    if (activeHandle === 'move') {
      const newX = Math.max(0, Math.min(dispW - startCrop.w, startCrop.x + dx));
      const newY = Math.max(0, Math.min(dispH - startCrop.h, startCrop.y + dy));
      setCrop({
        x: Math.round(newX),
        y: Math.round(newY),
        w: startCrop.w,
        h: startCrop.h
      });
      return;
    }

    let newX = startCrop.x;
    let newY = startCrop.y;
    let newW = startCrop.w;
    let newH = startCrop.h;

    // Corner: Bottom-Right
    if (activeHandle === 'se') {
      newW = Math.max(MIN_SIZE, Math.min(dispW - startCrop.x, startCrop.w + dx));
      newH = Math.max(MIN_SIZE, Math.min(dispH - startCrop.y, startCrop.h + dy));
      if (activeRatio) {
        newH = newW / activeRatio;
        if (startCrop.y + newH > dispH) {
          newH = dispH - startCrop.y;
          newW = newH * activeRatio;
        }
      }
    }
    // Corner: Bottom-Left
    else if (activeHandle === 'sw') {
      newW = Math.max(MIN_SIZE, Math.min(startCrop.x + startCrop.w, startCrop.w - dx));
      newH = Math.max(MIN_SIZE, Math.min(dispH - startCrop.y, startCrop.h + dy));
      if (activeRatio) {
        newH = newW / activeRatio;
        if (startCrop.y + newH > dispH) {
          newH = dispH - startCrop.y;
          newW = newH * activeRatio;
        }
      }
      newX = startCrop.x + (startCrop.w - newW);
    }
    // Corner: Top-Right
    else if (activeHandle === 'ne') {
      newW = Math.max(MIN_SIZE, Math.min(dispW - startCrop.x, startCrop.w + dx));
      newH = Math.max(MIN_SIZE, Math.min(startCrop.y + startCrop.h, startCrop.h - dy));
      if (activeRatio) {
        newH = newW / activeRatio;
        if (startCrop.y + startCrop.h - newH < 0) {
          newH = startCrop.y + startCrop.h;
          newW = newH * activeRatio;
        }
      }
      newY = startCrop.y + (startCrop.h - newH);
    }
    // Corner: Top-Left
    else if (activeHandle === 'nw') {
      newW = Math.max(MIN_SIZE, Math.min(startCrop.x + startCrop.w, startCrop.w - dx));
      newH = Math.max(MIN_SIZE, Math.min(startCrop.y + startCrop.h, startCrop.h - dy));
      if (activeRatio) {
        newH = newW / activeRatio;
        if (startCrop.y + startCrop.h - newH < 0) {
          newH = startCrop.y + startCrop.h;
          newW = newH * activeRatio;
        }
      }
      newX = startCrop.x + (startCrop.w - newW);
      newY = startCrop.y + (startCrop.h - newH);
    }
    // Edge: Top
    else if (activeHandle === 'n') {
      newH = Math.max(MIN_SIZE, Math.min(startCrop.y + startCrop.h, startCrop.h - dy));
      newY = startCrop.y + (startCrop.h - newH);
      if (activeRatio) {
        newW = newH * activeRatio;
        newX = startCrop.x + (startCrop.w - newW) / 2;
        if (newX < 0) {
          newX = 0;
          newW = Math.min(dispW, newH * activeRatio);
        } else if (newX + newW > dispW) {
          newW = dispW - newX;
        }
      }
    }
    // Edge: Bottom
    else if (activeHandle === 's') {
      newH = Math.max(MIN_SIZE, Math.min(dispH - startCrop.y, startCrop.h + dy));
      if (activeRatio) {
        newW = newH * activeRatio;
        newX = startCrop.x + (startCrop.w - newW) / 2;
        if (newX < 0) {
          newX = 0;
          newW = Math.min(dispW, newH * activeRatio);
        } else if (newX + newW > dispW) {
          newW = dispW - newX;
        }
      }
    }
    // Edge: Left
    else if (activeHandle === 'w') {
      newW = Math.max(MIN_SIZE, Math.min(startCrop.x + startCrop.w, startCrop.w - dx));
      newX = startCrop.x + (startCrop.w - newW);
      if (activeRatio) {
        newH = newW / activeRatio;
        newY = startCrop.y + (startCrop.h - newH) / 2;
        if (newY < 0) {
          newY = 0;
          newH = Math.min(dispH, newW / activeRatio);
        } else if (newY + newH > dispH) {
          newH = dispH - newY;
        }
      }
    }
    // Edge: Right
    else if (activeHandle === 'e') {
      newW = Math.max(MIN_SIZE, Math.min(dispW - startCrop.x, startCrop.w + dx));
      if (activeRatio) {
        newH = newW / activeRatio;
        newY = startCrop.y + (startCrop.h - newH) / 2;
        if (newY < 0) {
          newY = 0;
          newH = Math.min(dispH, newW / activeRatio);
        } else if (newY + newH > dispH) {
          newH = dispH - newY;
        }
      }
    }

    // Final boundary check
    newX = Math.max(0, Math.min(dispW - newW, newX));
    newY = Math.max(0, Math.min(dispH - newH, newY));

    setCrop({
      x: Math.round(newX),
      y: Math.round(newY),
      w: Math.round(newW),
      h: Math.round(newH)
    });
  }, [activeHandle, cropMode, dispSize]);

  const handlePointerUp = useCallback(() => {
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (activeHandle) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [activeHandle, handlePointerMove, handlePointerUp]);

  // Calculate actual source pixel dimensions
  const sourcePixelW = (loadedImage && dispSize.width > 0)
    ? Math.round((crop.w / dispSize.width) * loadedImage.naturalWidth)
    : 0;
  const sourcePixelH = (loadedImage && dispSize.height > 0)
    ? Math.round((crop.h / dispSize.height) * loadedImage.naturalHeight)
    : 0;

  // Generate cropped output canvas / blob
  const generateCroppedBlob = async () => {
    if (!loadedImage || dispSize.width === 0 || dispSize.height === 0) return null;

    const scaleX = loadedImage.naturalWidth / dispSize.width;
    const scaleY = loadedImage.naturalHeight / dispSize.height;

    const srcX = Math.max(0, Math.round(crop.x * scaleX));
    const srcY = Math.max(0, Math.round(crop.y * scaleY));
    const srcW = Math.min(loadedImage.naturalWidth - srcX, Math.round(crop.w * scaleX));
    const srcH = Math.min(loadedImage.naturalHeight - srcY, Math.round(crop.h * scaleY));

    if (srcW <= 0 || srcH <= 0) return null;

    // Target canvas (max 800px width high-res)
    const targetW = Math.min(800, srcW);
    const targetH = Math.round(targetW * (srcH / srcW));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      loadedImage,
      srcX, srcY, srcW, srcH,
      0, 0, targetW, targetH
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
          const fileName = `cropped_member_${member?.member_id || 'photo'}_${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          resolve({ blob, dataUrl, file });
        },
        'image/jpeg',
        0.90
      );
    });
  };

  const handleApply = async (andApprove = false) => {
    const result = await generateCroppedBlob();
    if (!result) {
      alert('பயிர் செய்வதில் பிழை / Error cropping image');
      return;
    }

    if (onDirectSave) {
      await onDirectSave(result.blob, result.dataUrl, result.file, andApprove);
    } else if (onCropComplete) {
      onCropComplete(result.blob, result.dataUrl, result.file);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div
        className="relative w-full max-w-3xl bg-[#0F141C] text-white rounded-2xl shadow-2xl border border-gray-800 flex flex-col max-h-[96vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header (matching Image 2) ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800/80 bg-[#141A24]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA] text-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2v14a2 2 0 0 0 2 2h14"></path>
                <path d="M18 22V8a2 2 0 0 0-2-2H2"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                {title || 'Custom Manual Crop Tool'}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                Freely drag any corner, edge handle, or move the box anywhere on the image
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center text-sm transition"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Crop Mode Bar (matching Image 2) ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-[#111722] border-b border-gray-800/60">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              CROP MODE:
            </span>
            <div className="flex items-center gap-1.5">
              {CROP_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleModeChange(mode.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    cropMode === mode.id
                      ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                      : 'bg-gray-800/70 hover:bg-gray-700 text-gray-300 border border-gray-700/60'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source Pixel Dimensions Badge */}
          {sourcePixelW > 0 && sourcePixelH > 0 && (
            <div className="px-3 py-1 rounded-full bg-black/40 border border-gray-800 text-gray-300 text-xs font-mono">
              {sourcePixelW} × {sourcePixelH} px
            </div>
          )}
        </div>

        {/* ── Main Interactive Image Crop Viewport ── */}
        <div
          ref={containerRef}
          className="relative flex-1 bg-[#090D14] flex items-center justify-center overflow-hidden p-3 sm:p-4 min-h-[360px] max-h-[62vh]"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center text-gray-400 gap-3 py-16">
              <div className="w-8 h-8 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">Loading image...</span>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center text-red-400 p-6 text-center gap-2">
              <span className="text-2xl">⚠️</span>
              <span className="text-xs">{loadError}</span>
            </div>
          ) : (
            <div className="relative inline-block select-none max-w-full max-h-full">
              {/* Displayed Source Image */}
              <img
                ref={imageRef}
                src={loadedImage.src}
                alt="Source for crop"
                onLoad={onImageLoad}
                draggable={false}
                className="block max-h-[58vh] max-w-full w-auto h-auto object-contain rounded-md select-none pointer-events-none shadow-lg"
              />

              {/* Dimmed Overlay Mask outside Crop Box */}
              {dispSize.width > 0 && crop.w > 0 && (
                <>
                  {/* Top Mask */}
                  <div
                    className="absolute left-0 right-0 top-0 bg-black/70 pointer-events-none"
                    style={{ height: `${crop.y}px` }}
                  />
                  {/* Bottom Mask */}
                  <div
                    className="absolute left-0 right-0 bottom-0 bg-black/70 pointer-events-none"
                    style={{ height: `${dispSize.height - (crop.y + crop.h)}px` }}
                  />
                  {/* Left Mask */}
                  <div
                    className="absolute left-0 bg-black/70 pointer-events-none"
                    style={{
                      top: `${crop.y}px`,
                      width: `${crop.x}px`,
                      height: `${crop.h}px`
                    }}
                  />
                  {/* Right Mask */}
                  <div
                    className="absolute right-0 bg-black/70 pointer-events-none"
                    style={{
                      top: `${crop.y}px`,
                      width: `${dispSize.width - (crop.x + crop.w)}px`,
                      height: `${crop.h}px`
                    }}
                  />

                  {/* ── DRAGGABLE & RESIZABLE CROP BOX ── */}
                  <div
                    className="absolute select-none z-10"
                    style={{
                      left: `${crop.x}px`,
                      top: `${crop.y}px`,
                      width: `${crop.w}px`,
                      height: `${crop.h}px`,
                      border: '2px solid #8B5CF6',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                    }}
                  >
                    {/* Tooltip Badge at Top-Left of Crop Box */}
                    <div
                      className="absolute -top-7 left-0 bg-black/90 text-white text-[10px] font-medium px-2 py-0.5 rounded border border-white/20 shadow-md whitespace-nowrap pointer-events-none flex items-center gap-1"
                    >
                      <span>↖️</span> Drag any handle or corner to customize crop
                    </div>

                    {/* Inner 3x3 Dashed Grid */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 bottom-0 left-1/3 w-[1px] border-l border-dashed border-white/35" />
                      <div className="absolute top-0 bottom-0 left-2/3 w-[1px] border-l border-dashed border-white/35" />
                      <div className="absolute left-0 right-0 top-1/3 h-[1px] border-t border-dashed border-white/35" />
                      <div className="absolute left-0 right-0 top-2/3 h-[1px] border-t border-dashed border-white/35" />
                    </div>

                    {/* Move Region (Center drag area) */}
                    <div
                      onMouseDown={(e) => handlePointerDown('move', e)}
                      onTouchStart={(e) => handlePointerDown('move', e)}
                      className="absolute inset-2 cursor-move flex items-center justify-center group"
                      title="Drag to move crop box"
                    >
                      <div className="opacity-0 group-hover:opacity-70 transition p-1 rounded bg-black/60 text-white text-xs">
                        ✥
                      </div>
                    </div>

                    {/* ── 4 CORNER HANDLES (White Circular Knobs) ── */}
                    {/* Top-Left */}
                    <div
                      onMouseDown={(e) => handlePointerDown('nw', e)}
                      onTouchStart={(e) => handlePointerDown('nw', e)}
                      className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-white border-2 border-[#8B5CF6] shadow-md cursor-nwse-resize z-20"
                    />
                    {/* Top-Right */}
                    <div
                      onMouseDown={(e) => handlePointerDown('ne', e)}
                      onTouchStart={(e) => handlePointerDown('ne', e)}
                      className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white border-2 border-[#8B5CF6] shadow-md cursor-nesw-resize z-20"
                    />
                    {/* Bottom-Left */}
                    <div
                      onMouseDown={(e) => handlePointerDown('sw', e)}
                      onTouchStart={(e) => handlePointerDown('sw', e)}
                      className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-white border-2 border-[#8B5CF6] shadow-md cursor-nesw-resize z-20"
                    />
                    {/* Bottom-Right */}
                    <div
                      onMouseDown={(e) => handlePointerDown('se', e)}
                      onTouchStart={(e) => handlePointerDown('se', e)}
                      className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-white border-2 border-[#8B5CF6] shadow-md cursor-nwse-resize z-20"
                    />

                    {/* ── 4 EDGE HANDLES (White Pill Capsules) ── */}
                    {/* Top Edge */}
                    <div
                      onMouseDown={(e) => handlePointerDown('n', e)}
                      onTouchStart={(e) => handlePointerDown('n', e)}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full bg-white border-2 border-[#8B5CF6] shadow-md cursor-ns-resize z-20"
                    />
                    {/* Bottom Edge */}
                    <div
                      onMouseDown={(e) => handlePointerDown('s', e)}
                      onTouchStart={(e) => handlePointerDown('s', e)}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full bg-white border-2 border-[#8B5CF6] shadow-md cursor-ns-resize z-20"
                    />
                    {/* Left Edge */}
                    <div
                      onMouseDown={(e) => handlePointerDown('w', e)}
                      onTouchStart={(e) => handlePointerDown('w', e)}
                      className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-8 rounded-full bg-white border-2 border-[#8B5CF6] shadow-md cursor-ew-resize z-20"
                    />
                    {/* Right Edge */}
                    <div
                      onMouseDown={(e) => handlePointerDown('e', e)}
                      onTouchStart={(e) => handlePointerDown('e', e)}
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-8 rounded-full bg-white border-2 border-[#8B5CF6] shadow-md cursor-ew-resize z-20"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-5 py-3.5 bg-[#141A24] border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition border border-gray-700"
          >
            ✕ Cancel / ரத்து
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* If direct save mode for member */}
            {onDirectSave && member && (
              <>
                {(member.status === 'rejected' || member.status === 'pending') && (
                  <button
                    type="button"
                    onClick={() => handleApply(true)}
                    disabled={saving || loading || !!loadError}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-green-900/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {saving ? 'அனுமதிக்கிறது...' : '✅ Save & Approve'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleApply(false)}
                  disabled={saving || loading || !!loadError}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-[#8B5CF6] hover:bg-[#7c4def] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#8B5CF6]/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : '💾 Save Photo'}
                </button>
              </>
            )}

            {/* Standard crop apply (for Edit form / Register tab) */}
            {(!onDirectSave || !member) && (
              <button
                type="button"
                onClick={() => handleApply(false)}
                disabled={saving || loading || !!loadError}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#8B5CF6] hover:bg-[#7c4def] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#8B5CF6]/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                ✂️ Apply Crop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
