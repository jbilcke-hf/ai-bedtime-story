import { useCallback, useEffect, useRef } from 'react';

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const stopAudio = useCallback(() => {
    audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  // Helper function to handle conversion from Base64 to an ArrayBuffer
  async function base64ToArrayBuffer(base64: string): Promise<ArrayBuffer> {
    const response = await fetch(base64);
    return response.arrayBuffer();
  }

  const playAudio = useCallback(
    async (base64Data?: string) => {
      stopAudio(); // Stop any playing audio first

      // If no base64 data provided, we don't attempt to play any audio
      if (!base64Data) {
        return;
      }

      // Initialize AudioContext
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Format Base64 string if necessary and get ArrayBuffer
      const formattedBase64 =
        base64Data.startsWith('data:audio/wav') || base64Data.startsWith('data:audio/wav;base64,')
          ? base64Data
          : `data:audio/wav;base64,${base64Data}`;

      console.log(`formattedBase64: ${formattedBase64.slice(0, 50)} (len: ${formattedBase64.length})`);

      const arrayBuffer = await base64ToArrayBuffer(formattedBase64);

      return new Promise((resolve, reject) => {
        // Decode the audio data and play
        audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
          // Create a source node and gain node
          const source = audioContext.createBufferSource();
          const gainNode = audioContext.createGain();
          
          // Set buffer and gain
          source.buffer = audioBuffer;
          gainNode.gain.value = 1.0; 

          // Connect nodes
          source.connect(gainNode);
          gainNode.connect(audioContext.destination);

          // Start playback and handle finishing
          source.start();
          
          source.onended = () => {
            stopAudio();
            resolve(true);
          };
        }, (error) => {
          console.error('Error decoding audio data:', error);
          reject(error);
        });
      })
    },
    [stopAudio]
  );

  // Effect to handle cleanup on component unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Return the playAudio function from the hook
  return playAudio;
}