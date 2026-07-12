import React, { useRef, useState, useCallback } from 'react';
import { VideoFrame } from '../types';

interface VideoProcessorProps {
  onFramesExtracted: (frames: VideoFrame[]) => void;
  onProcessingUpdate: (progress: number) => void;
  onError: (error: string) => void;
}

const VideoProcessor: React.FC<VideoProcessorProps> = ({ onFramesExtracted, onProcessingUpdate, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processFile = useCallback((file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      onError("Unsupported format. Use MP4, MOV, JPG, or PNG.");
      return;
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);

    if (file.type.startsWith('image/')) {
      setFileType('image');
    } else {
      setFileType('video');
    }
  }, [previewUrl, onError]);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const startAnalysis = async () => {
    if (!selectedFile || !previewUrl) return;

    setIsProcessing(true);

    // PHOTO PROCESSING
    if (fileType === 'image') {
      const img = new Image();
      img.src = previewUrl;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const frame: VideoFrame = {
          timestamp: 0,
          dataUrl: canvas.toDataURL('image/jpeg', 0.9)
        };
        
        onProcessingUpdate(100);
        onFramesExtracted([frame]);
        setIsProcessing(false);
      };
      return;
    }

    // VIDEO PROCESSING
    if (fileType === 'video') {
      const video = videoRef.current;
      if (!video) return;

      const frames: VideoFrame[] = [];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const scale = Math.min(1, 1280 / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      const totalFramesToExtract = Math.min(Math.floor(video.duration), 15);

      for (let i = 0; i < totalFramesToExtract; i++) {
        video.currentTime = i;
        await new Promise((resolve) => {
          const onSeeked = () => {
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              frames.push({
                timestamp: i,
                dataUrl: canvas.toDataURL('image/jpeg', 0.85)
              });
            }
            onProcessingUpdate(Math.round(((i + 1) / totalFramesToExtract) * 100));
            video.removeEventListener('seeked', onSeeked);
            resolve(true);
          };
          video.addEventListener('seeked', onSeeked);
        });
      }

      onFramesExtracted(frames);
      setIsProcessing(false);
    }
  };

  const resetSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileType(null);
    setSelectedFile(null);
    setCurrentTime(0);
    setDuration(0);
  };

  return (
    <div className="space-y-4">
      {!previewUrl ? (
        <div
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl bg-slate-800/20 hover:border-amber-500/50 hover:bg-slate-800/40 transition-all cursor-pointer group relative overflow-hidden ${isDragging ? 'border-amber-500/80 bg-slate-800/50 scale-[1.01]' : 'border-slate-700'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="video/*,image/*"
            onChange={handleFileSelection}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            disabled={isProcessing}
          />
          <div className="flex flex-col items-center pointer-events-none relative z-10">
            <div className={`w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border transition-colors shadow-xl ${isDragging ? 'border-amber-500/80' : 'border-slate-800 group-hover:border-amber-500/50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-colors ${isDragging ? 'text-amber-500' : 'text-slate-400 group-hover:text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-200 uppercase tracking-widest text-center">
              {isDragging ? 'Drop to Stage' : 'Stage Media'}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">
              {isDragging ? 'Release to upload' : 'Drag & drop or click — JPG, PNG, MP4, MOV'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {fileType === 'image' ? (
              <img src={previewUrl} className="w-full h-full object-contain" alt="Selected Preview" />
            ) : (
              <video 
                ref={videoRef} 
                src={previewUrl} 
                className="w-full h-full object-contain"
                onLoadedMetadata={handleMetadataLoaded}
                playsInline
                muted
              />
            )}
            <button 
              onClick={resetSelection}
              disabled={isProcessing}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500/80 rounded-full text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {fileType === 'video' && duration > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase">
                <span>Timestamp: {currentTime.toFixed(1)}s</span>
                <span>Total: {duration.toFixed(1)}s</span>
              </div>
              <input 
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={currentTime}
                onChange={handleSliderChange}
                disabled={isProcessing}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
              />
            </div>
          )}

          <button 
            onClick={startAnalysis}
            disabled={isProcessing}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl transition-all shadow-[0_10px_20px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing Buffer..." : "Final Upload & Analyze"}
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default VideoProcessor;
