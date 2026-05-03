import { showToast } from './main.js';

export function initTaskBoard() {
  // Setup cards
  enhanceCards();
  updateCounts();
  showToast('Task Board Loaded', 'success');

  // Wire quick message icons dynamically
  document.querySelectorAll('.task-meta-item svg:last-child').forEach(ico => {
    ico.style.cursor = 'pointer';
    ico.addEventListener('click', (e) => {
       e.stopPropagation();
       showToast('Opening conversation...', 'info');
       setTimeout(() => window.location.href = 'Messages.html', 800);
    });
  });
}

function enhanceCards() {
  document.querySelectorAll('.task-card').forEach(card => {
    // 1. Assign "Mike Staff" to a few tasks for demonstration of validation
    if (!card.hasAttribute('data-assignee')) {
      if (['t1', 't3', 't5'].includes(card.id)) {
        card.setAttribute('data-assignee', 'Mike Staff');
        const byDiv = card.querySelector('.task-meta-item:nth-child(2)');
        if (byDiv) byDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>By: You <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
      } else {
        card.setAttribute('data-assignee', 'Admin');
      }
    }

    // 2. Add action buttons if missing
    if (!card.querySelector('.task-actions')) {
      const actions = document.createElement('div');
      actions.className = 'task-actions';
      actions.innerHTML = `
        <button class="action-btn btn-edit" title="Edit Task">✏️</button>
      `;
      card.insertBefore(actions, card.firstChild);
    }
    
    // 3. Add edit form if missing
    if (!card.querySelector('.task-edit-form')) {
      const form = document.createElement('div');
      form.className = 'task-edit-form';
      form.style.display = 'none';
      form.innerHTML = `
        <div class="edit-row">
          <label>Status:</label>
          <select class="edit-status">
            <option value="assigned">Assigned</option>
            <option value="progress">In Progress</option>
            <option value="done">Completed</option>
          </select>
        </div>
        <div class="edit-row">
          <label>Priority:</label>
          <select class="edit-priority">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div class="edit-row">
          <label>Progress: <span class="prog-val">0%</span></label>
          <div class="range-wrap"><input type="range" class="edit-progress" min="0" max="100" value="0"></div>
        </div>
        <div class="edit-row">
          <label>Notes <span class="notes-icon">📝</span></label>
          <textarea class="edit-notes" placeholder="Add updates..."></textarea>
        </div>
        <div class="edit-actions">
          <button class="btn-save btn-action-small">✔️ Save</button>
          <button class="btn-complete btn-action-small">Mark Completed</button>
        </div>
      `;
      card.appendChild(form);
    }
    
    // 4. Add updated timestamp container if missing
    if (!card.querySelector('.task-updated-at')) {
      const ts = document.createElement('div');
      ts.className = 'task-updated-at';
      ts.style.display = 'none';
      card.appendChild(ts);
    }

    bindCardEvents(card);
  });
}

function bindCardEvents(card) {
  const btnEdit = card.querySelector('.btn-edit');
  const btnSave = card.querySelector('.btn-save');
  const btnComp = card.querySelector('.btn-complete');
  const slider = card.querySelector('.edit-progress');
  const progVal = card.querySelector('.prog-val');

  // Remove old listeners by cloning
  const newBtnEdit = btnEdit.cloneNode(true);
  btnEdit.parentNode.replaceChild(newBtnEdit, btnEdit);
  newBtnEdit.onclick = (e) => toggleEditMode(e, card);

  const newBtnSave = btnSave.cloneNode(true);
  btnSave.parentNode.replaceChild(newBtnSave, btnSave);
  newBtnSave.onclick = (e) => saveTaskEdits(e, card);

  const newBtnComp = btnComp.cloneNode(true);
  btnComp.parentNode.replaceChild(newBtnComp, btnComp);
  newBtnComp.onclick = (e) => markQuickComplete(e, card);

  const newSlider = slider.cloneNode(true);
  slider.parentNode.replaceChild(newSlider, slider);
  newSlider.oninput = (e) => {
    progVal.textContent = e.target.value + '%';
    newSlider.setAttribute('value', e.target.value); // for innerHTML save
  };
}

