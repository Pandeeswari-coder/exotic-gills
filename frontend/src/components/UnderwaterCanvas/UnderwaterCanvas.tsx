import React, { useEffect, useRef } from 'react';

interface Particle { x: number; y: number; r: number; speed: number; drift: number; opacity: number; }
interface Bubble   { x: number; y: number; r: number; speed: number; wobble: number; opacity: number; }

const UnderwaterCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* ── particles (plankton) ── */
    const particles: Particle[] = Array.from({ length: 70 }, () => ({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,
      r:       Math.random() * 2.5 + 0.5,
      speed:   Math.random() * 0.45 + 0.15,
      drift:   (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.55 + 0.2,
    }));

    /* ── bubbles ── */
    const bubbles: Bubble[] = Array.from({ length: 22 }, () => ({
      x:       Math.random() * canvas.width,
      y:       canvas.height + Math.random() * canvas.height,
      r:       Math.random() * 7 + 2,
      speed:   Math.random() * 0.8 + 0.4,
      wobble:  Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.45 + 0.15,
    }));

    let animId: number;
    let t = 0;

    const draw = () => {
      t += 0.004;
      const w = canvas.width;
      const h = canvas.height;

      /* ── background gradient ── */
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0,    '#000c18');
      bg.addColorStop(0.20, '#001830');
      bg.addColorStop(0.45, '#002d5a');
      bg.addColorStop(0.70, '#003870');
      bg.addColorStop(1,    '#001020');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      /* ── god-ray shafts from top ── */
      const rayCount = 7;
      for (let i = 0; i < rayCount; i++) {
        const cx  = w * ((i + 0.5) / rayCount) + Math.sin(t * 0.6 + i * 1.1) * 40;
        const opc = 0.06 + Math.sin(t * 1.2 + i * 0.9) * 0.04;
        const rayGrad = ctx.createLinearGradient(cx, 0, cx + 30, h * 0.72);
        rayGrad.addColorStop(0, `rgba(0,190,255,${opc})`);
        rayGrad.addColorStop(1, 'rgba(0,140,220,0)');
        ctx.save();
        ctx.beginPath();
        const w1 = 18 + Math.sin(t + i) * 6;
        const w2 = 55 + Math.sin(t * 0.8 + i) * 15;
        ctx.moveTo(cx - w1, 0);
        ctx.lineTo(cx + w1, 0);
        ctx.lineTo(cx + w2 + Math.sin(t * 0.5 + i) * 25, h * 0.72);
        ctx.lineTo(cx - w2 + Math.sin(t * 0.5 + i) * 25, h * 0.72);
        ctx.closePath();
        ctx.fillStyle = rayGrad;
        ctx.fill();
        ctx.restore();
      }

      /* ── caustic shimmer patches ── */
      for (let i = 0; i < 10; i++) {
        const px  = w * (0.05 + (i % 5) * 0.22) + Math.sin(t * 0.7 + i * 1.4) * 35;
        const py  = h * (0.04 + Math.floor(i / 5) * 0.14) + Math.cos(t * 0.5 + i) * 25;
        const rad = 60 + Math.sin(t * 1.8 + i) * 22;
        const opc = 0.08 + Math.sin(t * 1.4 + i * 0.8) * 0.04;
        const cg  = ctx.createRadialGradient(px, py, 0, px, py, rad);
        cg.addColorStop(0, `rgba(0,220,255,${opc})`);
        cg.addColorStop(1, 'rgba(0,150,220,0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.ellipse(px, py, rad, rad * 0.55, Math.sin(t * 0.3 + i) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ── plankton particles ── */
      particles.forEach(p => {
        p.y -= p.speed;
        p.x += p.drift + Math.sin(t * 1.8 + p.y * 0.02) * 0.2;
        if (p.y < -6)  { p.y = h + 6;  p.x = Math.random() * w; }
        if (p.x < 0)   p.x = w;
        if (p.x > w)   p.x = 0;
        const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        pg.addColorStop(0, `rgba(200,245,255,${p.opacity})`);
        pg.addColorStop(1, `rgba(0,200,255,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = pg;
        ctx.fill();
      });

      /* ── bubbles ── */
      bubbles.forEach(b => {
        b.y -= b.speed;
        b.wobble += 0.03;
        b.x += Math.sin(b.wobble) * 0.5;
        if (b.y < -b.r * 2) {
          b.y = h + b.r;
          b.x = Math.random() * w;
          b.opacity = Math.random() * 0.45 + 0.15;
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        const bg2 = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
        bg2.addColorStop(0, `rgba(200,248,255,${b.opacity * 0.9})`);
        bg2.addColorStop(0.5, `rgba(80,210,255,${b.opacity * 0.3})`);
        bg2.addColorStop(1, `rgba(0,180,255,0)`);
        ctx.fillStyle = bg2;
        ctx.fill();
        ctx.strokeStyle = `rgba(120,230,255,${b.opacity * 0.7})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      });

      /* ── depth haze at bottom ── */
      const haze = ctx.createLinearGradient(0, h * 0.55, 0, h);
      haze.addColorStop(0, 'rgba(0,4,16,0)');
      haze.addColorStop(1, 'rgba(0,4,16,0.72)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);

      /* ── subtle surface shimmer at top ── */
      const surf = ctx.createLinearGradient(0, 0, 0, 80);
      surf.addColorStop(0, `rgba(0,180,255,${0.06 + Math.sin(t * 2) * 0.03})`);
      surf.addColorStop(1, 'rgba(0,140,220,0)');
      ctx.fillStyle = surf;
      ctx.fillRect(0, 0, w, 80);

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero__canvas" aria-hidden />;
};

export default UnderwaterCanvas;
