import { CSSProperties, useEffect, useState } from 'react';
import { villageView, VillageLayer, VillageView } from '../../game/stages';
import { atmosphereFor } from '../../game/atmosphere';

const ASSET = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;

/** 左右の端をぼかして、矩形レイヤーの継ぎ目を目立たなくする */
const SIDE_FEATHER = 'linear-gradient(to right, transparent 0%, #000 11%, #000 89%, transparent 100%)';
/** 上下の端をぼかす(grow用) */
const VERT_FEATHER = 'linear-gradient(to bottom, transparent 0%, #000 11%, #000 89%, transparent 100%)';

function masked(image: string): CSSProperties {
  return { maskImage: image, WebkitMaskImage: image };
}

/** 下から立ち上がる普請のマスク。amount=1 でマスクなし(全面)。 */
function buildMask(amount: number): CSSProperties {
  // 足元(region下端)は常に少しぼかして、矩形の下辺が線として見えないようにする
  const foot = 'transparent 0%, #000 5%';
  if (amount >= 0.995) return masked(`linear-gradient(to top, ${foot}, #000 100%)`);
  const hi = Math.min(100, amount * 100 + 10);
  const lo = Math.max(6, hi - 20);
  return masked(`linear-gradient(to top, ${foot}, #000 ${lo}%, transparent ${hi}%)`);
}

/**
 * 全体を次の絵へ移し替えるマスク。単純な重ね合わせ(opacity)だと
 * 構図がずれた絵どうしで二重写しになるので、手前から奥へ幅広のぼかし帯で拭き取る。
 */
const DISSOLVE_BAND = 34;
function dissolveMask(amount: number): CSSProperties {
  if (amount >= 0.995) return {};
  const hi = amount * (100 + DISSOLVE_BAND);
  const lo = hi - DISSOLVE_BAND;
  return masked(`linear-gradient(to top right, #000 0%, #000 ${lo}%, transparent ${hi}%)`);
}

function Layer({ layer, image }: { layer: VillageLayer; image: string }) {
  // 全体レイヤー: 手前から奥へ、次の絵に移し替えていく
  if (!layer.region) {
    return (
      <div className="vart-layer vart-layer-full" style={dissolveMask(layer.amount)}>
        <img src={ASSET(image)} alt="" draggable={false} />
      </div>
    );
  }

  const { x, y, w, h } = layer.region;
  const box: CSSProperties = {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: `${w * 100}%`,
    height: `${h * 100}%`,
    ...masked(SIDE_FEATHER),
  };
  // レイヤー枠のなかで、元画像がベースとぴったり重なる大きさ・位置に戻す
  const inner: CSSProperties = {
    left: `${(-x / w) * 100}%`,
    top: `${(-y / h) * 100}%`,
    width: `${100 / w}%`,
    height: `${100 / h}%`,
  };
  const veil: CSSProperties =
    layer.mode === 'build' ? buildMask(layer.amount) : { ...masked(VERT_FEATHER), opacity: layer.amount };

  return (
    <div className="vart-layer" style={box}>
      <div className="vart-veil" style={veil}>
        <img src={ASSET(image)} alt="" style={inner} draggable={false} />
      </div>
    </div>
  );
}

interface Props {
  points: number;
  className?: string;
  /** 事前に計算済みの view を渡せる(親で工程名も使う場合の二重計算防止) */
  view?: VillageView;
  /** 季節・時間帯の色被せ。集中が途切れた演出など、素の絵を見せたい場面では false にする。 */
  atmosphere?: boolean;
}

/** 実機の時計を1分おきに読み直す。時間帯の境をまたいだときだけ見た目が変わる。 */
function useNow(enabled: boolean): Date | null {
  const [now, setNow] = useState<Date | null>(enabled ? new Date() : null);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [enabled]);
  return now;
}

/**
 * 村の絵。完成済みの段階の絵をベースに、次の段階の絵を
 * 「工程(Work)」ごとに部分露出させて重ねる。柱→屋根、と建っていくのが見える。
 * さらに実機の時刻・季節から、朝焼け／ゴールデンアワー／夜／四季の色味を薄く重ねる。
 */
export function VillageArt({ points, className, view, atmosphere = true }: Props) {
  const v = view ?? villageView(points);
  const now = useNow(atmosphere);
  const atmo = now ? atmosphereFor(now) : null;

  return (
    <div className={`vart ${className ?? ''}`}>
      <div className="vart-atmosphere" style={atmo?.filter ? { filter: atmo.filter } : undefined}>
        <img className="vart-base" src={ASSET(v.base.image)} alt={`${v.base.name}の里山`} draggable={false} />
        {v.target && v.layers.map((l) => <Layer key={l.key} layer={l} image={v.target!.image} />)}
        {atmo?.overlay && (
          <div
            className="vart-overlay"
            style={{ backgroundColor: atmo.overlay.color, mixBlendMode: atmo.overlay.blend }}
          />
        )}
      </div>
    </div>
  );
}
