import { showToast } from './main.js';

export function initAssignedEvents() {
  // 1. Countdown logic
  const countdownEl = document.querySelector('.countdown');
  if (countdownEl) {
    let days = 15;
    let hours = 10;
    let minutes = 11;
    let seconds = 59;
    
    setInterval(() => {
      seconds--;
      if (seconds < 0) {
        seconds = 59;
        minutes--;
      }
      if (minutes < 0) {
        minutes = 59;
        hours--;
      }
      if(hours < 0) {
        hours = 23;
        days--;
      }
      countdownEl.innerHTML = `🕐 ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
  }

  // 2. Animate progress bar slightly
  const progRow = document.querySelector('.event-prog-row');
  if (progRow) {
    const valSpan = progRow.lastElementChild;
    let progress = 0;
    const tg = setInterval(() => {
      progress += 2;
      valSpan.textContent = progress + '%';
      if (progress >= 34) {
        clearInterval(tg);
      }
    }, 50);
  }

  // 3. Button interactions
  const buttons = document.querySelectorAll('.event-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
       const text = e.target.textContent.trim();
       if (text.includes('Tasks')) {
         window.location.href = 'TaskBoard.html';
       } else if (text.includes('Vendor') || text.includes('Client')) {
         window.location.href = 'Messages.html';
       } else if (text.includes('Report')) {
         window.location.href = 'Report.html';
       }
    });
  });
  
  // 4. Hover effect on image
  const imgWrap = document.querySelector('.event-img-wrap');
  if(imgWrap) {
    const bg = imgWrap.querySelector('.event-bg');
    imgWrap.addEventListener('mouseenter', () => {
       if (bg) bg.style.transform = 'scale(1.05)';
    });
    imgWrap.addEventListener('mouseleave', () => {
       if (bg) bg.style.transform = 'scale(1)';
    });
    if (bg) bg.style.transition = 'transform 0.4s ease';
  }
}
