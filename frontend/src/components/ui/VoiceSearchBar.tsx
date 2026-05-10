'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { VoiceMicButton } from './VoiceMicButton';
import { voiceSearch } from '@/lib/voice-api';

interface VoiceSearchBarProps {
  onResults: (query: string, results: any[]) => void;
}

export function VoiceSearchBar({ onResults }: VoiceSearchBarProps) {
  const { state, transcript, lastBlob, error, start, stop, reset, secondsRemaining } = useVoiceInput();
  const { getToken } = useAuth();

  useEffect(() => {
    async function performSearch() {
      if (state === 'done' && lastBlob) {
        try {
          const token = await getToken();
          if (!token) return;
          
          const { query, results } = await voiceSearch(lastBlob, token);
          onResults(query, results);
        } catch (err) {
          console.error('Voice search failed', err);
        }
      }
    }
    performSearch();
  }, [state, lastBlob, getToken, onResults]);

  // Modified logic: VoiceSearchBar will use a separate mechanism if it needs the blob directly,
  // or I'll just use the transcript and call RagService if I can.
  // But the prompt specifically says "On done: call voiceSearch(blob, token), then onResults()"
  
  // I'll update useVoiceInput to return the blob.
  
  const getStatusText = () => {
    switch (state) {
      case 'idle': return 'Search your documents by voice';
      case 'recording': return 'Listening…';
      case 'transcribing': return 'Searching…';
      case 'error': return error || 'An error occurred';
      default: return '';
    }
  };

  return (
    <div 
      className="flex items-center gap-4 w-full bg-[#131318] border border-[#1E1E26] p-4 transition-all duration-200"
      style={{ borderRadius: '2px' }}
    >
      <VoiceMicButton 
        state={state} 
        onStart={start} 
        onStop={stop} 
        secondsRemaining={secondsRemaining}
        size={24}
      />
      
      <div className={`font-mono text-[12px] flex-1 ${state === 'error' ? 'text-[#FF4545]' : 'text-[#6B6A72]'}`}>
        {getStatusText()}
      </div>
    </div>
  );
}
