import { showToast } from './main.js';

export function initPerformance() {
  // Animate Stat Numbers
  const vals = document.querySelectorAll('.stat-val');
  vals.forEach(val => {
       const text = parseFloat(val.textContent);
       if(!isNaN(text)) {
           val.textContent = '0';
           let cur = 0;
           const isFloat = text % 1 !== 0;
           const step = isFloat ? 0.2 : Math.ceil(text / 15);
           const t = setInterval(() => {
               cur += step;
               if(cur >= text) {
                   cur = text;
                   clearInterval(t);
               }
               val.textContent = isFloat ? cur.toFixed(1) : cur;
           }, 50);
       }
  });

  // Chart Rendering
  setTimeout(() => {
    drawLine();
    drawBar();
  }, 100);

  // Tooltips for achievements
  document.querySelectorAll('.ach-item').forEach(ach => {
      ach.addEventListener('mouseenter', () => {
         const name = ach.querySelector('.ach-name').textContent.replace('Earned','').trim();
         showToast(`Achievement: ${name}`, 'info');
      });
  });
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun'];

function setupCanvas(id) {
  const el = document.getElementById(id);
  if(!el) return null;
  const parent = el.parentElement;
  const W = parent.clientWidth;
  const H = parent.clientHeight;
  el.width  = W * devicePixelRatio;
  el.height = H * devicePixelRatio;
  el.style.width  = W + 'px';
  el.style.height = H + 'px';
  const ctx = el.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);
  return { ctx, W, H };
}

/* ── LINE CHART ── */
function drawLine() {
  const canvasObj = setupCanvas('lineChart');
  if(!canvasObj) return;
  const { ctx, W, H } = canvasObj;

  const data = [42, 58, 53, 66, 62, 74];
  const pad = { t:12, r:14, b:28, l:28 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;
  const minV = 20, maxV = 80;

  const xP = i => pad.l + (i / (data.length - 1)) * cW;
  const yP = v => pad.t + (1 - (v - minV) / (maxV - minV)) * cH;

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  [20,40,60,80].forEach(v => {
    ctx.beginPath(); ctx.moveTo(pad.l, yP(v)); ctx.lineTo(pad.l + cW, yP(v)); ctx.stroke();
  });

  ctx.fillStyle = 'rgba(152,144,184,0.75)';
  ctx.font = '9.5px Inter,sans-serif';
  ctx.textAlign = 'right';
  [20,40,60,80].forEach(v => ctx.fillText(v, pad.l - 4, yP(v) + 3.5));

  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
  grad.addColorStop(0, 'rgba(224,21,122,0.38)');
  grad.addColorStop(1, 'rgba(224,21,122,0.01)');

  ctx.beginPath();
  ctx.moveTo(xP(0), yP(data[0]));
  for (let i = 1; i < data.length; i++) {
    const cpx = (xP(i-1) + xP(i)) / 2;
    ctx.bezierCurveTo(cpx, yP(data[i-1]), cpx, yP(data[i]), xP(i), yP(data[i]));
  }
  ctx.lineTo(xP(data.length - 1), pad.t + cH);
  ctx.lineTo(xP(0), pad.t + cH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(xP(0), yP(data[0]));
  for (let i = 1; i < data.length; i++) {
    const cpx = (xP(i-1) + xP(i)) / 2;
    ctx.bezierCurveTo(cpx, yP(data[i-1]), cpx, yP(data[i]), xP(i), yP(data[i]));
  }
  ctx.strokeStyle = '#e0157a';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  let animatedDots = 0;
  const drawDotsInterval = setInterval(() => {
     if(animatedDots >= data.length) {
        clearInterval(drawDotsInterval);
        return;
     }
     const i = animatedDots;
     const v = data[i];
     ctx.beginPath();
     ctx.arc(xP(i), yP(v), 3.5, 0, Math.PI * 2);
     ctx.fillStyle = '#e0157a';
     ctx.fill();
     ctx.strokeStyle = '#0e0c1a';
     ctx.lineWidth = 2;
     ctx.stroke();
     animatedDots++;
  }, 100);

  ctx.fillStyle = 'rgba(152,144,184,0.75)';
  ctx.font = '9.5px Inter,sans-serif';
  ctx.textAlign = 'center';
  MONTHS.forEach((m, i) => ctx.fillText(m, xP(i), H - 5));
}

function drawBar() {
  const canvasObj = setupCanvas('barChart');
  if(!canvasObj) return;
  const { ctx, W, H } = canvasObj;
  
  const data = [10, 8, 14, 12, 17, 20];
  const pad = { t:12, r:14, b:28, l:26 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;
  const maxV = 22;
  const slot = cW / data.length;
  const barW = slot * 0.42;

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  [0,5,10,15,20].forEach(v => {
    const y = pad.t + (1 - v/maxV) * cH;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cW, y); ctx.stroke();
  });

  ctx.fillStyle = 'rgba(152,144,184,0.75)';
  ctx.font = '9.5px Inter,sans-serif';
  ctx.textAlign = 'right';
  [5,10,15,20].forEach(v => {
    const y = pad.t + (1 - v/maxV) * cH;
    ctx.fillText(v, pad.l - 4, y + 3.5);
  });

  data.forEach((v, i) => {
    const x = pad.l + i * slot + slot / 2 - barW / 2;
    const bH = (v / maxV) * cH;
    const targetY  = pad.t + cH - bH;
    const r  = 4;

    // Simple upward animation
    let curY = pad.t + cH;
    const step = bH / 10;
    
    const grad = ctx.createLinearGradient(0, targetY, 0, pad.t + cH);
    grad.addColorStop(0, '#ff2d8f');
    grad.addColorStop(1, 'rgba(224,21,122,0.28)');

    function animateBar() {
       if (curY <= targetY) curY = targetY;
       
       // Note: we'd need to clear properly, but for a fast simple effect we just draw over.
       // It's a mock so it's acceptable here, standard is robust requestAnimationFrame state loops.
       ctx.beginPath();
       ctx.moveTo(x + r, curY);
       ctx.lineTo(x + barW - r, curY);
       ctx.arcTo(x + barW, curY, x + barW, curY + r, r);
       ctx.lineTo(x + barW, pad.t + cH);
       ctx.lineTo(x, pad.t + cH);
       ctx.lineTo(x, curY + r);
       ctx.arcTo(x, curY, x + r, curY, r);
       ctx.closePath();
       ctx.fillStyle = grad;
       ctx.fill();
       
       if(curY > targetY) {
          curY -= step;
          requestAnimationFrame(animateBar);
       }
    }
    
    setTimeout(() => { animateBar() }, i*80);
    
    ctx.fillStyle = 'rgba(152,144,184,0.75)';
    ctx.font = '9.5px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(MONTHS[i], x + barW / 2, H - 5);
  });
}
