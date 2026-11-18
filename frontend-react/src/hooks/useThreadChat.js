import { useLiveChat } from "./useLiveChat";

/**
 * One event conversation: loads it, receives new messages live (socket, with a
 * 3-second polling fallback) and sends to it. Kept as its own name because the
 * vendor pages already use it; the work is done by useLiveChat.
 */
export function useThreadChat(threadId) {
  const { messages, error, send } = useLiveChat({ kind: "thread", threadId });
  return { messages, error, send };
}

export default useThreadChat;
