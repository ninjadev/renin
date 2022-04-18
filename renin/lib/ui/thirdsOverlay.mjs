import { CanvasTexture } from 'three';
import { bootstrapCss } from './css.mjs';

bootstrapCss();
const thirdsOverlayCanvas = document.createElement("canvas");
const thirdsOverlayCtx = thirdsOverlayCanvas.getContext("2d");
thirdsOverlayCanvas.width = 1920;
thirdsOverlayCanvas.height = 1080;
if (thirdsOverlayCtx) {
    const canvas = thirdsOverlayCanvas;
    const ctx = thirdsOverlayCtx;
    const w = canvas.width;
    const h = canvas.height;
    ctx.beginPath();
    ctx.strokeStyle = "#888";
    ctx.fillStyle = "#888";
    ctx.lineWidth = 3;
    /* circle */
    ctx.arc(1920 / 2, 1080 / 2, 1080 / 2, 0, Math.PI * 2);
    /* thirds */
    ctx.moveTo(w / 3, 0);
    ctx.lineTo(w / 3, h);
    ctx.moveTo((2 * w) / 3, 0);
    ctx.lineTo((2 * w) / 3, h);
    ctx.moveTo(0, h / 3);
    ctx.lineTo(w, h / 3);
    ctx.moveTo(0, (2 * h) / 3);
    ctx.lineTo(w, (2 * h) / 3);
    /* center */
    ctx.moveTo(w / 2 - 8, h / 2);
    ctx.lineTo(w / 2 + 8, h / 2);
    ctx.moveTo(w / 2, h / 2 - 8);
    ctx.lineTo(w / 2, h / 2 + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#88888844";
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    /* golden ratio */
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#888";
    ctx.beginPath();
    ctx.setLineDash([16, 16]);
    const phi = 1.61803398875;
    ctx.moveTo(w / phi, 0);
    ctx.lineTo(w / phi, h);
    ctx.moveTo(w - w / phi, 0);
    ctx.lineTo(w - w / phi, h);
    ctx.moveTo(0, h / phi);
    ctx.lineTo(w, h / phi);
    ctx.moveTo(0, h - h / phi);
    ctx.lineTo(w, h - h / phi);
    ctx.stroke();
    /* grid */
    ctx.beginPath();
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 6]);
    ctx.strokeStyle = "#88888811";
    const gridParts = 48;
    for (let x = 1; x < gridParts; x++) {
        for (let y = 1; y < (gridParts / 16) * 9; y++) {
            ctx.moveTo((x / gridParts) * w, 0);
            ctx.lineTo((x / gridParts) * w, h);
            ctx.moveTo(0, (y / ((gridParts / 16) * 9)) * h);
            ctx.lineTo(w, (y / ((gridParts / 16) * 9)) * h);
        }
    }
    ctx.stroke();
    ctx.font = "24px Barlow";
    ctx.textAlign = "left";
    ctx.fillText("Golden ratio", 16, 656);
    ctx.fillText("Thirds", 16, 710);
}
const thirdsOverlayTexture = new CanvasTexture(thirdsOverlayCanvas);
thirdsOverlayTexture.needsUpdate = true;

export { thirdsOverlayTexture };
