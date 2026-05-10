import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSource, setCurrentSource] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(1);
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.currentTime / audio.duration);
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      if (currentSource && currentSource.startsWith('blob:')) {
        URL.revokeObjectURL(currentSource);
      }
    };
  }, [currentSource]);

  const play = useCallback(async (source: Blob | string) => {
    if (!audioRef.current) return;

    const url = source instanceof Blob ? URL.createObjectURL(source) : source;
    setCurrentSource(url);
    audioRef.current.src = url;
    return audioRef.current.play();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    return audioRef.current?.play();
  }, []);

  const seek = useCallback((fraction: number) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    audioRef.current.currentTime = fraction * audioRef.current.duration;
  }, []);

  return {
    isPlaying,
    isLoading,
    progress,
    currentTime,
    duration,
    play,
    pause,
    resume,
    seek
  };
}
