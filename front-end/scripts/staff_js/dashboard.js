import { showToast } from './main.js';

export function initDashboard() {
  // 1. Clock and Date
  const dtEl = document.getElementById('dt');
  const clkEl = document.getElementById('clk');
  
  function tick() {
    if (!dtEl || !clkEl) return;
    const n = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    dtEl.textContent = `${days[n.getDay()]}, ${months[n.getMonth()]} ${n.getDate()}`;
    
    let h = n.getHours();
    const am = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    
    const m = String(n.getMinutes()).padStart(2, '0');
    const s = String(n.getSeconds()).padStart(2, '0');
    
    clkEl.textContent = `${String(h).padStart(2,'0')}:${m}:${s} ${am}`;
  }
  
  tick();
  setInterval(tick, 1000);

  // 2. Animate stat numbers
  const statVals = document.querySelectorAll('.stat-val');
  statVals.forEach(val => {
    const text = val.textContent.trim();
    const target = parseInt(text);
    if (!isNaN(target) && target > 0) {
      val.textContent = '0';
      let current = 0;
      const step = Math.ceil(target / 20);
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        val.textContent = current;
      }, 50);
    }
  });
  
  // 3. Status dot blinking
  const dot = document.querySelector('.live-dot');
  if (dot) {
    setInterval(() => {
      dot.style.opacity = dot.style.opacity === '0.3' ? '1' : '0.3';
    }, 800);
  }

  // 4. Real-time updates mock feed
  const rtList = document.querySelector('.rt-list');
  if (rtList) {
    const mockUpdates = [
      { text: "Client accepted proposal", src: "System", type: "success" },
      { text: "New vendor registered", src: "Admin", type: "info" },
      { text: "Task 'Stage Setup' delayed", src: "Vendor", type: "warning" }
    ];
    let updateIdx = 0;

    setInterval(() => {
      const update = mockUpdates[updateIdx % mockUpdates.length];
      const newItem = document.createElement('div');
      newItem.className = 'rt-item';
      newItem.style.animation = 'fadeIn 0.5s ease-out';
      
      // Inline keyframe just for dynamic nodes, but simple opacity fade works
      newItem.style.opacity = '0';
      
      const timeStr = `Just now`;
      const colorClass = update.type === 'success' ? 'c-green' : (update.type === 'warning' ? 'c-orange' : 'c-pink');
      const bgClass = update.type === 'success' ? 'ico-green' : (update.type === 'warning' ? 'ico-orange' : 'ico-pink');
      const iconText = update.type === 'success' ? '✓' : (update.type === 'warning' ? '⚠' : '⚡');
      
      newItem.innerHTML = `
        <div class="rt-ico ${bgClass}">${iconText}</div>
        <div class="rt-body">
          <div class="rt-text">${update.text}</div>
          <div class="rt-meta">
            <span class="rt-src ${colorClass}">${update.src}</span>
            <span class="rt-time">• ${timeStr}</span>
          </div>
        </div>
      `;
      
      // Add at top, remove last if > 4
      rtList.insertBefore(newItem, rtList.firstChild);
      if (rtList.children.length > 4) {
        rtList.lastChild.remove();
      }
      
      // animate in
      requestAnimationFrame(() => {
        newItem.style.transition = 'opacity 0.4s ease';
        newItem.style.opacity = '1';
      });
      
      showToast(`New update: ${update.text}`, 'info');
      updateIdx++;
    }, 12000); // 12 seconds
  }
}
