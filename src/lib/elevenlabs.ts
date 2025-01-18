export async function textToSpeech(text: string, apiKey: string, voiceId?: string | null): Promise<ArrayBuffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || "EXAVITQu4vr4xnSDxMaL"}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate speech");
  }

  return response.arrayBuffer();
}

export async function playAudio(audioBuffer: ArrayBuffer) {
  const audioContext = new AudioContext();
  const audioSource = audioContext.createBufferSource();
  
  const audioData = await audioContext.decodeAudioData(audioBuffer);
  audioSource.buffer = audioData;
  audioSource.connect(audioContext.destination);
  audioSource.start(0);
}