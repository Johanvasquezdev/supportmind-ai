'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface AudioPlayerProps {
  audioBlob?: Blob;
  audioUrl?: string;
  summaryText?: string;
  isLoading?: boolean;
}

export function AudioPlayer({ audioBlob, audioUrl, summaryText, isLoading: externalLoading }: AudioPlayerProps) {
  const { 
    isPlaying, 
    isLoading: internalLoading, 
    progress, 
    currentTime, 
    duration, 
    play, 
    pause, 
    resume, 
    seek 
  } = useAudioPlayer();

  const [showText, setShowText] = useState(false);
  const isLoading = externalLoading || internalLoading;
  const [hasInitialized, setHasInitialized] = useState(false);
  const lastSourceRef = React.useRef<Blob | string | null>(null);

  const startPlayback = React.useCallback(async () => {
    const currentSource = audioBlob || audioUrl;
    if (!currentSource) return;

    try {
      lastSourceRef.current = currentSource;
      await play(currentSource);
      setHasInitialized(true);
    } catch (err) {
      console.error('Audio playback failed or was blocked:', err);
    }
  }, [audioBlob, audioUrl, play]);

  useEffect(() => {
    const currentSource = audioBlob || audioUrl;
    if (currentSource && currentSource !== lastSourceRef.current && !hasInitialized) {
      // Attempt auto-play but don't force it if blocked
      startPlayback();
    }
  }, [audioBlob, audioUrl, hasInitialized, startPlayback]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const fraction = x / rect.width;
    seek(fraction);
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      <div className="flex items-center gap-3 w-full bg-[#131318] border border-[#1E1E26] p-2" style={{ borderRadius: '2px' }}>
        <button
          onClick={isPlaying ? pause : resume}
          className="text-[#F0EEE9] hover:text-[#00D4FF] transition-colors"
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>

        <div 
          role="button"
          tabIndex={0}
          aria-label="Seek audio"
          className="relative flex-1 h-[3px] bg-[#1E1E26] cursor-pointer group outline-none"
          onClick={handleProgressBarClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              // For keyboard seek, we just toggle or seek to start? 
              // Better to just seek to start or do nothing if complex.
              // We'll leave it as a button for now.
            }
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent animate-shimmer" />
          )}
          <div 
            className="absolute top-0 left-0 h-full bg-[#00D4FF] transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="font-mono text-[10px] text-[#6B6A72] min-w-[70px] text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {summaryText && (
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setShowText(!showText)}
            className="flex items-center gap-1 font-mono text-[11px] text-[#6B6A72] hover:text-[#F0EEE9] transition-colors w-fit"
          >
            {showText ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showText ? 'Hide text' : 'Show text'}
          </button>
          
          {showText && (
            <div className="bg-[#131318]/50 border-l border-[#1E1E26] p-3 font-sans text-[13px] text-[#6B6A72] leading-relaxed">
              {summaryText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
