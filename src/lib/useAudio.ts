import { useCallback, useEffect, useRef } from "react"

/**
 * Custom React hook to play a Base64 WAV file.
 */
export function useAudio() {
  // Reference to keep track of the current Audio object
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // This cleanup function will stop the audio and clean up the audio element
  const stopAndCleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ''; // Release the object URL to avoid memory leaks
      audioRef.current = null;
    }
  }, []);

  // Function to load and play the audio, or stop it if called without parameters
  const playAudio = useCallback(
    (base64Data?: string) => {
      const base64str = `${base64Data || ""}`
      if (base64str) {
        const base64wav = base64str.startsWith("data:audio/wav")
          ? base64str
          : `data:audio/wav;base64,${base64str}`
      
        // Clean up any existing audio first
        stopAndCleanupAudio();

        // Create a new Audio object and start playing
        audioRef.current = new Audio(base64wav);
        audioRef.current.play().catch((e) => {
          console.error('Failed to play the audio:', e);
        });
      } else {
        // If no base64 data provided, stop the audio
        stopAndCleanupAudio();
      }
    },
    [stopAndCleanupAudio]
  );

  // Effect to handle cleanup on component unmount
  useEffect(() => {
    return () => {
      stopAndCleanupAudio();
    };
  }, [stopAndCleanupAudio]);

  // Return the playAudio function from the hook
  return playAudio;
}

