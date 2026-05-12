"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { UIMessage, DefaultChatTransport } from "ai";
import { useFileSystem } from "./file-system-context";
import { setHasAnonWork } from "@/lib/anon-work-tracker";

interface ChatContextProps {
  projectId?: string;
  initialMessages?: UIMessage[];
}

interface ChatContextType {
  messages: UIMessage[];
  sendMessage: (text: string) => void;
  status: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall } = useFileSystem();

  const fileSystemRef = useRef(fileSystem);
  fileSystemRef.current = fileSystem;
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  const { messages, sendMessage, status } = useAIChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        files: fileSystemRef.current.serialize(),
        projectId: projectIdRef.current,
      }),
    }),
    messages: initialMessages,
    onToolCall: ({ toolCall }) => {
      handleToolCall({
        toolName: (toolCall as any).toolName,
        args: (toolCall as any).input ?? (toolCall as any).args,
      });
    },
  });

  useEffect(() => {
    if (!projectId && messages.length > 0) {
      setHasAnonWork(messages, fileSystem.serialize());
    }
  }, [messages, fileSystem, projectId]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage: (text: string) => sendMessage({ text }),
        status,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
