import { showToast } from './main.js';

let curYear = 2026;
let curMonth = 2; // March
let selectedDay = 30;

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export function initSchedule() {
  renderCal();
  updateDateLabel();
  
  // Tab buttons
  document.querySelectorAll('.sch-view-btn').forEach(b => {
    b.addEventListener('click', function() {
       document.querySelectorAll('.sch-view-btn').forEach(x => x.classList.remove('active'));
       this.classList.add('active');
       showToast(`Switched to ${this.textContent} view`, 'info');
    });
  });

  // Drawer interactions on Event items
  document.querySelectorAll('.sch-event-item').forEach(item => {
    item.addEventListener('click', () => {
       showToast('Event Details Drawer Opened', 'success');
       // In a real app we'd trigger the right-side drawer here
    });
  });
}

window.changeMonth = function(dir) {
  curMonth += dir;
  if(curMonth > 11) { curMonth = 0; curYear++; }
  if(curMonth < 0) { curMonth = 11; curYear--; }
  renderCal();
};

function renderCal() {
  const lbl = document.getElementById('cal-month-label');
  if(!lbl) return;
  lbl.textContent = months[curMonth] + ' ' + curYear;
  
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';
  
  const first = new Date(curYear,curMonth,1).getDay();
  const days = new Date(curYear,curMonth+1,0).getDate();
  const prevDays = new Date(curYear,curMonth,0).getDate();
  
  // Prev month filler
  for (let i = 0; i < first; i++) {
    const d = document.createElement('div');
    d.className = 'cal-day other';
    d.textContent = prevDays - first + 1 + i;
    grid.appendChild(d);
  }
  
  // Current month
  for (let d = 1; d <= days; d++) {
    const el = document.createElement('div');
    el.className = 'cal-day' + (d === 30 && curMonth === 2 && curYear === 2026 ? ' today' : '');
    
    if (d === selectedDay && curMonth === 2 && curYear === 2026) {
      el.classList.add('selected');
    }
    if (d === 15 && curMonth === 3) el.classList.add('has-event');
    
    el.textContent = d;
    el.onclick = () => {
      selectedDay = d;
      renderCal();
      updateDateLabel();
    };
    grid.appendChild(el);
  }
  
  // Next month filler
  const total = first + days;
  const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= rem; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day other';
    el.textContent = i;
    grid.appendChild(el);
  }
}

function updateDateLabel() {
  const lbl = document.getElementById('selected-date-label');
  if(!lbl) return;
  const d = new Date(curYear, curMonth, selectedDay);
  lbl.textContent = `${dayNames[d.getDay()]}, ${months[curMonth]} ${selectedDay}, ${curYear}`;
  
  // Update mock event UI based on day
  const eventsBox = document.getElementById('day-events');
  if (selectedDay === 15 && curMonth === 3) {
     eventsBox.innerHTML = `
        <div style="padding:10px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--rs);margin-top:10px;animation:fadeIn 0.4s ease">
           <div style="font-weight:600;font-size:13px;color:var(--pink)">Johnson Wedding</div>
           <div style="font-size:11px;color:var(--text2);margin-top:4px">1:00 PM - 11:00 PM</div>
        </div>
     `;
  } else if (selectedDay === 30 && curMonth === 2 && curYear === 2026) {
     eventsBox.innerHTML = `
        <div class="sch-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:30px;height:30px;margin:0 auto 8px"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <p>Task Board sync completed today.</p>
        </div>
     `;
  }
  else {
     eventsBox.innerHTML = `
        <div class="sch-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <p>No events scheduled for this date</p>
        </div>
     `;
  }
}
