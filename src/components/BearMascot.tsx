import "./BearMascot.css";

interface BearMascotProps {
  size?: number;
  waving?: boolean;
  className?: string;
}

/**
 * Friendly grizzly bear wearing glasses. When `waving` is true the raised paw
 * animates a "come here / keep going" gesture (used at the finish line).
 */
export default function BearMascot({
  size = 120,
  waving = false,
  className = "",
}: BearMascotProps) {
  return (
    <svg
      className={`bear ${waving ? "bear--waving" : ""} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 200 210"
      role="img"
      aria-label="Grizzly bear mascot wearing glasses"
    >
      {/* Legs */}
      <ellipse cx="78" cy="188" rx="20" ry="16" fill="#5b3a24" />
      <ellipse cx="122" cy="188" rx="20" ry="16" fill="#5b3a24" />
      <ellipse cx="78" cy="190" rx="10" ry="7" fill="#caa279" />
      <ellipse cx="122" cy="190" rx="10" ry="7" fill="#caa279" />

      {/* Body */}
      <ellipse cx="100" cy="150" rx="46" ry="42" fill="#7a5133" />
      <ellipse cx="100" cy="158" rx="28" ry="28" fill="#caa279" />

      {/* Left (resting) arm */}
      <ellipse cx="55" cy="150" rx="15" ry="22" fill="#6f4a2f" transform="rotate(18 55 150)" />

      {/* Right (waving) arm — animated when waving */}
      <g className="bear__arm">
        <ellipse cx="150" cy="118" rx="14" ry="24" fill="#6f4a2f" transform="rotate(28 150 118)" />
        <circle cx="162" cy="96" r="12" fill="#7a5133" />
        <circle cx="162" cy="96" r="6" fill="#caa279" />
      </g>

      {/* Ears */}
      <circle cx="66" cy="52" r="20" fill="#7a5133" />
      <circle cx="134" cy="52" r="20" fill="#7a5133" />
      <circle cx="66" cy="52" r="10" fill="#caa279" />
      <circle cx="134" cy="52" r="10" fill="#caa279" />

      {/* Head */}
      <circle cx="100" cy="82" r="52" fill="#7a5133" />

      {/* Muzzle */}
      <ellipse cx="100" cy="100" rx="30" ry="24" fill="#caa279" />
      <ellipse cx="100" cy="92" rx="9" ry="7" fill="#3b2716" />
      <path
        d="M100 99 q0 9 -8 12 M100 99 q0 9 8 12"
        stroke="#3b2716"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Eyes */}
      <circle cx="82" cy="72" r="4.5" fill="#2a1a0f" />
      <circle cx="118" cy="72" r="4.5" fill="#2a1a0f" />
      <circle cx="83.5" cy="70.5" r="1.5" fill="#fff" />
      <circle cx="119.5" cy="70.5" r="1.5" fill="#fff" />

      {/* Glasses */}
      <g className="bear__glasses">
        <circle cx="82" cy="72" r="15" fill="rgba(255,255,255,0.14)" stroke="#1c1416" strokeWidth="4" />
        <circle cx="118" cy="72" r="15" fill="rgba(255,255,255,0.14)" stroke="#1c1416" strokeWidth="4" />
        <line x1="96" y1="70" x2="104" y2="70" stroke="#1c1416" strokeWidth="4" />
        <line x1="67" y1="68" x2="52" y2="60" stroke="#1c1416" strokeWidth="4" strokeLinecap="round" />
        <line x1="133" y1="68" x2="148" y2="60" stroke="#1c1416" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
