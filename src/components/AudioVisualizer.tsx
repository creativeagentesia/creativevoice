import { cn } from "@/lib/utils";

interface AudioVisualizerProps {
  isActive: boolean;
  className?: string;
}

export function AudioVisualizer({ isActive, className }: AudioVisualizerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "audio-bar w-1 rounded-full bg-primary transition-all duration-200",
            isActive ? "animate-audio-wave" : "h-2"
          )}
          style={{
            height: isActive ? undefined : "8px",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
