import { useEffect, useRef, useState } from 'react';
import { STAGES } from '../../game/stages';
import { StampRecord } from '../../game/types';
import { STAMP_LABEL } from '../../game/goshuin';
import { haptics, playComplete } from '../../utils/sfx';

const ASSET = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
const W = 800;
const H = 1120;

interface Props {
  stageId: number;
  record: StampRecord;
  onClose: () => void;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function Certificate({ stageId, record, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const stage = STAGES.find((s) => s.id === stageId)!;
  const label = STAMP_LABEL[stageId] ?? '';

  useEffect(() => {
    let cancelled = false;
    async function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await document.fonts.ready;
      const img = await loadImage(ASSET(stage.image));
      if (cancelled) return;

      // 背景(和紙)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#fffdf8');
      bgGrad.addColorStop(1, '#f3ece0');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 二重の縁取り
      ctx.strokeStyle = '#d8a33f';
      ctx.lineWidth = 6;
      roundRect(ctx, 28, 28, W - 56, H - 56, 18);
      ctx.stroke();
      ctx.strokeStyle = '#c0483b';
      ctx.lineWidth = 1.5;
      roundRect(ctx, 44, 44, W - 88, H - 88, 12);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#8a7a66';
      ctx.font = '600 20px "Zen Kaku Gothic New", sans-serif';
      ctx.fillText('勉強の木 ｜ 里山ビルダー', W / 2, 108);

      ctx.fillStyle = '#3f342a';
      ctx.font = '700 40px "Zen Maru Gothic", sans-serif';
      ctx.fillText('御修行之証', W / 2, 168);

      // 村の絵(アスペクト比を保って収める)
      const boxSize = 460;
      const boxX = (W - boxSize) / 2;
      const boxY = 210;
      const scale = Math.min(boxSize / img.width, boxSize / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.save();
      roundRect(ctx, boxX, boxY, boxSize, boxSize, 14);
      ctx.clip();
      ctx.fillStyle = '#fffdf8';
      ctx.fillRect(boxX, boxY, boxSize, boxSize);
      ctx.drawImage(img, boxX + (boxSize - dw) / 2, boxY + (boxSize - dh) / 2, dw, dh);
      ctx.restore();
      ctx.strokeStyle = '#e3d8c4';
      ctx.lineWidth = 1;
      roundRect(ctx, boxX, boxY, boxSize, boxSize, 14);
      ctx.stroke();

      const textTop = boxY + boxSize + 56;
      ctx.fillStyle = '#3f342a';
      ctx.font = '700 34px "Zen Maru Gothic", sans-serif';
      ctx.fillText(stage.name, W / 2, textTop);

      ctx.strokeStyle = '#e3d8c4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(120, textTop + 34);
      ctx.lineTo(W - 120, textTop + 34);
      ctx.stroke();

      const earnedDate = new Date(record.earnedAt);
      const dateStr = `${earnedDate.getFullYear()}年${earnedDate.getMonth() + 1}月${earnedDate.getDate()}日 到達`;
      const hoursStr = `累計学習時間　約${Math.round(record.totalHours)}時間`;

      ctx.fillStyle = '#5d7a41';
      ctx.font = '600 24px "Zen Kaku Gothic New", sans-serif';
      ctx.fillText(dateStr, W / 2, textTop + 78);
      ctx.fillStyle = '#8a6410';
      ctx.font = '700 26px "Zen Kaku Gothic New", sans-serif';
      ctx.fillText(hoursStr, W / 2, textTop + 118);

      // 落款(印)
      const sealX = W - 150;
      const sealY = H - 150;
      const sealR = 56;
      ctx.save();
      ctx.translate(sealX, sealY);
      ctx.rotate((-6 * Math.PI) / 180);
      ctx.beginPath();
      ctx.arc(0, 0, sealR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(192, 72, 59, 0.92)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, sealR - 7, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${label.length >= 3 ? 16 : 22}px "Zen Maru Gothic", sans-serif`;
      ctx.textBaseline = 'middle';
      if (label.length >= 3) {
        label.split('').forEach((ch, i) => {
          ctx.fillText(ch, 0, (i - (label.length - 1) / 2) * 18);
        });
      } else {
        ctx.fillText(label, 0, 0);
      }
      ctx.restore();

      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#8a7a66';
      ctx.font = '400 16px "Zen Kaku Gothic New", sans-serif';
      ctx.fillText('毎日の積み重ねが、里山を育てています', W / 2, H - 60);

      if (!cancelled) setReady(true);
    }
    draw();
    return () => {
      cancelled = true;
    };
  }, [stage, record, label]);

  function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `里山ビルダー_${stage.name}_証明書.png`;
      a.click();
      URL.revokeObjectURL(url);
      playComplete();
      haptics.success();
    }, 'image/png');
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet certificate-sheet" onClick={(e) => e.stopPropagation()}>
        <p className="sheet-title">節目の証明書</p>
        <div className="certificate-canvas-wrap">
          <canvas ref={canvasRef} width={W} height={H} className={ready ? 'is-ready' : ''} />
          {!ready && <div className="certificate-loading">描いています…</div>}
        </div>
        <div className="certificate-actions">
          <button className="primary-btn" onClick={save} disabled={!ready}>
            画像として保存
          </button>
          <button className="text-btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
