/** 江戸期の「穴あき銭」をモチーフにした金貨アイコン。画像アセット不要のSVG。 */
export function CoinIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="coin-icon" aria-hidden="true">
      <defs>
        <radialGradient id="coinFace" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="45%" stopColor="#f3c556" />
          <stop offset="100%" stopColor="#c98f2b" />
        </radialGradient>
      </defs>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm-3 8h6v6H9V9Z"
        fill="url(#coinFace)"
        stroke="#8a5a15"
        strokeWidth="1"
      />
      <path
        d="M5.2 7.2A9.6 9.6 0 0 1 12 2.4"
        fill="none"
        stroke="#fff6d8"
        strokeOpacity="0.7"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
