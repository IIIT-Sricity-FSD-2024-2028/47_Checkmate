document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const ev = id ? DB.find('events', id) : null;
  let detectedConflicts = [];

  function fmtD(d){if(!d)return'—';const dt=new Date(d+'T00:00:00');return dt.toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'});}

  /* RISK & FEASIBILITY PANEL */
  function renderRiskPanel(event){
    const allRes   = DB.getAll('resources')  || [];
    const allStaff = DB.getAll('staff')      || [];
    const reqRes   = event.requestedResources || [];
    const reqStaff = event.requestedStaff     || [];

    // Resource availability: % of requested items that have enough stock
    let resOk = 0;
    reqRes.forEach(r => {
      const db = allRes.find(x => x.id === r.resourceId);
      if (db && db.quantity >= r.quantity) resOk++;
    });
    const resPct = reqRes.length ? Math.round((resOk / reqRes.length) * 100) : 100;

    // Staff availability: % of requested staff who are available
    let staffOk = 0;
    reqStaff.forEach(s => {
      const st = allStaff.find(x => x.id === s.staffId);
      const avail = st && (st.status === 'available' || st.avail === 'Available') && (!Array.isArray(st.assignedEvents) || st.assignedEvents.length === 0);
      if (avail) staffOk++;
    });
    const staffPct = reqStaff.length ? Math.round((staffOk / reqStaff.length) * 100) : 100;

    // Contingency readiness: % of plans that are 'ready' (not triggered)
    const plans = DB.get('contingencyPlans')?.[event.id] || [];
    const readyPlans = plans.filter(p => p.status !== 'triggered').length;
    const contPct = plans.length ? Math.round((readyPlans / plans.length) * 100) : 100;

    // Overall risk level
    const avgScore = (resPct + staffPct + contPct) / 3;
    let riskLabel, riskSub, riskColor;
    const totalConflicts = detectedConflicts.length;
    if (avgScore >= 90 && totalConflicts === 0) {
      riskLabel = '✅ Low Risk Level'; riskSub = 'All resources and staff are available — safe to approve.';
      riskColor = 'rgba(34,197,94,0.12)';
    } else if (avgScore >= 60 || totalConflicts <= 1) {
      riskLabel = '⚠ Medium Risk Level'; riskSub = `${totalConflicts} conflict(s) detected — review before approving.`;
      riskColor = 'rgba(234,179,8,0.12)';
    } else {
      riskLabel = '🔴 High Risk Level'; riskSub = `${totalConflicts} critical conflict(s) — must resolve or reject.`;
      riskColor = 'rgba(239,68,68,0.12)';
    }

    // Update DOM
    const lbl  = document.getElementById('riskLevelLabel');
    const sub  = document.getElementById('riskLevelSub');
    const box  = document.getElementById('riskLevelBox');
    const resPctEl   = document.getElementById('resPct');
    const resBarEl   = document.getElementById('resBar');
    const staffPctEl = document.getElementById('staffPct');
    const staffBarEl = document.getElementById('staffBar');
    const contPctEl  = document.getElementById('contPct');
    const contBarEl  = document.getElementById('contBar');

    if(lbl)  lbl.textContent  = riskLabel;
    if(sub)  sub.textContent  = riskSub;
    if(box)  box.style.background = riskColor;
    if(resPctEl)   resPctEl.textContent   = resPct + '%';
    if(resBarEl)   { resBarEl.style.width = resPct + '%'; resBarEl.style.background = resPct >= 80 ? 'var(--green)' : resPct >= 50 ? 'var(--yellow)' : 'var(--red)'; }
    if(staffPctEl) staffPctEl.textContent = staffPct + '%';
    if(staffBarEl) { staffBarEl.style.width = staffPct + '%'; staffBarEl.style.background = staffPct >= 80 ? 'var(--green)' : staffPct >= 50 ? 'var(--yellow)' : 'var(--red)'; }
    if(contPctEl)  contPctEl.textContent  = contPct + '%';
    if(contBarEl)  contBarEl.style.width  = contPct + '%';
  }

  /* HELPER: Calculate available resource quantity for event date */
  function getResourceAvailableForEvent(resId, targetDate, currentEventId) {
    const allRes = DB.getAll('resources') || [];
    const db = allRes.find(x => x.id === resId);
    if (!db) return 0;
    const totalStock = db.total || db.quantity || 0;
    const allocs = DB.get('resourceAllocations') || {};
    const allEvents = DB.getAll('events') || [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeEvents = allEvents.filter(e => {
      if (e.status !== 'live' && e.status !== 'confirmed') return false;
      if (e.id === currentEventId) return false;
      if (!e.date) return false;
      
      if (targetDate) {
        return e.date === targetDate;
      }
      
      const evDate = new Date(e.date + 'T00:00:00');
      return evDate <= today;
    });

    let allocated = 0;
    activeEvents.forEach(ev => {
      const evAllocs = allocs[ev.id] || [];
      evAllocs.forEach(a => {
        if (a.resourceId === resId) allocated += (a.qty || a.quantity || 0);
      });
    });
    return Math.max(0, totalStock - allocated);
  }

  /* CONFLICT CHECK */
  function checkConflicts(event){
    detectedConflicts=[];
    const allRes=DB.getAll('resources')||[];
    const allStaff=DB.getAll('staff')||[];
    const allocs=DB.get('resourceAllocations')||{};
    const evAllocs=allocs[event.id]||[];

    (event.requestedResources||[]).forEach(r=>{
      const isAlreadyAllocated = evAllocs.some(a => a.resourceId === r.resourceId);
      if (isAlreadyAllocated) return;
      const db=allRes.find(x=>x.id===r.resourceId);
      const avail=getResourceAvailableForEvent(r.resourceId, event.date, event.id);
      if(!db||r.quantity>avail)
        detectedConflicts.push({type:'Resource Shortage',desc:db?`${r.resourceName}: need ${r.quantity}, only ${avail} available`:`${r.resourceName}: not in inventory`,severity:'high'});
    });
    (event.requestedStaff||[]).forEach(s=>{
      const st=allStaff.find(x=>x.id===s.staffId);
      if(!st){detectedConflicts.push({type:'Staff Not Found',desc:`${s.staffName} not found in staff list`,severity:'high'});return;}
      const isBusy = st.status==='busy'||st.avail==='Busy';
      const isOff = st.status==='off';
      const isOverloaded = (st.workload||0)>=100;
      const assignedTo = Array.isArray(st.assignedEvents)?st.assignedEvents:[];
      const isAlreadyAssigned = assignedTo.length>0 && !assignedTo.includes(event.id);
      const liveEvents = DB.getAll('events').filter(e=>e.status==='live');
      const isInLive = liveEvents.some(e=>assignedTo.includes(e.id));
      if(isOff) detectedConflicts.push({type:'Staff Off Duty',desc:`${s.staffName} is currently off duty`,severity:'high'});
      else if(isInLive) detectedConflicts.push({type:'Staff In Live Event',desc:`${s.staffName} is assigned to a live event`,severity:'high'});
      else if(isBusy) detectedConflicts.push({type:'Staff Busy',desc:`${s.staffName} is currently marked as busy`,severity:'high'});
      else if(isOverloaded) detectedConflicts.push({type:'Staff Overloaded',desc:`${s.staffName} is at ${st.workload}% workload`,severity:'high'});
      else if(isAlreadyAssigned) detectedConflicts.push({type:'Staff Already Assigned',desc:`${s.staffName} is assigned to ${assignedTo.length} other event(s)`,severity:'medium'});
    });
  }

  /* APPLY CONFLICT UI — hide/show approve, show conflict banner */
  function applyConflictUI(){
    const box=document.querySelector('.conflicts-box');
    const approveBtn=document.querySelector('.btn-approve');
    const rejectBtn=document.querySelector('.btn-reject');
    const actionBar=document.querySelector('.action-bar');
    const hasReqRes = (ev && (ev.requestedResources||[]).length > 0);
    const hasReqStaff = (ev && (ev.requestedStaff||[]).length > 0);
    const alreadyDone = ev && (ev.status==='confirmed'||ev.status==='cancelled'||ev.status==='live'||ev.status==='completed');
    if(detectedConflicts.length>0){
      if(box){
        box.style.display='block';
        box.innerHTML=`<div style="padding:20px 24px;border:1px solid rgba(239,68,68,0.35);border-radius:14px;background:rgba(239,68,68,0.08);margin-bottom:20px;">
          <div style="display:flex;align-items:center;gap:10px;font-weight:700;color:#fca5a5;font-size:16px;margin-bottom:16px;"><span style="width:32px;height:32px;border-radius:50%;background:rgba(239,68,68,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;">⚠</span> Conflicts Detected (${detectedConflicts.length})</div>
          <div style="font-size:12.5px;color:var(--text-muted);margin-bottom:14px;">The following resource/staff conflicts prevent event approval. Use "Allocate Extra" buttons above to resolve, or reject the event.</div>
          ${detectedConflicts.map(c=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border:1px solid rgba(239,68,68,0.18);border-radius:10px;margin-bottom:8px;background:rgba(239,68,68,0.04);">
            <div><div style="font-size:13px;font-weight:600;color:var(--text-primary);">${c.type}</div><div style="font-size:12px;color:var(--text-muted);margin-top:3px;">${c.desc}</div></div>
            <span style="font-size:10px;font-weight:700;padding:4px 12px;border-radius:20px;background:rgba(239,68,68,0.18);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);text-transform:uppercase;letter-spacing:0.5px;">${c.severity}</span>
          </div>`).join('')}
          <div style="margin-top:18px;display:flex;justify-content:center;gap:12px;">
            <button id="conflictRejectBtn" style="padding:13px 44px;border-radius:10px;border:none;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 18px rgba(239,68,68,0.3);transition:opacity 0.2s;">✕ Reject Event</button>
          </div>
        </div>`;
        document.getElementById('conflictRejectBtn')?.addEventListener('click',()=>doReject());
      }
      if(approveBtn)approveBtn.style.display='none';
      if(rejectBtn)rejectBtn.style.display='none';
    } else {
      if(box){
        if(hasReqRes || hasReqStaff){
          box.style.display='block';
          box.innerHTML=`<div style="padding:16px 20px;border:1px solid rgba(34,197,94,0.3);border-radius:14px;background:rgba(34,197,94,0.06);margin-bottom:20px;display:flex;align-items:center;gap:12px;">
            <span style="width:32px;height:32px;border-radius:50%;background:rgba(34,197,94,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;">✅</span>
            <div><div style="font-weight:700;color:#86efac;font-size:14px;">No Conflicts — Safe to Approve</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">All requested resources are in stock and staff members are available.</div></div>
          </div>`;
        } else {
          box.style.display='none';box.innerHTML='';
        }
      }
      if(alreadyDone){
        if(approveBtn)approveBtn.style.display='none';
        if(rejectBtn)rejectBtn.style.display='none';
      } else {
        if(approveBtn)approveBtn.style.display='';
        if(rejectBtn)rejectBtn.style.display='';
      }
    }
  }

  /* RESOURCE TABLE */
  function renderResourceTable(event){
    const section=document.getElementById('resourceReqSection');
    if(!section)return;
    const reqRes=event.requestedResources||[];
    if(!reqRes.length){section.style.display='none';return;}
    section.style.display='';
    const allRes=DB.getAll('resources')||[];
    const allocs=DB.get('resourceAllocations')||{};
    const evAllocs=allocs[event.id]||[];
    const tbody=section.querySelector('tbody');
    if(!tbody)return;
    tbody.innerHTML=reqRes.map(r=>{
      const isAllocated = evAllocs.some(a => a.resourceId === r.resourceId);
      const avail=isAllocated ? r.quantity : getResourceAvailableForEvent(r.resourceId, event.date, event.id);
      const buf=avail-r.quantity;
      const bc=buf>0?'pos':buf===0?'zero':'neg';
      const sc=isAllocated?'safe':buf>2?'safe':buf>=0?'risk':'critical';
      const act=isAllocated
        ?`<span class="row-status safe">✓ Allocated</span>`
        :buf<0
        ?`<span class="row-status critical">⚠ Conflict</span>`
        :`<button class="er-alloc-btn" data-res-id="${r.resourceId}" data-res-name="${r.resourceName}" data-res-qty="${r.quantity}" data-res-cat="${r.category||''}" style="padding:5px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(233,30,140,0.5);background:rgba(233,30,140,0.15);color:#f472b6;">▶ Allocate</button>`;
      return`<tr><td>${r.resourceName}</td><td>${r.category||'—'}</td><td class="col-num">${r.quantity}</td><td class="col-num">${avail}</td><td class="buffer-val ${bc}">${buf>=0?'+':''}${buf}</td><td style="text-align:right"><span class="row-status ${sc}">${sc}</span></td><td style="text-align:center">${act}</td></tr>`;
    }).join('');
    tbody.querySelectorAll('.er-alloc-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const resId=btn.dataset.resId,resName=btn.dataset.resName,qty=parseInt(btn.dataset.resQty,10),cat=btn.dataset.resCat;
        const avail=getResourceAvailableForEvent(resId, event.date, event.id);
        if(qty>avail){Toast.show('Not enough stock available for this event date.','error');return;}
        const allocs=DB.get('resourceAllocations')||{};
        if(!allocs[event.id])allocs[event.id]=[];
        allocs[event.id].push({resourceId:resId,resourceName:resName,category:cat,qty});
        DB.set('resourceAllocations',allocs);
        btn.outerHTML=`<span class="row-status safe">✓ Allocated</span>`;
        Toast.show(`${resName} allocated!`,'success');
        checkConflicts(event);applyConflictUI();renderRiskPanel(event);
      });
    });
  }

  /* STAFF TABLE */
  function renderStaffTable(event){
    const section=document.getElementById('staffReqSection');
    if(!section)return;
    const reqStaff=event.requestedStaff||[];
    if(!reqStaff.length){section.style.display='none';return;}
    section.style.display='';
    const allStaff=DB.getAll('staff')||[];
    const tbody=section.querySelector('tbody');
    if(!tbody)return;
    tbody.innerHTML=reqStaff.map(s=>{
      const st=allStaff.find(x=>x.id===s.staffId);
      const busy = !st || (st.workload || 0) >= 100;
      const sc=busy?'risk':'safe';
      const act=busy
        ?`<span class="row-status critical">⚠ Conflict</span>`
        :`<button class="er-assign-btn" data-staff-id="${s.staffId}" data-staff-name="${s.staffName}" style="padding:5px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(34,197,94,0.5);background:rgba(34,197,94,0.15);color:#86efac;">+ Assign</button>`;
      return`<tr><td>${s.staffName}</td><td>${s.role||'—'}</td><td class="col-num">1</td><td class="col-num">${busy?0:1}</td><td class="buffer-val ${busy?'neg':'zero'}">${busy?'-1':'+0'}</td><td style="text-align:right"><span class="row-status ${sc}">${sc}</span></td><td style="text-align:center">${act}</td></tr>`;
    }).join('');
    tbody.querySelectorAll('.er-assign-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const staffId=btn.dataset.staffId,staffName=btn.dataset.staffName;
        const db=(DB.getAll('staff')||[]).find(x=>x.id===staffId);
        if(!db)return;
        const assigned=Array.isArray(db.assignedEvents)?[...db.assignedEvents]:[];
        assigned.push(event.id);
        const newWl = Math.min((db.workload || 0) + 20, 100);
        DB.update('staff',staffId,{status: newWl >= 100 ? 'busy' : 'available', workload: newWl, assignedEvents:assigned});
        btn.outerHTML=`<span class="row-status safe">✓ Assigned</span>`;
        Toast.show(`${staffName} assigned!`,'success');
        checkConflicts(event);applyConflictUI();
      });
    });
  }

  /* EXTRA RESOURCE MODAL */
  function openExtraResModal(event){
    const allRes=DB.getAll('resources')||[];
    const all=allRes.map(r => ({ ...r, availableQty: getResourceAvailableForEvent(r.id, event.date, event.id) })).filter(r => r.availableQty > 0);
    if(!all.length){Toast.show('No resources available for this date.','warn');return;}
    document.getElementById('_erModal')?.remove();
    const overlay=document.createElement('div');
    overlay.id='_erModal';
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML=`<div onclick="event.stopPropagation()" style="background:var(--bg-sidebar,#1a1a2e);border:1px solid var(--border);border-radius:16px;width:min(540px,94vw);max-height:85vh;overflow-y:auto;">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);font-weight:700;font-size:15px;color:var(--text-primary);">Allocate Extra Resource</div>
      <div style="padding:18px 22px;display:flex;flex-direction:column;gap:10px;">
        ${all.map(r=>`<div class="_erResCard" data-rid="${r.id}" style="display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--border);border-radius:12px;cursor:pointer;transition:all .15s;">
          <div style="width:42px;height:42px;border-radius:10px;background:rgba(233,30,140,0.15);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">📦</div>
          <div style="flex:1;">
            <div style="font-weight:600;color:var(--text-primary);font-size:13.5px;">${r.name}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">${r.category} • $${r.price}/day • <span style="color:#86efac;font-weight:600;">${r.availableQty} available for ${event.date || 'event date'}</span></div>
          </div>
          <div style="text-align:right;">
            <input type="number" class="_erQtyInput" value="1" min="1" max="${r.availableQty}" onclick="event.stopPropagation()" style="width:60px;padding:6px;border-radius:8px;border:1px solid var(--border);background:var(--bg-main,#0f0f23);color:var(--text-primary);font-size:12px;text-align:center;">
          </div>
        </div>`).join('')}
        <button id="_erResCancel" style="margin-top:6px;padding:10px 18px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;align-self:flex-end;">Cancel</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',()=>overlay.remove());
    document.getElementById('_erResCancel').onclick=()=>overlay.remove();
    overlay.querySelectorAll('._erResCard').forEach(card=>{
      card.onmouseenter=()=>card.style.background='rgba(255,255,255,0.04)';
      card.onmouseleave=()=>card.style.background='';
      card.addEventListener('click',e=>{
        if(e.target.classList.contains('_erQtyInput'))return;
        e.stopPropagation();
        const resId=card.dataset.rid;
        const qty=parseInt(card.querySelector('._erQtyInput').value,10)||1;
        const res=all.find(r=>r.id===resId);
        if(!res||qty>res.availableQty){Toast.show('Not enough stock available.','error');return;}
        const allocs=DB.get('resourceAllocations')||{};
        if(!allocs[event.id])allocs[event.id]=[];
        allocs[event.id].push({resourceId:resId,resourceName:res.name,category:res.category,qty});
        DB.set('resourceAllocations',allocs);
        
        // Remove one unresolved resource conflict to simulate substitution
        const unresolvedIdx = (event.requestedResources||[]).findIndex(r => {
            const rDb = DB.getAll('resources').find(x => x.id === r.resourceId);
            return !rDb || r.quantity > getResourceAvailableForEvent(r.resourceId, event.date, event.id);
        });
        if (unresolvedIdx !== -1) {
            event.requestedResources.splice(unresolvedIdx, 1);
            DB.update('events', event.id, { requestedResources: event.requestedResources });
        }
        Toast.show(`✓ ${res.name} x${qty} allocated!`,'success');
        overlay.remove();
        renderResourceTable(event);renderStaffTable(event);
        checkConflicts(event);applyConflictUI();
      });
    });
  }

  /* EXTRA STAFF MODAL */
  function openExtraStaffModal(event){
    const allStaff=DB.getAll('staff')||[];
    const avail=allStaff.filter(s=>(s.workload || 0) < 100);
    if(!avail.length){Toast.show('No available staff.','warn');return;}
    document.getElementById('_erModal')?.remove();
    const overlay=document.createElement('div');
    overlay.id='_erModal';
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML=`<div onclick="event.stopPropagation()" style="background:var(--bg-sidebar,#1a1a2e);border:1px solid var(--border);border-radius:16px;width:min(540px,94vw);max-height:85vh;overflow-y:auto;">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);font-weight:700;font-size:15px;color:var(--text-primary);">Assign Extra Staff <span style="font-size:12px;color:var(--text-muted);font-weight:400;">(only available staff shown)</span></div>
      <div style="padding:18px 22px;display:flex;flex-direction:column;gap:8px;">
        ${avail.map(s=>`<div class="_erStaffCard" data-sid="${s.id}" style="display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--border);border-radius:12px;cursor:pointer;transition:all .15s;">
          <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#e91e8c,#a855f7);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:#fff;flex-shrink:0;">${(s.name||'S')[0]}</div>
          <div style="flex:1;">
            <div style="font-weight:600;color:var(--text-primary);font-size:13.5px;">${s.name}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">${s.role} • <span style="color:#86efac;font-weight:600;">Available</span></div>
          </div>
          <span style="font-size:11px;padding:4px 10px;border-radius:20px;background:rgba(34,197,94,0.12);color:#86efac;border:1px solid rgba(34,197,94,0.25);">Assign</span>
        </div>`).join('')}
        <button id="_erStaffCancel" style="margin-top:8px;padding:10px 18px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-muted);cursor:pointer;align-self:flex-end;">Cancel</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',()=>overlay.remove());
    document.getElementById('_erStaffCancel').onclick=()=>overlay.remove();
    overlay.querySelectorAll('._erStaffCard').forEach(card=>{
      card.onmouseenter=()=>card.style.background='rgba(255,255,255,0.04)';
      card.onmouseleave=()=>card.style.background='';
      card.addEventListener('click',e=>{
        e.stopPropagation();
        const staffId=card.dataset.sid;
        const staff=allStaff.find(s=>s.id===staffId);
        if(!staff)return;
        const assigned=Array.isArray(staff.assignedEvents)?[...staff.assignedEvents]:[];
        assigned.push(event.id);
        const newWl = Math.min((staff.workload || 0) + 20, 100);
        DB.update('staff',staffId,{status: newWl >= 100 ? 'busy' : 'available', workload: newWl, assignedEvents:assigned});
        
        // Remove one unresolved staff conflict to simulate substitution
        const unresolvedIdx = (event.requestedStaff||[]).findIndex(s => {
            const st = DB.getAll('staff').find(x => x.id === s.staffId);
            return !st || (st.workload || 0) >= 100;
        });
        if (unresolvedIdx !== -1) {
            event.requestedStaff.splice(unresolvedIdx, 1);
            DB.update('events', event.id, { requestedStaff: event.requestedStaff });
        }
        
        Toast.show(`✓ ${staff.name} assigned!`,'success');
        overlay.remove();
        renderResourceTable(event);renderStaffTable(event);
        checkConflicts(event);applyConflictUI();
      });
    });
  }

  /* CANCEL */
  function doReject(){
    if(!ev)return;
    if(ev.status==='cancelled'){Toast.show('Already cancelled.','info');return;}
    const summary=detectedConflicts.length?detectedConflicts.map(c=>`${c.type}: ${c.desc}`).join('; '):'Cancelled by vendor';
    const msg=detectedConflicts.length?`"${ev.name}" has ${detectedConflicts.length} conflict(s). Reject and notify client?`:`"${ev.name}" will be cancelled.`;
    Confirm.ask({title:detectedConflicts.length?'Reject Due to Conflict?':'Reject Event Request?',msg:msg,okLabel:'Reject',okColor:'#b91c1c'}).then(ok=>{
      if(!ok)return;
      DB.update('events',ev.id,{status:'cancelled',cancellationReason:summary,cancelledAt:new Date().toISOString(),conflicts:detectedConflicts});
      Toast.show(`"${ev.name}" cancelled. Client notified.`,'error');
      const badge=document.querySelector('.ev-status-badge');
      if(badge){badge.textContent='Cancelled';badge.style.background='rgba(239,68,68,0.15)';badge.style.color='var(--red)';badge.style.border='1px solid rgba(239,68,68,0.3)';}
      setTimeout(()=>window.location.href='event-request.html',1400);
    });
  }

  /* POPULATE CLIENT REQUIREMENTS DYNAMICALLY */
  function renderClientReq(event){
    const card=document.querySelector('.client-req-card');
    if(!card)return;
    const reqRes=event.requestedResources||[];
    const reqStaff=event.requestedStaff||[];
    const submittedDate=event.submittedAt?new Date(event.submittedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' at '+new Date(event.submittedAt).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'—';
    const clientName=event.client||'Client';
    // Header meta
    const metaEl=card.querySelector('.client-req-card__meta');
    if(metaEl) metaEl.innerHTML=`<i data-lucide="user"></i>&nbsp;Submitted by ${clientName}&nbsp;·&nbsp;<i data-lucide="clock"></i>&nbsp;${submittedDate}`;
    // Tags: show requested resources & staff as tags
    const tagsEl=card.querySelector('.client-req-tags');
    if(tagsEl){
      let tagHtml='';
      reqRes.forEach(r=>tagHtml+=`<span class="client-tag"><i data-lucide="package"></i> ${r.resourceName} ×${r.quantity}</span>`);
      reqStaff.forEach(s=>tagHtml+=`<span class="client-tag"><i data-lucide="user"></i> ${s.staffName} (${s.role})</span>`);
      if(!tagHtml) tagHtml='<span style="color:var(--text-muted);font-size:12px;">No specific resources or staff requested.</span>';
      tagsEl.innerHTML=tagHtml;
    }
    // Message: show notes
    const msgEl=card.querySelector('.client-req-message');
    if(msgEl) msgEl.textContent=event.notes||'No additional notes from client.';
    // Extras: budget, people, event type
    const extrasEl=card.querySelector('.client-req-extras');
    if(extrasEl){
      extrasEl.innerHTML=`
        <div class="client-extra-item"><i data-lucide="dollar-sign"></i><div><div class="client-extra-label">Budget Range</div><div class="client-extra-value">${event.budgetRange||'Not specified'}</div></div></div>
        <div class="client-extra-item"><i data-lucide="users"></i><div><div class="client-extra-label">Expected Guests</div><div class="client-extra-value">${event.people||0} people</div></div></div>
        <div class="client-extra-item"><i data-lucide="tag"></i><div><div class="client-extra-label">Event Type</div><div class="client-extra-value">${event.type||'—'}</div></div></div>`;
    }
    if(typeof lucide!=='undefined')lucide.createIcons();
  }

  /* WIRE UP PAGE */
  if(ev){
    const h2=document.querySelector('.ev-header__left h2');if(h2)h2.textContent=ev.name;
    const subP=document.querySelector('.ev-header__left p');if(subP)subP.textContent=`Event ID: ${ev.id} · ${ev.type}`;
    const badge=document.querySelector('.ev-status-badge');
    if(badge){
      const labels={pending:'Under Review',confirmed:'Approved',cancelled:'Cancelled',live:'Live',completed:'Completed'};
      const colors={pending:{bg:'rgba(234,179,8,0.15)',color:'var(--yellow)',border:'rgba(234,179,8,0.3)'},confirmed:{bg:'rgba(34,197,94,0.15)',color:'var(--green)',border:'rgba(34,197,94,0.3)'},cancelled:{bg:'rgba(239,68,68,0.15)',color:'var(--red)',border:'rgba(239,68,68,0.3)'},live:{bg:'rgba(59,130,246,0.15)',color:'var(--blue)',border:'rgba(59,130,246,0.3)'},completed:{bg:'rgba(107,93,126,0.15)',color:'var(--text-muted)',border:'rgba(107,93,126,0.3)'}};
      const c=colors[ev.status]||colors.pending;
      badge.textContent=labels[ev.status]||'Under Review';badge.style.background=c.bg;badge.style.color=c.color;badge.style.border=`1px solid ${c.border}`;
    }
    const metaVals=document.querySelectorAll('.ev-meta-value');
    if(metaVals[0])metaVals[0].textContent=fmtD(ev.date);
    if(metaVals[1])metaVals[1].textContent=ev.time||'—';
    if(metaVals[2])metaVals[2].textContent=ev.venue||'—';
    if(metaVals[3])metaVals[3].textContent=`${ev.people||0} people`;
    document.title=`EventPro – Review: ${ev.name}`;
    renderClientReq(ev);
    renderResourceTable(ev);
    renderStaffTable(ev);
    checkConflicts(ev);
    applyConflictUI();
    renderRiskPanel(ev);
    document.getElementById('allocExtraResBtn')?.addEventListener('click',()=>openExtraResModal(ev));
    document.getElementById('allocExtraStaffBtn')?.addEventListener('click',()=>openExtraStaffModal(ev));
  } else if(id){Toast.show('Event not found.','error');}

  /* APPROVE */
  document.querySelector('.btn-approve')?.addEventListener('click',()=>{
    if(!ev)return;
    if(ev.status==='confirmed'){Toast.show('Already approved.','info');return;}
    if(detectedConflicts.length){Toast.show('Cannot approve — conflicts exist. Allocate alternatives or reject.','error');return;}
    DB.update('events',ev.id,{status:'confirmed',approvedAt:new Date().toISOString()});
    Toast.show(`✓ "${ev.name}" approved!`,'success');
    const badge=document.querySelector('.ev-status-badge');
    if(badge){badge.textContent='Approved';badge.style.background='rgba(34,197,94,0.15)';badge.style.color='var(--green)';badge.style.border='1px solid rgba(34,197,94,0.3)';}
    setTimeout(()=>window.location.href='event-request.html',1400);
  });

  /* REJECT btn in action bar */
  document.querySelector('.btn-reject')?.addEventListener('click',()=>doReject());

  /* BACK */
  document.querySelector('.btn-back')?.addEventListener('click',e=>{e.preventDefault();window.location.href='event-request.html';});

  /* CONTINGENCY PLANNING */
  let _ch=null;
  function getPlans(eid){
    const all=DB.get('contingencyPlans')||{};
    if(all[eid])return all[eid];
    const def=all['_default']||[];
    const cp=def.map((p,i)=>({...p,id:'CP_'+eid+'_'+Date.now()+'_'+i}));
    all[eid]=cp;DB.set('contingencyPlans',all);return cp;
  }
  function renderPlans(){
    const sec=document.getElementById('contingencySection');if(!sec)return;
    if(!id){sec.innerHTML='<div style="padding:20px;text-align:center;color:var(--text-muted);">No event.</div>';return;}
    if(_ch){sec.removeEventListener('click',_ch);_ch=null;}
    const plans=getPlans(id);
    let html=`<table class="cont-table"><thead><tr><th>Problem</th><th>Trigger</th><th>Solution</th><th>Status</th><th style="width:44px"></th></tr></thead><tbody>`;
    if(!plans.length){html+=`<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">No plans yet.</td></tr>`;}
    else plans.forEach(p=>{
      const st=p.status==='triggered'?'<span class="cont-status-triggered">⚡ triggered</span>':'<span class="row-status ready">ready</span>';
      html+=`<tr><td>${p.problem}</td><td>${p.trigger}</td><td>${p.solution}</td><td>${st}</td><td style="text-align:right"><button class="cont-del-btn" data-plan-id="${p.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></td></tr>`;
    });
    html+=`</tbody></table><div class="cont-add-row"><div class="cont-input-group"><label>Problem</label><input type="text" id="cpProblem" placeholder="e.g. Venue Flooding"/></div><div class="cont-input-group"><label>Trigger</label><input type="text" id="cpTrigger" placeholder="e.g. Heavy rain"/></div><div class="cont-input-group"><label>Solution</label><input type="text" id="cpSolution" placeholder="e.g. Move to Hall B"/></div><button class="cont-add-btn" id="cpAddBtn"><i data-lucide="plus"></i> Add Plan</button></div>`;
    sec.innerHTML=html;
    if(typeof lucide!=='undefined')lucide.createIcons();
    _ch=function(e){
      const del=e.target.closest('.cont-del-btn');
      if(del){
        e.preventDefault();e.stopPropagation();
        const pid=del.dataset.planId;
        Confirm.ask({title:'Remove Plan?',msg:'This plan will be deleted.',okLabel:'Remove',okColor:'#b91c1c'}).then(ok=>{
          if(!ok)return;
          const all=DB.get('contingencyPlans')||{};
          if(all[id]){all[id]=all[id].filter(p=>p.id!==pid);DB.set('contingencyPlans',all);}
          Toast.show('Plan removed.','error');renderPlans();
        });return;
      }
      const add=e.target.closest('#cpAddBtn');
      if(add){
        const prob=document.getElementById('cpProblem')?.value.trim();
        const trig=document.getElementById('cpTrigger')?.value.trim();
        const sol=document.getElementById('cpSolution')?.value.trim();
        if(!prob||!trig||!sol){Toast.show('Fill all fields.','warn');return;}
        const all=DB.get('contingencyPlans')||{};
        if(!all[id])all[id]=[];
        all[id].push({id:'CP_'+Date.now(),problem:prob,trigger:trig,solution:sol,status:'ready'});
        DB.set('contingencyPlans',all);Toast.show('✓ Plan added!','success');renderPlans();
      }
    };
    sec.addEventListener('click',_ch);
  }
  renderPlans();
  if(typeof lucide!=='undefined')lucide.createIcons();
});