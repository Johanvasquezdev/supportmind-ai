'use client';

import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { VoiceState } from '@/hooks/useVoiceInput';

interface VoiceMicButtonProps {
  state: VoiceState;
  onStart: () => void;
  onStop: () => void;
  secondsRemaining?: number;
  size?: number;
  disabled?: boolean;
}

export function VoiceMicButton({ 
  state, 
  onStart, 
  onStop, 
  secondsRemaining, 
  size = 28,
  disabled = false
}: VoiceMicButtonProps) {
  const isIdle = state === 'idle';
  const isRequesting = state === 'requesting';
  const isRecording = state === 'recording';
  const isTranscribing = state === 'transcribing';
  const isError = state === 'error';

  return (
    <div className="relative inline-flex flex-col items-center">
      {isRecording && secondsRemaining !== undefined && secondsRemaining <= 10 && (
        <div className="absolute -top-6 font-mono text-[10px] text-[#FF4545] animate-pulse">
          0:{secondsRemaining.toString().padStart(2, '0')}
        </div>
      )}
      
      <button
        onClick={isRecording ? onStop : onStart}
        disabled={disabled || isRequesting || isTranscribing}
        title={state.charAt(0).toUpperCase() + state.slice(1)}
        className={`
          relative flex items-center justify-center transition-all duration-200
          ${isRecording ? 'border-[#FF4545]' : isIdle ? 'border-[#1E1E26]' : 'border-[#1E1E26]'}
          ${isRecording ? 'bg-[#FF4545]/10' : 'bg-transparent'}
          group
        `}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          borderWidth: '1px',
          borderRadius: '2px'
        }}
      >
        {isRecording && (
          <div className="absolute inset-0 border border-[#FF4545] animate-ping opacity-50" style={{ borderRadius: '2px' }} />
        )}

        {(isRequesting || isTranscribing) ? (
          <Loader2 
            size={size * 0.6} 
            className={`animate-spin ${isTranscribing ? 'text-[#00D4FF]' : 'text-[#6B6A72]'}`} 
          />
        ) : isError ? (
          <MicOff size={size * 0.6} className="text-[#FF4545]" />
        ) : (
          <Mic 
            size={size * 0.6} 
            className={`transition-colors ${isRecording ? 'text-[#FF4545]' : 'text-[#6B6A72] group-hover:text-[#F0EEE9]'}`} 
          />
        )}
      </button>
    </div>
  );
}
