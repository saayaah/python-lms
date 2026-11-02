import { FormEvent, useEffect, useRef, useState } from "react";
import { api, type AIMessage } from "../api";

type AIChatProps = {
  context?: string;
  mode?: string;
  title?: string;
};

export function AIChat({ context, mode = "socratic", title = "AI learning assistant" }: AIChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || pending) return;
    const nextMessages = [...messages, { role: "user" as const, content: message }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setPending(true);
    try {
      const result = await api.chat(message, mode, messages, context);
      setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reach the AI assistant");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="card">
      <div className="progress-row">
        <h2>{title}</h2>
        <button type="button" onClick={() => { setMessages([]); setError(""); }}>Clear</button>
      </div>
      <div aria-live="polite">
        {messages.length === 0 && <p>Ask a question about Python, this lesson, or your code.</p>}
        {messages.map((message, index) => (
          <article className="card" key={`${message.role}-${index}`}>
            <strong>{message.role === "user" ? "You" : "Tutor"}</strong>
            <p>{message.content}</p>
          </article>
        ))}
        {pending && <p role="status">Thinking...</p>}
      </div>
      {error && <p role="alert">{error}</p>}
      <form className="form" onSubmit={submit}>
        <label>
          Question
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            required
            disabled={pending}
          />
        </label>
        <button type="submit" disabled={pending || !input.trim()}>
          {pending ? "Thinking..." : "Ask tutor"}
        </button>
      </form>
    </section>
  );
}