function toggleEditMode(e, card) {
  e.stopPropagation();
  
  // Validation
  if (card.getAttribute('data-assignee') !== 'Mike Staff') {
    showToast('You can only edit tasks assigned to you.', 'warning');
    return;
  }
  
  // Find current column
  const currentCol = card.closest('.kanban-col');
  if (currentCol && currentCol.id === 'col-done') {
    showToast('Completed tasks cannot be edited.', 'warning');
    return;
  }

  const isEditing = card.classList.contains('editing');
  const editForm = card.querySelector('.task-edit-form');
  const staticContent = card.querySelectorAll('.task-top, .task-event, .task-meta, .task-prog');

  if (!isEditing) {
    card.classList.add('editing');
    card.setAttribute('draggable', 'false'); // disable drag during edit
    editForm.style.display = 'block';
    staticContent.forEach(el => el.style.display = 'none');

    // Sync form with current display
    const statusSelect = card.querySelector('.edit-status');
    if (currentCol.id === 'col-assigned') statusSelect.value = 'assigned';
    else if (currentCol.id === 'col-progress') statusSelect.value = 'progress';
    else statusSelect.value = 'done';
    
    // set selected attribute for innerHTML save
    Array.from(statusSelect.options).forEach(opt => {
        if(opt.value === statusSelect.value) opt.setAttribute('selected', '');
        else opt.removeAttribute('selected');
    });

    const priorityBadge = card.querySelector('.priority-badge');
    const prioritySelect = card.querySelector('.edit-priority');
    if (priorityBadge.textContent === 'High') prioritySelect.value = 'High';
    else if (priorityBadge.textContent === 'Medium') prioritySelect.value = 'Medium';
    else prioritySelect.value = 'Low';

    Array.from(prioritySelect.options).forEach(opt => {
        if(opt.value === prioritySelect.value) opt.setAttribute('selected', '');
        else opt.removeAttribute('selected');
    });

    const progFill = card.querySelector('.prog-fill');
    const slider = card.querySelector('.edit-progress');
    const progVal = card.querySelector('.prog-val');
    if (progFill && progFill.style.width) {
      const val = parseInt(progFill.style.width);
      slider.value = val;
      slider.setAttribute('value', val);
      progVal.textContent = val + '%';
    } else {
      slider.value = 0;
      slider.setAttribute('value', 0);
      progVal.textContent = '0%';
    }
  } else {
    // Close without saving
    closeEditMode(card);
  }
}

function closeEditMode(card) {
  card.classList.remove('editing');
  card.setAttribute('draggable', 'true');
  card.querySelector('.task-edit-form').style.display = 'none';
  card.querySelectorAll('.task-top, .task-event, .task-meta, .task-prog, .task-done-tag').forEach(el => {
    if (el) el.style.display = ''; // restore
  });
}

function saveTaskEdits(e, card) {
  e.preventDefault();
  
  const statusSelect = card.querySelector('.edit-status');
  const prioritySelect = card.querySelector('.edit-priority');
  const slider = card.querySelector('.edit-progress');
  const notesArea = card.querySelector('.edit-notes');

  // Force attributes for innerHTML save
  Array.from(statusSelect.options).forEach(opt => opt.value === statusSelect.value ? opt.setAttribute('selected', '') : opt.removeAttribute('selected'));
  Array.from(prioritySelect.options).forEach(opt => opt.value === prioritySelect.value ? opt.setAttribute('selected', '') : opt.removeAttribute('selected'));
  slider.setAttribute('value', slider.value);
  notesArea.innerHTML = notesArea.value;

  // Update Priority Badge
  const priorityBadge = card.querySelector('.priority-badge');
  priorityBadge.textContent = prioritySelect.value;
  priorityBadge.className = 'priority-badge'; // reset
  if (prioritySelect.value === 'High') priorityBadge.classList.add('pri-high');
  else if (prioritySelect.value === 'Medium') priorityBadge.classList.add('pri-medium');
  else priorityBadge.classList.add('pri-low');

  // Update Progress Bar
  let progFill = card.querySelector('.prog-fill');
  if (!progFill && slider.value > 0) {
    // Create progress bar if it doesn't exist but has value
    let taskProg = card.querySelector('.task-prog');
    if (!taskProg) {
      taskProg = document.createElement('div');
      taskProg.className = 'task-prog prog';
      // insert before actions/edit form but after meta
      const meta = card.querySelector('.task-meta');
      if (meta) meta.after(taskProg);
      else card.appendChild(taskProg);
    }
    taskProg.innerHTML = `<div class="prog-fill ${slider.value == 100 ? 'pf-green' : 'pf-pink'}" style="width:${slider.value}%"></div>`;
  } else if (progFill) {
    progFill.style.width = slider.value + '%';
    progFill.className = `prog-fill ${slider.value == 100 ? 'pf-green' : 'pf-pink'}`;
  }

  // Handle Timestamp
  const ts = card.querySelector('.task-updated-at');
  ts.textContent = 'Last updated: just now';
  ts.style.display = 'block';

  closeEditMode(card);

  // Move Column if status changed
  const targetColId = 'col-' + statusSelect.value;
  const targetCol = document.getElementById(targetColId);
  const currentCol = card.closest('.kanban-col');
  
  if (targetCol && currentCol !== targetCol) {
    // Apply logic similar to dropping
    handleColumnChangeLogic(card, statusSelect.value);
    targetCol.appendChild(card);
  } else if (statusSelect.value === 'done') {
      handleColumnChangeLogic(card, 'done');
  }

  updateCounts();
  showToast('Task Updated Successfully', 'success');
}

