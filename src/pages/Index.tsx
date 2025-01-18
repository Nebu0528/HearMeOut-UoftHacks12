import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateResponse, INTERVIEW_FORMAT } from "@/lib/gemini";
import { textToSpeech, playAudio } from "@/lib/elevenlabs";
import { useToast } from "@/components/ui/use-toast";
import { RotateCcw, Mic, Key, Volume2, List } from "lucide-react";
import RecordRTC from "recordrtc";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Voice {
  voice_id: string;
  name: string;
}

type InterviewState = "initial" | "got_resume" | "got_job" | "got_question_types" | "questions_ready";

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! Please start by sharing your resume so I can help you prepare for your interview.",
    },
  ]);
  const [interviewState, setInterviewState] = useState<InterviewState>("initial");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceId, setVoiceId] = useState<string | null>("EXAVITQu4vr4xnSDxMaL");
  const [useDefaultVoice, setUseDefaultVoice] = useState(true);
  const [apiKey, setApiKey] = useState<string>("");
  const [geminiKey, setGeminiKey] = useState<string>("");
  const recorder = useRef<RecordRTC | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const resumeContent = useRef<string>("");
  const targetJob = useRef<string>("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startRecording = async () => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your ElevenLabs API key first.",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
      });
      recorder.current.startRecording();
      setIsRecording(true);
      setUseDefaultVoice(false);

      // Stop recording after 30 seconds
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 30000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
      });
    }
  };

  const stopRecording = () => {
    if (recorder.current) {
      recorder.current.stopRecording(async () => {
        const blob = await recorder.current!.getBlob();
        await cloneVoice(blob);
        setIsRecording(false);
      });
    }
  };

  const cloneVoice = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('name', 'My Voice');
      formData.append('files', audioBlob, 'recording.wav');

      const headers = new Headers();
      headers.append('xi-api-key', apiKey);

      const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData?.detail?.status === "voice_limit_reached") {
          toast({
            title: "Voice Limit Reached",
            description: "You've reached the limit of 10 custom voices. To add new voices, either delete existing ones from your ElevenLabs dashboard or upgrade your subscription. Using default voice for now.",
          });
          setUseDefaultVoice(true);
          setVoiceId("EXAVITQu4vr4xnSDxMaL"); // Fallback to Sarah's voice
          return;
        }

        throw new Error(JSON.stringify(errorData));
      }

      const data = await response.json();
      setVoiceId(data.voice_id);
      setUseDefaultVoice(false);
      
      toast({
        title: "Success",
        description: "Voice successfully cloned! Your responses will now be in your voice.",
      });
    } catch (error) {
      console.error('Voice cloning error:', error);
      toast({
        variant: "destructive",
        title: "Voice Cloning Failed",
        description: "Using default voice instead. Please try again or check your ElevenLabs subscription.",
      });
      setUseDefaultVoice(true);
      setVoiceId("EXAVITQu4vr4xnSDxMaL"); // Fallback to Sarah's voice
    }
  };

  const handleSubmit = async (message: string) => {
    if (!geminiKey) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your Gemini API key first.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const newMessages = [...messages, { role: "user" as const, content: message }];
      setMessages(newMessages);

      let nextPrompt = "";
      let nextState = interviewState;

      switch (interviewState) {
        case "initial":
          resumeContent.current = message;
          nextPrompt = "Thank you for sharing your resume. What specific job position are you targeting?";
          nextState = "got_resume";
          break;
        case "got_resume":
          targetJob.current = message;
          nextPrompt = "What types of interview questions are you expecting or would like to practice? (e.g., technical, behavioral, leadership)";
          nextState = "got_job";
          break;
        case "got_job":
          const context = `Resume: ${resumeContent.current}\nTarget Job: ${targetJob.current}\nExpected Question Types: ${message}`;
          const response = await generateResponse(INTERVIEW_FORMAT + "\n\n" + context, geminiKey);
          nextPrompt = response;
          nextState = "questions_ready";
          break;
        case "got_question_types":
        case "questions_ready":
          const conversationContext = INTERVIEW_FORMAT + "\n\nCurrent conversation:\n" +
            newMessages.map(msg => `${msg.role === "assistant" ? "Assistant" : "User"}: ${msg.content}`).join("\n");
          nextPrompt = await generateResponse(conversationContext, geminiKey);
          break;
      }

      setInterviewState(nextState);
      setMessages([...newMessages, { role: "assistant" as const, content: nextPrompt }]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate response",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ttsQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);

  const processQueue = async () => {
    if (isProcessing.current || ttsQueue.current.length === 0) return;

    isProcessing.current = true;
    const content = ttsQueue.current[0];

    try {
      const audioBuffer = await textToSpeech(content, apiKey, voiceId);
      await playAudio(audioBuffer);
      ttsQueue.current.shift(); // Remove processed item
    } catch (error: any) {
      const errorDetail = error.message ? JSON.parse(error.message).detail : null;
      
      if (errorDetail?.status === "too_many_concurrent_requests") {
        toast({
          variant: "destructive",
          title: "Too Many Requests",
          description: "Please wait a moment before playing more messages.",
        });
        // Keep the item in queue to retry
        setTimeout(() => {
          isProcessing.current = false;
          processQueue();
        }, 2000);
        return;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorDetail?.message || "Failed to play audio. Please try again.",
      });
    } finally {
      isProcessing.current = false;
      if (ttsQueue.current.length > 0) {
        processQueue();
      }
    }
  };

  const handlePlayResponse = async (content: string) => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your ElevenLabs API key first.",
      });
      return;
    }

    // Add to queue and process
    ttsQueue.current.push(content);
    processQueue();
  };

  const handleRestart = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hello! Please start by sharing your resume so I can help you prepare for your interview.",
      },
    ]);
  };

  const toggleDefaultVoice = () => {
    setUseDefaultVoice(prev => !prev);
    if (!useDefaultVoice) {
      setVoiceId("EXAVITQu4vr4xnSDxMaL"); // Sarah's voice
    } else {
      setVoiceId(null); // Clear voice ID when disabling Sarah's voice
    }
  };

  const checkVoices = async () => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your ElevenLabs API key first.",
      });
      return;
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      const customVoices = data.voices.filter((voice: Voice) => !voice.name.startsWith('Preview'));
      
      toast({
        title: "Your Custom Voices",
        description: `You have ${customVoices.length} custom voices. View them in detail on your ElevenLabs dashboard.`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch voices. Please check your API key.",
      });
    }
  };

  return (
    <div className="container flex h-screen flex-col py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interview Practice Assistant</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-gray-500" />
            <Input
              type="password"
              placeholder="Enter ElevenLabs API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-64"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={checkVoices}
              disabled={!apiKey}
              title="Check custom voices"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-gray-500" />
            <Input
              type="password"
              placeholder="Enter Gemini API Key"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-64"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={useDefaultVoice ? "default" : "outline"}
              size="icon"
              onClick={toggleDefaultVoice}
              className="relative"
              title={useDefaultVoice ? "Disable Sarah's voice" : "Use Sarah's voice"}
            >
              <Volume2 className="h-4 w-4" />
              {useDefaultVoice && (
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? "animate-pulse bg-red-100" : ""}
              disabled={!apiKey || useDefaultVoice}
              title={useDefaultVoice ? "Disable Sarah's voice to record" : "Record your voice"}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border bg-white p-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            {...message}
            isPlayable={message.role === "assistant" && (voiceId !== null || useDefaultVoice)}
            onPlay={() => handlePlayResponse(message.content)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4">
        <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
      </div>
    </div>
  );
}
