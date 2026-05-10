import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { transcribeAudio } from '@/lib/voice-api';

export type VoiceState = 'idle' | 'requesting' | 'recording' | 'transcribing' | 'done' | 'error';

export function useVoiceInput() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const { getToken } = useAuth();

  const cleanup = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    if (mediaRecorder.current?.stream) {
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  }, []);

  const stop = useCallback(async () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setState('transcribing');
    }
  }, []);

  const start = useCallback(async () => {
    try {
      setState('requesting');
      setError(null);
      setTranscript('');
      setLastBlob(null);
      setSecondsRemaining(60);
      chunks.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg',
        'audio/mp4'
      ].find(type => MediaRecorder.isTypeSupported(type));

      if (!mimeType) {
        throw new Error('No supported audio mime types found in this browser.');
      }

      mediaRecorder.current = new MediaRecorder(stream, { mimeType });
      
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        try {
          const blob = new Blob(chunks.current, { type: mimeType });
          setLastBlob(blob);
          const token = await getToken();
          if (!token) throw new Error('Not authenticated');
          
          const { text } = await transcribeAudio(blob, token);
          setTranscript(text);
          setState('done');
        } catch (err: any) {
          setError(err.message || 'Failed to transcribe audio');
          setState('error');
        } finally {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.current.start(250);
      setState('recording');

      timer.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Check browser permissions.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found.');
      } else {
        setError(err.message || 'Failed to start recording');
      }
      setState('error');
    }
  }, [getToken, stop]);

  const reset = useCallback(() => {
    cleanup();
    setState('idle');
    setTranscript('');
    setLastBlob(null);
    setError(null);
    setSecondsRemaining(60);
  }, [cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    state,
    transcript,
    lastBlob,
    error,
    secondsRemaining,
    start,
    stop,
    reset
  };
}
