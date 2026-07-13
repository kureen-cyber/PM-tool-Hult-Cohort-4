import { useCallback, useEffect, useRef, useState } from "react";
import BearMascot from "./BearMascot";
import "./MascotPopup.css";

interface Nugget {
  type: "quote" | "meme";
  text: string;
  attribution?: string;
}

const NUGGETS: Nugget[] = [
  {
    type: "quote",
    text: "Ship it. A working prototype beats a perfect plan every time.",
    attribution: "Grizzly wisdom",
  },
  {
    type: "meme",
    text: "It works on my machine. \u{1F43B}\u{200D}\u2744\uFE0F Ship the whole machine!",
  },
  {
    type: "quote",
    text: "You don't have to be great to start, but you have to start to be great.",
    attribution: "Zig Ziglar",
  },
  {
    type: "meme",
    text: "99 little bugs in the code, 99 little bugs\u2026 take one down, patch it around \u2014 127 little bugs in the code.",
  },
  {
    type: "quote",
    text: "First, solve the problem. Then, write the code.",
    attribution: "John Johnson",
  },
  {
    type: "meme",
    text: "\u201CWhy is it slow?\u201D It's always DNS. If not DNS, it's caching. If not caching, it's you at 2am.",
  },
  {
    type: "quote",
    text: "Great engineers aren't born \u2014 they're compiled, one error at a time.",
    attribution: "Grizzly wisdom",
  },
  {
    type: "meme",
    text: "There are 2 hard things in CS: cache invalidation, naming things, and off-by-one errors.",
  },
  {
    type: "quote",
    text: "Done is better than perfect. Keep moving toward the finish line!",
    attribution: "Sheryl Sandberg",
  },
  {
    type: "meme",
    text: "git commit -m \u2018final\u2019 \u2192 \u2018final2\u2019 \u2192 \u2018final_REAL\u2019 \u2192 \u2018final_REAL_thisone\u2019. We've all been there.",
  },
  {
    type: "quote",
    text: "The bear believes in you. One more merged PR and the swarm wins.",
    attribution: "Ludwitt mascot",
  },
];

const SHOW_AFTER_MS = 5000;
const VISIBLE_MS = 14000;
const INTERVAL_MS = 32000;

export default function MascotPopup() {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setVisible(false), VISIBLE_MS);
  }, []);

  const show = useCallback(() => {
    setIndex((prev) => (prev + 1) % NUGGETS.length);
    setVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    if (dismissed) return;
    const first = window.setTimeout(show, SHOW_AFTER_MS);
    const interval = window.setInterval(show, INTERVAL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [dismissed, show]);

  const nugget = NUGGETS[index];

  function handleClose() {
    setVisible(false);
  }

  function handleSnooze() {
    setVisible(false);
    setDismissed(true);
  }

  function handleNext() {
    setIndex((prev) => (prev + 1) % NUGGETS.length);
    setVisible(true);
    scheduleHide();
  }

  return (
    <div
      className={`mascot ${visible ? "mascot--in" : "mascot--out"}`}
      aria-live="polite"
      aria-hidden={!visible}
    >
      <div className="mascot__card">
        <button
          type="button"
          className="mascot__close"
          aria-label="Dismiss motivation for now"
          onClick={handleSnooze}
          title="Hide for this session"
        >
          &times;
        </button>

        <div className="mascot__bubble">
          <span className={`mascot__tag mascot__tag--${nugget.type}`}>
            {nugget.type === "quote" ? "Motivation" : "Dev meme"}
          </span>
          <p className="mascot__text">{nugget.text}</p>
          {nugget.attribution && (
            <p className="mascot__attr">— {nugget.attribution}</p>
          )}
          <div className="mascot__actions">
            <button
              type="button"
              className="mascot__btn"
              onClick={handleNext}
            >
              Another one
            </button>
            <button
              type="button"
              className="mascot__btn mascot__btn--ghost"
              onClick={handleClose}
            >
              Got it
            </button>
          </div>
        </div>

        <div className="mascot__bear">
          <BearMascot size={104} />
        </div>
      </div>
    </div>
  );
}
