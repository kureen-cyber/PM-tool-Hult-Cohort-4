import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ROLE_LABELS, useAuth, type Role } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import {
  subscribeUserDirectory,
  type DirectoryUser,
} from "../lib/users";
import "./CohortChat.css";

type ChannelId = "general" | "project-help" | "announcements";

interface ChatMessage {
  id: string;
  channel: ChannelId;
  sender: string;
  email: string;
  role: Role;
  body: string;
  sentAt: string;
}

const CHANNELS: { id: ChannelId; label: string; description: string }[] = [
  {
    id: "general",
    label: "General",
    description: "Cohort-wide conversation",
  },
  {
    id: "project-help",
    label: "Project help",
    description: "Questions, debugging, and collaboration",
  },
  {
    id: "announcements",
    label: "Announcements",
    description: "Important program updates",
  },
];

const STORAGE_KEY = "hult-cohort-chat-messages";
const BROADCAST_NAME = "hult-cohort-chat";

function loadMessages(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `message-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function CohortChat() {
  const { user } = useAuth();
  const { isRegisteredEmail } = useProgress();
  const [channel, setChannel] = useState<ChannelId>("general");
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [draft, setDraft] = useState("");
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const canPost = Boolean(user && isRegisteredEmail(user.email));

  const displayName = useMemo(() => {
    if (!user) return "";
    const match = directory.find(
      (entry) => entry.email.toLowerCase() === user.email.toLowerCase()
    );
    return match?.name || user.displayName || user.email;
  }, [directory, user]);

  useEffect(() => {
    if (!user) {
      setDirectory([]);
      return;
    }
    const unsubscribe = subscribeUserDirectory(
      (people) => {
        setDirectory(people);
        setDirectoryError(null);
      },
      (message) => setDirectoryError(message)
    );
    return unsubscribe;
  }, [user]);

  const registeredEmails = useMemo(
    () => new Set(directory.map((entry) => entry.email.trim().toLowerCase())),
    [directory]
  );

  // Always include the signed-in user so the directory is never empty for them.
  const visibleDirectory = useMemo(() => {
    if (!user) return directory;
    const email = user.email.toLowerCase();
    if (directory.some((entry) => entry.email.toLowerCase() === email)) {
      return directory;
    }
    return [
      ...directory,
      {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email,
        role: ROLE_LABELS[user.role],
      },
    ].sort((a, b) => a.name.localeCompare(b.name));
  }, [directory, user]);

  const channelMessages = messages
    .filter(
      (message) =>
        message.channel === channel &&
        (registeredEmails.has(message.email.trim().toLowerCase()) ||
          message.email.toLowerCase() === user?.email.toLowerCase())
    )
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));

  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const broadcast = new BroadcastChannel(BROADCAST_NAME);
    broadcastRef.current = broadcast;
    broadcast.onmessage = (event: MessageEvent<ChatMessage[]>) => {
      if (Array.isArray(event.data)) setMessages(event.data);
    };
    return () => {
      broadcast.close();
      broadcastRef.current = null;
    };
  }, []);

  useEffect(() => {
    const syncFromStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        setMessages(JSON.parse(event.newValue) as ChatMessage[]);
      } catch {
        // Ignore malformed storage updates.
      }
    };
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channel, channelMessages.length]);

  function saveMessages(next: ChatMessage[]) {
    setMessages(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    broadcastRef.current?.postMessage(next);
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!user || !canPost || !draft.trim()) return;
    saveMessages([
      ...messages,
      {
        id: makeId(),
        channel,
        sender: displayName,
        email: user.email,
        role: user.role,
        body: draft.trim(),
        sentAt: new Date().toISOString(),
      },
    ]);
    setDraft("");
  }

  function handleComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  if (!user) {
    return (
      <section className="section cohort-chat cohort-chat--locked">
        <div className="container">
          <div className="chat-gate">
            <span className="chat-gate__icon" aria-hidden="true">
              💬
            </span>
            <span className="eyebrow">Registered participants only</span>
            <h2 className="section-title">Join the cohort conversation</h2>
            <p className="section-lead">
              Log in as a registered participant to read messages and chat with
              the cohort.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const activeChannel = CHANNELS.find((item) => item.id === channel)!;

  return (
    <section className="section cohort-chat">
      <div className="container">
        <div className="cohort-chat__head">
          <span className="eyebrow">Cohort communication</span>
          <h2 className="section-title">Chat</h2>
          <p className="section-lead">
            Ask questions and stay connected with people who have real accounts
            in this cohort — no demo names.
          </p>
        </div>

        <div className="chat-shell">
          <aside className="chat-sidebar" aria-label="Chat channels">
            <div className="chat-sidebar__section">
              <span className="chat-sidebar__label">Channels</span>
              {CHANNELS.map((item) => {
                const count = messages.filter(
                  (message) =>
                    message.channel === item.id &&
                    (registeredEmails.has(message.email.trim().toLowerCase()) ||
                      message.email.toLowerCase() === user.email.toLowerCase())
                ).length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`chat-channel ${
                      channel === item.id ? "is-active" : ""
                    }`}
                    onClick={() => setChannel(item.id)}
                  >
                    <span># {item.label}</span>
                    {count > 0 && <small>{count}</small>}
                  </button>
                );
              })}
            </div>

            <div className="chat-sidebar__section chat-directory">
              <span className="chat-sidebar__label">
                Registered · {visibleDirectory.length}
              </span>
              {directoryError && (
                <p className="chat-directory__empty">
                  Directory sync issue: {directoryError}
                </p>
              )}
              <div className="chat-directory__list">
                {visibleDirectory.length === 0 ? (
                  <p className="chat-directory__empty">
                    No registered accounts yet.
                  </p>
                ) : (
                  visibleDirectory.map((person) => (
                    <div key={person.uid || person.email} className="chat-person">
                      <span className="chat-avatar" aria-hidden="true">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                      <span>
                        <strong>{person.name}</strong>
                        <small>{person.role}</small>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          <div className="chat-main">
            <header className="chat-main__head">
              <div>
                <h3># {activeChannel.label}</h3>
                <p>{activeChannel.description}</p>
              </div>
              <span className="chat-main__identity">
                Posting as <strong>{displayName}</strong>
              </span>
            </header>

            <div className="chat-messages" aria-live="polite">
              {channelMessages.length === 0 ? (
                <div className="chat-empty">
                  <span aria-hidden="true">👋</span>
                  <strong>Start the conversation</strong>
                  <p>
                    Be the first registered participant to post in #
                    {activeChannel.label.toLowerCase()}.
                  </p>
                </div>
              ) : (
                channelMessages.map((message) => (
                  <article
                    key={message.id}
                    className={`chat-message ${
                      message.email === user.email ? "is-own" : ""
                    }`}
                  >
                    <span className="chat-avatar" aria-hidden="true">
                      {message.sender.charAt(0).toUpperCase()}
                    </span>
                    <div className="chat-message__content">
                      <div className="chat-message__meta">
                        <strong>{message.sender}</strong>
                        <span
                          className={`chat-role chat-role--${message.role}`}
                        >
                          {ROLE_LABELS[message.role]}
                        </span>
                        <time dateTime={message.sentAt}>
                          {new Date(message.sentAt).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                      <p>{message.body}</p>
                    </div>
                  </article>
                ))
              )}
              <div ref={messageEndRef} />
            </div>

            <form className="chat-composer" onSubmit={sendMessage}>
              <textarea
                rows={2}
                maxLength={2000}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKey}
                placeholder={
                  canPost
                    ? `Message #${activeChannel.label.toLowerCase()}`
                    : "Waiting for registrant sync…"
                }
                aria-label={`Message ${activeChannel.label}`}
                disabled={!canPost}
              />
              <div className="chat-composer__footer">
                <span>
                  {canPost
                    ? "Enter to send · Shift + Enter for a new line"
                    : "Only registered participants can post"}
                </span>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!canPost || !draft.trim()}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
