import { useEffect, useState } from "react";

/** Typewriter that cycles through phrases. */
export default function Typing({
  phrases,
  className = "",
}: {
  phrases: string[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = phrases[index % phrases.length];
    let delay = deleting ? 40 : 70;

    if (!deleting && text === full) {
      delay = 1500; // pause at full
      const t = setTimeout(() => setDeleting(true), delay);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => i + 1);
      return;
    }

    const t = setTimeout(() => {
      setText((cur) =>
        deleting ? full.slice(0, cur.length - 1) : full.slice(0, cur.length + 1),
      );
    }, delay);
    return () => clearTimeout(t);
  }, [text, deleting, index, phrases]);

  return (
    <span className={className}>
      {text}
      <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-blink bg-nebula-400 align-middle" />
    </span>
  );
}
