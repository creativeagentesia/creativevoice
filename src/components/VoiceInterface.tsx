import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChat, RealtimeMessage } from "@/utils/RealtimeAudio";
import { AudioVisualizer } from "./AudioVisualizer";
import { cn } from "@/lib/utils";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "speaking" | "listening";

interface TranscriptItem {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function VoiceInterface() {
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const chatRef = useRef<RealtimeChat | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [transcript, scrollToBottom]);

  const handleMessage = useCallback((event: RealtimeMessage) => {
    console.log("Voice event:", event.type);

    if (event.type === "session.created" || event.type === "session.updated") {
      setStatus("listening");
    }

    if (event.type === "input_audio_buffer.speech_started") {
      setStatus("listening");
    }

    if (event.type === "response.audio.delta") {
      setStatus("speaking");
    }

    if (event.type === "response.audio.done") {
      setStatus("listening");
    }

    // Handle user transcription
    if (event.type === "conversation.item.input_audio_transcription.completed") {
      const transcriptText = (event as { transcript?: string }).transcript;
      if (transcriptText) {
        setTranscript(prev => [...prev, {
          role: "user",
          content: transcriptText,
          timestamp: new Date()
        }]);
      }
    }

    // Handle assistant response
    if (event.type === "response.audio_transcript.done") {
      const transcriptText = (event as { transcript?: string }).transcript;
      if (transcriptText) {
        setTranscript(prev => [...prev, {
          role: "assistant",
          content: transcriptText,
          timestamp: new Date()
        }]);
      }
    }
  }, []);

  const startConversation = async () => {
    setStatus("connecting");
    try {
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init();
      setStatus("connected");

      toast({
        title: "Connected",
        description: "Voice interface is ready. Start speaking!",
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      setStatus("disconnected");
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const endConversation = async () => {
    await chatRef.current?.disconnect();
    chatRef.current = null;
    setStatus("disconnected");
    setTranscript([]);

    toast({
      title: "Disconnected",
      description: "Conversation ended",
    });
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  const getStatusText = () => {
    switch (status) {
      case "disconnected":
        return "Ready to connect";
      case "connecting":
        return "Connecting...";
      case "connected":
        return "Connected";
      case "listening":
        return "Listening...";
      case "speaking":
        return "AI is speaking...";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "disconnected":
        return "text-muted-foreground";
      case "connecting":
        return "text-yellow-500";
      case "connected":
      case "listening":
        return "text-primary";
      case "speaking":
        return "text-primary animate-pulse";
      default:
        return "text-muted-foreground";
    }
  };

  const isActive = status !== "disconnected" && status !== "connecting";

  return (
    <div className="flex flex-col items-center">
      {/* Status */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              status === "disconnected" ? "bg-muted-foreground" :
              status === "connecting" ? "bg-yellow-500 animate-pulse" :
              "bg-primary"
            )}
          />
          <span className={cn("text-sm font-medium", getStatusColor())}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Microphone Button */}
      <div className="relative mb-8">
        <button
          onClick={isActive ? endConversation : startConversation}
          disabled={status === "connecting"}
          className={cn(
            "relative flex h-32 w-32 items-center justify-center rounded-full transition-all duration-300",
            isActive
              ? "bg-primary animate-pulse-glow"
              : "bg-secondary hover:bg-secondary/80",
            status === "connecting" && "opacity-50 cursor-not-allowed"
          )}
        >
          {isActive ? (
            <PhoneOff className="h-12 w-12 text-primary-foreground" />
          ) : (
            <Mic className="h-12 w-12 text-foreground" />
          )}
        </button>

        {/* Audio Visualizer Ring */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-40 w-40 rounded-full border-2 border-primary/30 animate-ping" />
          </div>
        )}
      </div>

      {/* Audio Visualizer */}
      {isActive && (
        <div className="mb-8">
          <AudioVisualizer isActive={status === "speaking"} className="h-12" />
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={isActive ? endConversation : startConversation}
        disabled={status === "connecting"}
        variant={isActive ? "destructive" : "default"}
        size="lg"
        className="mb-8"
      >
        {isActive ? (
          <>
            <PhoneOff className="mr-2 h-5 w-5" />
            End Conversation
          </>
        ) : status === "connecting" ? (
          "Connecting..."
        ) : (
          <>
            <Phone className="mr-2 h-5 w-5" />
            Start Conversation
          </>
        )}
      </Button>

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Conversation Transcript
          </h3>
          <div className="max-h-64 space-y-4 overflow-y-auto">
            {transcript.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  item.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    item.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <p className="text-sm">{item.content}</p>
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
