import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChat, RealtimeMessage } from "@/utils/RealtimeAudio";
import { AudioVisualizer } from "./AudioVisualizer";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "speaking" | "listening";

interface TranscriptItem {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function VoiceInterface() {
  const { t } = useTranslation();
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
      // First check microphone permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micError) {
        console.error("Microphone permission error:", micError);
        throw new Error(t("voiceInterface.microphoneError"));
      }

      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init();
      setStatus("connected");

      toast({
        title: t("voiceInterface.connected"),
        description: t("voiceInterface.connectedDescription"),
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      setStatus("disconnected");
      
      const errorMessage = error instanceof Error ? error.message : t("voiceInterface.errorDescription");
      
      toast({
        title: t("voiceInterface.error"),
        description: errorMessage,
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
      title: t("voiceInterface.disconnected"),
      description: t("voiceInterface.disconnectedDescription"),
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
        return t("voiceInterface.ready");
      case "connecting":
        return t("voiceInterface.connecting");
      case "connected":
        return t("voiceInterface.connected");
      case "listening":
        return t("voiceInterface.listening");
      case "speaking":
        return t("voiceInterface.speaking");
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
    <div className="flex flex-col items-center w-full max-w-2xl">
      {/* Status */}
      <div className="mb-6 lg:mb-8 text-center">
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
      <div className="relative mb-6 lg:mb-8">
        <button
          onClick={isActive ? endConversation : startConversation}
          disabled={status === "connecting"}
          className={cn(
            "relative flex h-24 w-24 lg:h-32 lg:w-32 items-center justify-center rounded-full transition-all duration-300",
            isActive
              ? "bg-primary animate-pulse-glow"
              : "bg-secondary hover:bg-secondary/80",
            status === "connecting" && "opacity-50 cursor-not-allowed"
          )}
        >
          {isActive ? (
            <PhoneOff className="h-10 w-10 lg:h-12 lg:w-12 text-primary-foreground" />
          ) : (
            <Mic className="h-10 w-10 lg:h-12 lg:w-12 text-foreground" />
          )}
        </button>

        {/* Audio Visualizer Ring */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 lg:h-40 lg:w-40 rounded-full border-2 border-primary/30 animate-ping" />
          </div>
        )}
      </div>

      {/* Audio Visualizer */}
      {isActive && (
        <div className="mb-6 lg:mb-8">
          <AudioVisualizer isActive={status === "speaking"} className="h-10 lg:h-12" />
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={isActive ? endConversation : startConversation}
        disabled={status === "connecting"}
        variant={isActive ? "destructive" : "default"}
        size="lg"
        className="mb-6 lg:mb-8 text-sm lg:text-base"
      >
        {isActive ? (
          <>
            <PhoneOff className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
            {t("voiceInterface.endConversation")}
          </>
        ) : status === "connecting" ? (
          t("voiceInterface.connecting")
        ) : (
          <>
            <Phone className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
            {t("voiceInterface.startConversation")}
          </>
        )}
      </Button>

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="w-full rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            {t("voiceInterface.transcript")}
          </h3>
          <div className="max-h-48 lg:max-h-64 space-y-4 overflow-y-auto">
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
                    "max-w-[85%] lg:max-w-[80%] rounded-lg px-3 py-2 lg:px-4",
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