function markQuickComplete(e, card) {
  e.preventDefault();
  const statusSelect = card.querySelector('.edit-status');
  statusSelect.value = 'done';
  const slider = card.querySelector('.edit-progress');
  slider.value = 100;
  saveTaskEdits(e, card);
}

function handleColumnChangeLogic(card, colType) {
    if (colType === 'done' && !card.querySelector('.task-done-tag')) {
       const tag = document.createElement('div');
       tag.className = 'task-done-tag';
       tag.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Task Completed`;
       card.appendChild(tag);
       // hide progress bar on done
       const prog = card.querySelector('.task-prog');
       if(prog) prog.style.display = 'none';
    } else if (colType !== 'done') {
       const tag = card.querySelector('.task-done-tag');
       if(tag) tag.remove();
       const prog = card.querySelector('.task-prog');
       if(prog) prog.style.display = '';
    }
}

let dragged = null;

window.drag = function(e) {
  dragged = e.target.closest('.task-card');
  e.dataTransfer.effectAllowed = 'move';
};

window.allowDrop = function(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
};

window.drop = function(e, col) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (dragged) {
    const cols = { assigned: 'col-assigned', progress: 'col-progress', done: 'col-done' };
    const targetCol = document.getElementById(cols[col]);
    
    // Update internal form select state to match drop
    const statusSelect = dragged.querySelector('.edit-status');
    if (statusSelect) {
       statusSelect.value = col;
       Array.from(statusSelect.options).forEach(opt => {
           if(opt.value === col) opt.setAttribute('selected', '');
           else opt.removeAttribute('selected');
       });
    }

    handleColumnChangeLogic(dragged, col);
    
    // Add progress bar if moved to progress and doesn't exist
    if (col === 'progress' && !dragged.querySelector('.task-prog') && col !== 'done') {
      const prog = document.createElement('div');
      prog.className = 'task-prog prog';
      prog.innerHTML = `<div class="prog-fill pf-pink" style="width:10%"></div>`;
      // insert before actions/edit form
      const meta = dragged.querySelector('.task-meta');
      if (meta) meta.after(prog);
      else dragged.appendChild(prog);
      
      const slider = dragged.querySelector('.edit-progress');
      if (slider) { slider.value = 35; slider.setAttribute('value', 35); }
      
      setTimeout(() => {
         const fill = prog.querySelector('.prog-fill');
         if (fill) fill.style.width = '35%';
      }, 500);
    } else if (col === 'done') {
        showToast('Task marked as Completed', 'success');
    }

    targetCol.appendChild(dragged);
    updateCounts();
  }
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.kanban-col').forEach(c => 
       c.addEventListener('dragleave', () => c.classList.remove('drag-over'))
    );
});

function updateCounts() {
  document.querySelectorAll('.kanban-col').forEach(col => {
    const count = col.querySelectorAll('.task-card').length;
    const colCount = col.querySelector('.col-count');
    if (colCount) colCount.textContent = count;
  });
}
