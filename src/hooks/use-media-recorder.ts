"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

type Status = 'idle' | 'permission-requested' | 'recording' | 'stopped' | 'error';

export function useMediaRecorder(videoRef: React.RefObject<HTMLVideoElement>) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<Error | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Attach stream to video element when it becomes available
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }

    // Cleanup function to stop tracks and remove srcObject
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [videoRef]);

  const requestPermissionAndStart = useCallback(async () => {
    setStatus('permission-requested');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Mute self-view to prevent feedback
        videoRef.current.play().catch(console.error); // Start playing the video
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setStatus('recording');
      return stream;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error accessing media devices.'));
      setStatus('error');
      console.error('Error accessing media devices.', err);
      return null;
    }
  }, [videoRef]);

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && status === 'recording') {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(blob);

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
          setStatus('stopped');
          recordedChunksRef.current = [];
        };
        mediaRecorderRef.current.stop();
      } else {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        resolve('');
      }
    });
  }, [status, videoRef]);
  
  return { status, error, requestPermissionAndStart, stopRecording };
}
