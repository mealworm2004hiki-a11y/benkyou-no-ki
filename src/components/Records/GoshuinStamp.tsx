// 御朱印スタンプ1つぶんのSVG。丸い朱色の印、少し歪んだ縁で「手で押した」感じを出す。
// 未到達のものは点線の輪郭だけのプレースホルダーにする。

const SIZE = 64;
const CENTER = SIZE / 2;

/** stage idから決め打ちの歪みを作る(実行のたびに形が変わらないように)。 */
function wobblyCirclePath(seed: number, radius: number): string {
  const points = 16;
  let d = '';
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    // 疑似ランダムだが決定的な半径ゆらぎ(±5%)
    const wobble = Math.sin(angle * 3 + seed) * 0.03 + Math.sin(angle * 7 + seed * 2) * 0.02;
    const r = radius * (1 + wobble);
    const x = CENTER + Math.cos(angle) * r;
    const y = CENTER + Math.sin(angle) * r;
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d + ' Z';
}

interface Props {
  stageId: number;
  label: string;
  earned: boolean;
  onClick?: () => void;
}

export function GoshuinStamp({ stageId, label, earned, onClick }: Props) {
  const rotation = ((stageId * 37) % 11) - 5;
  const chars = label.split('');
  const vertical = chars.length >= 3;

  if (!earned) {
    return (
      <button className="goshuin-slot is-locked" disabled aria-label={`未到達: ${label}`}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={CENTER} cy={CENTER} r={SIZE / 2 - 3} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.4" />
        </svg>
      </button>
    );
  }

  return (
    <button className="goshuin-slot is-earned" onClick={onClick} aria-label={`御朱印: ${label}`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: `rotate(${rotation}deg)` }}>
        <path d={wobblyCirclePath(stageId, SIZE / 2 - 3)} fill="var(--vermilion)" opacity="0.92" />
        <path
          d={wobblyCirclePath(stageId + 0.5, SIZE / 2 - 7)}
          fill="none"
          stroke="#fff"
          strokeWidth="1"
          opacity="0.75"
        />
        <text
          x={CENTER}
          y={CENTER}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontFamily="var(--font-heading)"
          fontWeight="700"
          fontSize={vertical ? 13 : 18}
          style={{ writingMode: vertical ? 'vertical-rl' : 'horizontal-tb' }}
        >
          {label}
        </text>
      </svg>
    </button>
  );
}
