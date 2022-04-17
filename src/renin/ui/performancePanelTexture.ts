import { CanvasTexture } from 'three';
import { colors } from './colors';
import '../style.css';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
if (ctx) {
  canvas.width = 360 * window.devicePixelRatio;
  canvas.height = 360 * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.strokeStyle = '#232f40';
  ctx.font = '16px Barlow';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = colors.slate._400;
  ctx.shadowColor = '#232f4088';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.fillText('GPU', 8, 8);

  ctx.fillStyle = colors.fuchsia._500;
  ctx.fillText('Memory', 8, 144);

  const top = 276;
  const gap = 18;
  ctx.fillStyle = colors.slate._400;
  ctx.fillText('render', 8, top);

  ctx.fillStyle = colors.sky._500;
  ctx.fillText('update', 8, top + gap);
}

export const performancePanelTexture = new CanvasTexture(canvas);
