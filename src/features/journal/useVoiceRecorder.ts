import { useState, useRef, useCallback } from 'react';

const MAX_RECORDING_DURATION_MS = 300_000; 

type RecorderStatus = 'idle' | 'recording' | 'processing' | 'error';

interface VoiceRecorderState {
  status: RecorderStatus;
  audioBlob: Blob | null;
  durationMs: number;
  errorMessage: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

function getSupportedMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];

  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return 'audio/webm';
}

export function useVoiceRecorder(): VoiceRecorderState {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;

      if (recorder.state !== 'inactive') {
        recorder.stop();
      }

      recorder.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      setAudioBlob(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const elapsed = Date.now() - startTimeRef.current;
        setDurationMs(elapsed);

        if (chunksRef.current.length === 0) {
          setErrorMessage('The recording was empty. Please try again.');
          setStatus('idle');
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setStatus('idle');
      };

      recorder.onerror = () => {
        cleanup();
        setErrorMessage('An error occurred while recording. Please try again.');
        setStatus('error');
      };

      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      recorder.start(1000); 
      setStatus('recording');

      
      timerRef.current = setInterval(() => {
        setDurationMs(Date.now() - startTimeRef.current);
      }, 100);

      
      maxDurationTimerRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_DURATION_MS);
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow microphone access in your browser settings and try again.'
          : 'Could not access the microphone. Please check your device settings.';

      setErrorMessage(message);
      setStatus('error');
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      setStatus('processing');

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  }, []);

  const resetRecording = useCallback(() => {
    cleanup();
    setStatus('idle');
    setAudioBlob(null);
    setDurationMs(0);
    setErrorMessage(null);
    chunksRef.current = [];
  }, [cleanup]);

  return {
    status,
    audioBlob,
    durationMs,
    errorMessage,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
