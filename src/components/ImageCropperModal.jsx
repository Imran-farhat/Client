import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Aspect Ratio Presets
 */
const ASPECT_PRESETS = [
  { id: 'idcard', label: '🪪 ID Card (5:6)', ratio: 5 / 6 },
  { id: 'passport', label: '👤 Passport (3:4)', ratio: 3 / 4 },
  { id: 'square', label: '⏹️ Square (1:1)', ratio: 1 / 1 },
  { id: 'free', label: '🔓 Free', ratio: null },
];

/**
 * ImageCropperModal Component
 *
 * Props:
 * - imageSrc: String (URL, DataURL) or File/Blob to crop
 * - member: Optional member object (if cropping directly for a specific member)
 * - title: Optional modal title
 * - onCropComplete: (croppedBlob, croppedDataUrl, croppedFile) => void
 * - onDirectSave: (croppedBlob, croppedDataUrl, croppedFile, andApprove) => Promise<void> | void
 * - onClose: () => void
 * - saving: Boolean flag for save loading state
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

  // Transformations
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [aspectPreset, setAspectPreset] = useState('idcard');
  const [showGrid, setShowGrid] = useState(true);

  // Mouse / Touch Drag State
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastOffsetRef = useRef({ x: 0, y: 0 });

  // Viewport Container Ref
  const containerRef = useRef(null);

  // Live mini preview canvas
  const previewCanvasRef = useRef(null);

  // Load and sanitize image source
  useEffect(() => {
    if (!imageSrc) {
      setLoadError('புகைப்படம் காணப்படவில்லை / No image provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setOffset({ x: 0, y: 0 });

    let isCancelled = false;
    let objectUrlToRevoke = null;

    const prepareImage = async () => {
      try {
        let srcToLoad = imageSrc;

        // If it's a File or Blob, create an Object URL
        if (imageSrc instanceof Blob || imageSrc instanceof File) {
          srcToLoad = URL.createObjectURL(imageSrc);
          objectUrlToRevoke = srcToLoad;
        } else if (typeof imageSrc === 'string' && imageSrc.startsWith('http')) {
          // Attempt to fetch as blob with CORS to prevent canvas tainting
          try {
            const resp = await fetch(imageSrc, { mode: 'cors' });
            if (resp.ok) {
              const blob = await resp.blob();
              srcToLoad = URL.createObjectURL(blob);
              objectUrlToRevoke = srcToLoad;
            }
          } catch (e) {
            console.warn('Direct fetch failed, falling back to direct URL with crossOrigin anonymous:', e);
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

  // Current active aspect ratio
  const activeAspect = ASPECT_PRESETS.find(p => p.id === aspectPreset)?.ratio || (5 / 6);

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (e) => {
    if (!loadedImage) return;
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY };
    lastOffsetRef.current = { ...offset };
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging || !loadedImage) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;

    setOffset({
      x: lastOffsetRef.current.x + dx,
      y: lastOffsetRef.current.y + dy
    });
  }, [isDragging, loadedImage]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
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
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    setZoom(prev => Math.min(Math.max(0.5, prev + zoomDelta), 3.5));
  };

  // Reset to initial framing
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setOffset({ x: 0, y: 0 });
    setAspectPreset('idcard');
  };

  // Rotate 90 degrees
  const rotateLeft = () => setRotation(r => (r - 90 + 360) % 360);
  const rotateRight = () => setRotation(r => (r + 90) % 360);
  const toggleFlipH = () => setFlipH(f => !f);

  // Generate cropped output canvas / blob
  const generateCroppedBlob = useCallback(async (targetWidth = 600) => {
    if (!loadedImage) return null;

    const ratio = activeAspect || (loadedImage.naturalWidth / loadedImage.naturalHeight);
    const targetHeight = Math.round(targetWidth / ratio);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill clean white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate crop geometry
    const cropBox = containerRef.current ? containerRef.current.getBoundingClientRect() : { width: 300, height: 360 };
    const cropBoxW = cropBox.width || 300;
    const cropBoxH = cropBox.height || 360;

    // Scale from crop box dimensions to target canvas dimensions
    const scaleFactor = targetWidth / cropBoxW;

    ctx.save();
    // Center of canvas
    ctx.translate(targetWidth / 2, targetHeight / 2);

    // Apply User Drag Offset
    ctx.translate(offset.x * scaleFactor, offset.y * scaleFactor);

    // Apply Rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply Flip
    if (flipH) {
      ctx.scale(-1, 1);
    }

    // Determine base scale to fit image into cropBox
    const isRotated90or270 = rotation === 90 || rotation === 270;
    const imgNaturalW = isRotated90or270 ? loadedImage.naturalHeight : loadedImage.naturalWidth;
    const imgNaturalH = isRotated90or270 ? loadedImage.naturalWidth : loadedImage.naturalHeight;

    const baseScale = Math.max(cropBoxW / imgNaturalW, cropBoxH / imgNaturalH);
    const finalScale = baseScale * zoom * scaleFactor;

    // Draw image centered
    const drawW = loadedImage.naturalWidth * finalScale;
    const drawH = loadedImage.naturalHeight * finalScale;

    ctx.drawImage(
      loadedImage,
      -drawW / 2,
      -drawH / 2,
      drawW,
      drawH
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          const fileName = `cropped_member_${member?.member_id || 'photo'}_${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          resolve({ blob, dataUrl, file });
        },
        'image/jpeg',
        0.88
      );
    });
  }, [loadedImage, activeAspect, zoom, rotation, flipH, offset, member]);

  // Update live preview thumbnail
  useEffect(() => {
    if (!loadedImage || !previewCanvasRef.current) return;
    let isCancelled = false;

    const updatePreview = async () => {
      const result = await generateCroppedBlob(140);
      if (!result || isCancelled) return;
      const previewImg = new Image();
      previewImg.onload = () => {
        if (isCancelled || !previewCanvasRef.current) return;
        const ctx = previewCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 70, 84);
          ctx.drawImage(previewImg, 0, 0, 70, 84);
        }
      };
      previewImg.src = result.dataUrl;
    };

    updatePreview();

    return () => {
      isCancelled = true;
    };
  }, [generateCroppedBlob, loadedImage]);

  // Handle Apply / Save
  const handleApply = async (andApprove = false) => {
    const result = await generateCroppedBlob(600);
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0F172A] text-white rounded-2xl shadow-2xl border border-gray-700/60 overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FF6B00]/20 border border-[#FF6B00]/40 flex items-center justify-center text-lg">
              ✂️
            </div>
            <div>
              <h3 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
                {title || 'புகைப்படம் பயிர் செய் / Crop Member ID Photo'}
              </h3>
              {member && (
                <div className="flex items-center gap-2 text-xs text-gray-300 mt-0.5">
                  <span className="font-semibold text-[#FFB347]">{member.full_name}</span>
                  <span>•</span>
                  <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-gray-300">
                    {member.member_id}
                  </span>
                  {member.status === 'rejected' && (
                    <span className="bg-red-900/60 text-red-300 text-[10px] px-2 py-0.5 rounded-full border border-red-700">
                      ❌ Rejected
                    </span>
                  )}
                  {member.status === 'pending' && (
                    <span className="bg-amber-900/60 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-700">
                      ⏳ Pending
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center text-sm transition"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Main Cropper Area */}
          <div className="relative flex flex-col md:flex-row items-center justify-center gap-5 bg-black/40 rounded-xl p-3 border border-gray-800">
            {/* Interactive Viewport */}
            <div className="relative flex items-center justify-center overflow-hidden">
              {loading ? (
                <div className="w-64 h-80 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <div className="w-8 h-8 border-3 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">ஏற்றுகிறது... Loading photo</span>
                </div>
              ) : loadError ? (
                <div className="w-64 h-80 flex flex-col items-center justify-center text-red-400 p-4 text-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <span className="text-xs">{loadError}</span>
                </div>
              ) : (
                <div
                  ref={containerRef}
                  onMouseDown={handlePointerDown}
                  onTouchStart={handlePointerDown}
                  onWheel={handleWheel}
                  className="relative cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-lg shadow-inner bg-[#18202F]"
                  style={{
                    width: activeAspect ? (activeAspect >= 1 ? '280px' : `${Math.round(336 * activeAspect)}px`) : '280px',
                    height: activeAspect ? (activeAspect >= 1 ? `${Math.round(280 / activeAspect)}px` : '336px') : '336px',
                    border: '2px solid #FF6B00',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                    touchAction: 'none'
                  }}
                >
                  {/* The Image inside viewport */}
                  {loadedImage && (
                    <img
                      src={loadedImage.src}
                      alt="Crop View"
                      draggable={false}
                      className="pointer-events-none absolute origin-center max-w-none transition-none"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${flipH ? -zoom : zoom}, ${zoom})`,
                        width: (rotation === 90 || rotation === 270) ? 'auto' : '100%',
                        height: (rotation === 90 || rotation === 270) ? '100%' : 'auto',
                        minWidth: '100%',
                        minHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  )}

                  {/* 3x3 Rule-of-Thirds Grid & Face Positioning Guides */}
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Vertical grid lines */}
                      <div className="absolute top-0 bottom-0 left-1/3 w-[1px] bg-white/25"></div>
                      <div className="absolute top-0 bottom-0 left-2/3 w-[1px] bg-white/25"></div>
                      {/* Horizontal grid lines */}
                      <div className="absolute left-0 right-0 top-1/3 h-[1px] bg-white/25"></div>
                      <div className="absolute left-0 right-0 top-2/3 h-[1px] bg-white/25"></div>

                      {/* Head / Eye Level Guide Indicator (Top 35% mark) */}
                      <div className="absolute left-3 right-3 top-[32%] border-b border-dashed border-[#FFB347]/60 flex items-center justify-between">
                        <span className="text-[9px] text-[#FFB347] bg-black/60 px-1 rounded -translate-y-1/2">
                          👀 Eye Level
                        </span>
                        <span className="text-[9px] text-[#FFB347] bg-black/60 px-1 rounded -translate-y-1/2">
                          கண்கள்
                        </span>
                      </div>

                      {/* Center crosshair */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-40">
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white"></div>
                        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white"></div>
                      </div>
                    </div>
                  )}

                  {/* Drag hint overlay badge */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-gray-300 text-[10px] px-2 py-0.5 rounded-full pointer-events-none border border-white/10 backdrop-blur-sm whitespace-nowrap">
                    ✋ இழுத்து பொருத்தவும் / Drag to frame
                  </div>
                </div>
              )}
            </div>

            {/* Live ID Card Preview Thumbnail Box */}
            <div className="flex flex-col items-center bg-[#1E293B] p-3 rounded-xl border border-gray-700/80 shadow-md text-center min-w-[130px]">
              <span className="text-[11px] font-bold text-gray-300 mb-2 uppercase tracking-wider">
                ID Card Preview
              </span>
              <div className="relative p-1 bg-white rounded-md shadow-md">
                <canvas
                  ref={previewCanvasRef}
                  width={70}
                  height={84}
                  className="rounded-[2px] block bg-gray-100"
                  style={{ width: '70px', height: '84px', border: '1.5px solid #003366' }}
                />
                <div className="text-[8px] font-bold text-[#003366] mt-0.5 truncate max-w-[70px]">
                  {member?.full_name || 'MEMBER'}
                </div>
              </div>
              <span className="text-[10px] text-gray-400 mt-2">
                உறுப்பினர் அட்டை வடிவம்
              </span>
            </div>
          </div>

          {/* ── Aspect Ratio Presets ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span className="font-semibold">வடிவ விகிதம் / Aspect Ratio:</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-400 hover:text-white">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600 text-[#FF6B00] focus:ring-0"
                />
                <span>வழிகாட்டி கோடுகள் / Guides</span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ASPECT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setAspectPreset(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                    aspectPreset === preset.id
                      ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/30'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Zoom Slider & Controls ── */}
          <div className="bg-[#1E293B] p-3 rounded-xl border border-gray-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span className="font-semibold flex items-center gap-1.5">
                🔍 பெரிதாக்கு / Zoom: <span className="text-[#FFB347] font-mono">{Math.round(zoom * 100)}%</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                  className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center font-bold text-xs"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(3.5, z + 0.1))}
                  className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.5"
              step="0.02"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
            />

            {/* ── Rotation & Action Buttons ── */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-700/60">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={rotateLeft}
                  className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-xs rounded-md text-gray-200 border border-gray-700 flex items-center gap-1"
                  title="Rotate 90° Left"
                >
                  <span>↺</span> 90° இடது
                </button>
                <button
                  type="button"
                  onClick={rotateRight}
                  className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-xs rounded-md text-gray-200 border border-gray-700 flex items-center gap-1"
                  title="Rotate 90° Right"
                >
                  <span>↻</span> 90° வலது
                </button>
                <button
                  type="button"
                  onClick={toggleFlipH}
                  className={`px-2.5 py-1 text-xs rounded-md border flex items-center gap-1 ${
                    flipH
                      ? 'bg-[#003366] text-[#FFB347] border-[#FFB347]'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                  }`}
                  title="Flip Horizontal"
                >
                  <span>↔</span> திருப்பு / Flip
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-gray-400 hover:text-white underline transition px-1"
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>

        {/* ── Modal Footer / Actions ── */}
        <div className="px-5 py-3.5 bg-[#1E293B] border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition border border-gray-700"
          >
            ✕ ரத்து / Cancel
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
                    {saving ? 'அனுமதிக்கிறது...' : '✅ சேமித்து அனுமதி / Save & Approve'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleApply(false)}
                  disabled={saving || loading || !!loadError}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-[#FF6B00] hover:bg-[#ff7b1a] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#FF6B00]/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? 'சேமிக்கிறது...' : '💾 படம் சேமி / Save Photo'}
                </button>
              </>
            )}

            {/* Standard crop apply (for Edit form / Register tab) */}
            {(!onDirectSave || !member) && (
              <button
                type="button"
                onClick={() => handleApply(false)}
                disabled={saving || loading || !!loadError}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#FF6B00] hover:bg-[#ff7b1a] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#FF6B00]/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                ✂️ பயிர் செய் / Apply Crop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
