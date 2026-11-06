import { useEffect, useState } from "react";
import { getMessageThread, sendMessage } from "../services/messageService";

const REFRESH_MS = 3000;

/** One conversation: loads it, keeps it fresh, and sends to it. */
export function useThreadChat(threadId) {
  const [loaded, setLoaded] = useState({ threadId: null, messages: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!threadId) return undefined;
    let isMounted = true;
    const load = () =>
      getMessageThread(threadId)
        .then((list) => {
          if (!isMounted) return;
          setLoaded({ threadId, messages: Array.isArray(list) ? list : [] });
          setError(null);
        })
        .catch((err) => isMounted && setError(err.message || "Could not load messages."));
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [threadId]);

  const send = async (text) => {
    try {
      const message = await sendMessage({ threadId, text });
      setLoaded((prev) => ({ ...prev, messages: [...prev.messages, message] }));
      return true;
    } catch (err) {
      setError(err.message || "Message not sent. Please try again.");
      return false;
    }
  };

  // Never show one conversation's messages under another while it loads
  const messages = loaded.threadId === threadId ? loaded.messages : [];
  return { messages, error, send };
}

export default useThreadChat;
