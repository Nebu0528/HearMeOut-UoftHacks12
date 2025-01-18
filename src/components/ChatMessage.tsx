import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
  onPlay?: () => void;
  isPlayable?: boolean;
}

export function ChatMessage({ content, role, onPlay, isPlayable }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "group relative mb-4 flex items-start gap-3 animate-message-fade-in opacity-0",
        isUser ? "flex-row-reverse" : ""
      )}
    >
      <div
        className={cn(
          "flex min-h-[40px] max-w-[85%] flex-col rounded-lg px-4 py-2 text-sm",
          isUser
            ? "bg-chat-user text-white"
            : "bg-chat-assistant text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {isPlayable && onPlay && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-fit"
            onClick={onPlay}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Play Response
          </Button>
        )}
      </div>
    </div>
  );
}