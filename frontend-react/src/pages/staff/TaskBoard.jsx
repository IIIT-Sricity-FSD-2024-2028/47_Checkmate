/**
 * PAGE: TaskBoard.jsx
 * WHAT IT DOES:
 *   Interactive Kanban Task Board for staff members. It lets staff view their tasks
 *   grouped into columns (To Do, In Progress, Done), drag and drop tasks between
 *   columns, create new tasks for accepted events, and delete completed/unneeded tasks.
 *
 * APIS USED:
 *   - GET  /api/staff-assignments  -> to load events and their tasks
 *   - GET  /api/staff              -> to identify staff member and workload
 *   - PATCH /api/staff-assignments/:id -> to persist task column/status moves and additions
 *   - PATCH /api/staff/:id         -> to auto-update staff workload on task completion
 */

import React, { useState, useEffect } from 'react';
import './staff.css';
import Toast from './components/Toast';
import { getSessionUser, fetchStaffAssignments, fetchStaffList, updateStaffAssignment, updateStaffMember } from './staffApi';

export default function StaffTaskBoard() {
  // Stores the active staff user info (name, email, role, token) from browser session
  // FACULTY MAY ASK: How do you test this board with a different staff member's account?
  // HOW TO CHANGE: Change session fallback in staffApi.js or replace getSessionUser() with { name: 'Sarah Staff', role: 'Staff' }.
  const [session] = useState(() => getSessionUser());

  // Stores all accepted event assignments assigned to this staff member
  // FACULTY MAY ASK: How would you make this board show all assignments regardless of status?
  // HOW TO CHANGE: In loadData(), remove "&& a.status === 'accepted'" from the accepted filter condition.
  const [assignments, setAssignments] = useState([]);

  // Controls whether the loading text is shown while waiting for the server
  // FACULTY MAY ASK: How do you change the loading indicator to a spinner or custom text?
  // HOW TO CHANGE: Search for "loading && assignments.length === 0" in the JSX below and replace the text.
  const [loading, setLoading] = useState(true);

  // Stores any network or server error message to display in an alert banner
  // FACULTY MAY ASK: How do you hide the red error alert banner even if the API fails?
  // HOW TO CHANGE: Set setError(null) or comment out the "{error && ...}" block in the JSX.
  const [error, setError] = useState(null);

  // Stores the full staff profile object from /api/staff (used for workload calculation)
  // FACULTY MAY ASK: Where is the staff workload value read from?
  // HOW TO CHANGE: It comes from matchedStaff.workload in loadData(); you can inspect or log matchedStaff.
  const [matchedStaff, setMatchedStaff] = useState(null);

  // Tracks the ID of the task card currently being dragged across columns
  // FACULTY MAY ASK: How does the drop handler know which task was moved?
  // HOW TO CHANGE: It reads draggedTaskId (or e.dataTransfer text) set inside handleDragStart().
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Tracks which column is currently hovered over during drag to highlight it with dashed pink borders
  // FACULTY MAY ASK: How do you change the highlight style when a card is dragged over a column?
  // HOW TO CHANGE: In staff.css, edit the ".drag-over" class or change dragOverColumn state comparison in JSX.
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Modal State: Controls whether the "Add New Task" popup is visible
  // FACULTY MAY ASK: How do you open the modal automatically when the page loads?
  // HOW TO CHANGE: Set initial state useState(true) instead of useState(false) for isModalOpen.
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal State: Stores the assignment ID chosen in the "Select Accepted Event" dropdown
  // FACULTY MAY ASK: How do you change the default selected event in the dropdown?
  // HOW TO CHANGE: In loadData(), change setSelectedEventId(normalized[0].id) to any other event id.
  const [selectedEventId, setSelectedEventId] = useState('');

  // Modal State: Stores the user input text for task description
  // FACULTY MAY ASK: How do you add placeholder text or pre-fill a default task name?
  // HOW TO CHANGE: Change initial state useState('') to useState('Initial Task') or change input placeholder in modal JSX.
  const [taskDesc, setTaskDesc] = useState('');

  // Modal State: Stores the selected priority ('High', 'Medium', 'Low') for the new task
  // FACULTY MAY ASK: How do you make "High" the default priority instead of "Medium"?
  // HOW TO CHANGE: Change initial state useState('Medium') to useState('High').
  const [taskPriority, setTaskPriority] = useState('Medium');

  // Stores temporary notification message shown in the top toast popup
  // FACULTY MAY ASK: How do you increase the toast popup display duration from 2.5s to 5s?
  // HOW TO CHANGE: Change 2500 to 5000 in the setTimeout(() => setToastMessage(null), 2500) calls.
  const [toastMessage, setToastMessage] = useState(null);

  // Fetches assignments and staff profile from backend, links tasks, and sets up data
  // FACULTY MAY ASK: How do you stop the board from automatically polling the server every 5 seconds?
  // HOW TO CHANGE: In useEffect below, comment out the "setInterval(loadData, 5000)" line.
  const loadData = async () => {
    try {
      setError(null);
      const [allAssignments, staffList] = await Promise.all([
        fetchStaffAssignments(),
        fetchStaffList().catch(() => []),
      ]);

      const myName = (session.name || '').trim().toLowerCase();
      const myEmail = (session.email || '').toLowerCase();
      let staffMember = null;

      // Find staff profile by ID, name or email
      if (Array.isArray(staffList)) {
        staffMember = staffList.find(
          (st) =>
            (session.staffId && st.id === session.staffId) ||
            (st.name && st.name.trim().toLowerCase() === myName) ||
            (st.email && st.email.toLowerCase() === myEmail)
        );
      }
      setMatchedStaff(staffMember);

      const staffId = staffMember ? staffMember.id : session.staffId;

      // Filter only accepted assignments that belong to this staff member
      // FACULTY MAY ASK: How do you show tasks for all staff members instead of just the logged-in user?
      // HOW TO CHANGE: In the filter below, change the return to "return a.status === 'accepted';" omitting the isMe check.
      const accepted = Array.isArray(allAssignments)
        ? allAssignments.filter((a) => {
            const isMe =
              (staffId && a.staffId === staffId) ||
              (a.staffName && a.staffName.trim().toLowerCase() === myName);
            return isMe && a.status === 'accepted';
          })
        : [];

      // Auto-migrate legacy taskDesc single string into structured tasks array
      let needsSave = false;
      const normalized = accepted.map((a) => {
        let tasks = Array.isArray(a.tasks) ? [...a.tasks] : [];
        if (tasks.length === 0 && a.taskDesc) {
          tasks = [
            {
              id: `${a.id}_base`,
              desc: a.taskDesc,
              priority: a.priority || 'Medium',
              status: 'todo',
              eventName: a.eventName,
            },
          ];
          needsSave = true;
          updateStaffAssignment(a.id, { tasks }).catch(() => {});
        }
        return { ...a, tasks };
      });

      setAssignments(normalized);
      if (normalized.length > 0 && !selectedEventId) {
        setSelectedEventId(normalized[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load task board');
    } finally {
      setLoading(false);
    }
  };

  // Runs once on component mount to load data, and polls every 5 seconds to stay updated
  // FACULTY MAY ASK: Why is there a return function inside this useEffect?
  // HOW TO CHANGE: It cleans up the 5-second interval timer when the user leaves the page to prevent memory leaks.
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Groups all tasks from all accepted assignments into three column buckets: todo, progress, done
  // FACULTY MAY ASK: How would you add a 4th Kanban column called "Review" or "Blocked"?
  // HOW TO CHANGE: Add "blocked: []" to the columns object below, and add a matching column block in JSX.
  const columns = { todo: [], progress: [], done: [] };
  assignments.forEach((assignment) => {
    if (Array.isArray(assignment.tasks)) {
      assignment.tasks.forEach((task) => {
        const col = task.status || 'todo';
        if (columns[col]) {
          columns[col].push({
            ...task,
            assignmentId: assignment.id,
            eventName: task.eventName || assignment.eventName,
          });
        }
      });
    }
  });

  // Called when staff starts dragging a task card; saves task ID into the drag data transfer
  // FACULTY MAY ASK: How do you prevent completed tasks from being dragged back?
  // HOW TO CHANGE: In JSX on the task-card div, conditionally set draggable={task.status !== 'done'}.
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Called continuously while a dragged card hovers over a column; allows drop by preventing default
  // FACULTY MAY ASK: Why is e.preventDefault() required here?
  // HOW TO CHANGE: HTML5 drag-and-drop cancels drops by default; preventDefault() allows dropping on this column.
  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colKey) {
      setDragOverColumn(colKey);
    }
  };

  // Clears the dashed highlight when dragged card leaves the column boundaries
  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  // Called when a task card is released onto a column; updates state and calls backend API
  // FACULTY MAY ASK: How do you prevent moving a task directly from "To Do" to "Done"?
  // HOW TO CHANGE: At the start of handleDrop, add: if (oldStatus === 'todo' && newStatus === 'done') return;
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    let targetAssignment = null;
    let oldStatus = null;

    // Find the task across assignments and update its status locally for instant UI update
    const updatedAssignments = assignments.map((a) => {
      if (!Array.isArray(a.tasks)) return a;
      const taskIndex = a.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        oldStatus = a.tasks[taskIndex].status;
        if (oldStatus === newStatus) return a; // No change needed if dropped in same column

        const updatedTasks = [...a.tasks];
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };

        targetAssignment = { ...a, tasks: updatedTasks };
        return targetAssignment;
      }
      return a;
    });

    if (!targetAssignment || oldStatus === newStatus) return;

    // Optimistically update UI so staff sees instant movement
    setAssignments(updatedAssignments);

    try {
      // Save updated task status to backend via PATCH /api/staff-assignments/:id
      await updateStaffAssignment(targetAssignment.id, { tasks: targetAssignment.tasks });

      // Adjust staff workload: completing a task frees 20% capacity; reopening it adds 20%
      // FACULTY MAY ASK: How do you change how much workload is reduced when a task is completed?
      // HOW TO CHANGE: Change "wl - 20" to "wl - 10" or any other value in the math calculation below.
      if (matchedStaff && matchedStaff.id) {
        let wl = matchedStaff.workload || 0;
        if (newStatus === 'done' && oldStatus !== 'done') {
          wl = Math.max(wl - 20, 0);
          await updateStaffMember(matchedStaff.id, { workload: wl }).catch(() => {});
        } else if (oldStatus === 'done' && newStatus !== 'done') {
          wl = Math.min(wl + 20, 100);
          await updateStaffMember(matchedStaff.id, { workload: wl }).catch(() => {});
        }
      }

      setToastMessage({ text: `Task moved to ${newStatus === 'progress' ? 'In Progress' : newStatus}`, type: 'success' });
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      alert(`Failed to save task move: ${err.message}`);
      loadData(); // Revert back on error
    }
  };

  // Creates a brand new task under the chosen event and saves it to the database
  // FACULTY MAY ASK: How do you add validation to require at least 5 characters for the task description?
  // HOW TO CHANGE: Add "if (taskDesc.trim().length < 5) { alert('Minimum 5 characters'); return; }" before saving.
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskDesc.trim()) {
      alert('Please enter a task description');
      return;
    }

    const a = assignments.find((item) => item.id === selectedEventId);
    if (!a) {
      alert('Please select an event for this task');
      return;
    }

    // Build the new task object with a timestamp ID
    const newTask = {
      id: 'T_' + Date.now(),
      desc: taskDesc.trim(),
      priority: taskPriority,
      status: 'todo',
      eventName: a.eventName,
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = [...(a.tasks || []), newTask];

    try {
      await updateStaffAssignment(a.id, { tasks: updatedTasks });

      setAssignments((prev) =>
        prev.map((item) => (item.id === a.id ? { ...item, tasks: updatedTasks } : item))
      );

      setTaskDesc('');
      setIsModalOpen(false);
      setToastMessage({ text: 'Task created successfully!', type: 'success' });
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    }
  };

  // Deletes a specific task from its event after user confirmation
  // FACULTY MAY ASK: How do you bypass the browser confirmation prompt on task delete?
  // HOW TO CHANGE: Comment out or remove the "if (!window.confirm('Delete this task?')) return;" line.
  const handleDeleteTask = async (assignmentId, taskId) => {
    if (!window.confirm('Delete this task?')) return;

    const a = assignments.find((item) => item.id === assignmentId);
    if (!a) return;

    const updatedTasks = (a.tasks || []).filter((t) => t.id !== taskId);

    try {
      await updateStaffAssignment(a.id, { tasks: updatedTasks });

      setAssignments((prev) =>
        prev.map((item) => (item.id === a.id ? { ...item, tasks: updatedTasks } : item))
      );

      setToastMessage({ text: 'Task deleted', type: 'warn' });
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      alert(`Failed to delete task: ${err.message}`);
    }
  };

  return (
    <div className="staff-page-container">
      {/* Toast Notification banner at the top */}
      {toastMessage && <Toast message={toastMessage.text} type={toastMessage.type} />}

      {/* SECTION: Page Header and Add Task Action */}
      {/* FACULTY MAY ASK: How do you change the page heading or button title? */}
      {/* HOW TO CHANGE: Change "Task Board" in the page-title div, or "+ Add New Task" in the button below. */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <div className="page-title">Task Board</div>
          <div className="page-sub">Drag and drop tasks across columns to update their status</div>
        </div>

        {assignments.length > 0 && (
          <button
            className="btn btn-pink"
            onClick={() => setIsModalOpen(true)}
            style={{ marginBottom: '22px' }}
          >
            + Add New Task
          </button>
        )}
      </div>

      {/* SECTION: Error Banner (only displays if API fetch fails) */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--rs)', marginBottom: '16px', fontSize: '13px', color: '#fff' }}>
          {error}
        </div>
      )}

      {/* SECTION: Loading or Empty State */}
      {loading && assignments.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
          Loading tasks from accepted assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>No accepted assignments yet</div>
          <p style={{ fontSize: '12.5px', marginTop: '6px', color: 'var(--text3)' }}>
            Accept event assignments on the Assigned Events page to manage tasks here.
          </p>
        </div>
      ) : (
        /* SECTION: 3-Column Kanban Board */
        <div className="kanban">
          {/* COLUMN 1: TO DO */}
          {/* FACULTY MAY ASK: How do you change the title of the first column from "To Do" to "Pending"? */}
          {/* HOW TO CHANGE: Change text "To Do" inside the col-title div below. */}
          <div
            className={`kanban-col ${dragOverColumn === 'todo' ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'todo')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'todo')}
          >
            <div className="col-header">
              <div className="col-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                To Do
              </div>
              <span className="col-count">{columns.todo.length}</span>
            </div>

            {/* List of To-Do task cards */}
            <div className="task-list">
              {columns.todo.map((task) => (
                <div
                  key={task.id}
                  className="task-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                >
                  <div className="task-top">
                    <div className="task-event">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {task.eventName}
                    </div>
                    {/* Priority badge: red for High, orange for Medium, cyan for Low */}
                    <span
                      className={`priority-badge ${
                        task.priority === 'High' ? 'pri-high' : task.priority === 'Low' ? 'pri-low' : 'pri-medium'
                      }`}
                    >
                      {task.priority || 'Medium'}
                    </span>
                  </div>

                  <div className="task-name">{task.desc}</div>

                  <div className="task-meta">
                    <div className="task-meta-item">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Today
                    </div>
                    {/* Delete task button */}
                    <div
                      className="task-meta-item"
                      style={{ color: 'var(--pink)', cursor: 'pointer' }}
                      onClick={() => handleDeleteTask(task.assignmentId, task.id)}
                      title="Delete task"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 2: IN PROGRESS */}
          {/* FACULTY MAY ASK: How do you change the title of the middle column from "In Progress" to "Active"? */}
          {/* HOW TO CHANGE: Change text "In Progress" inside the col-title div below. */}
          <div
            className={`kanban-col ${dragOverColumn === 'progress' ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'progress')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'progress')}
          >
            <div className="col-header">
              <div className="col-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                In Progress
              </div>
              <span className="col-count">{columns.progress.length}</span>
            </div>

            {/* List of In-Progress task cards */}
            <div className="task-list">
              {columns.progress.map((task) => (
                <div
                  key={task.id}
                  className="task-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                >
                  <div className="task-top">
                    <div className="task-event">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {task.eventName}
                    </div>
                    <span
                      className={`priority-badge ${
                        task.priority === 'High' ? 'pri-high' : task.priority === 'Low' ? 'pri-low' : 'pri-medium'
                      }`}
                    >
                      {task.priority || 'Medium'}
                    </span>
                  </div>

                  <div className="task-name">{task.desc}</div>

                  <div className="task-meta">
                    <div className="task-meta-item">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      In Work
                    </div>
                    <div
                      className="task-meta-item"
                      style={{ color: 'var(--pink)', cursor: 'pointer' }}
                      onClick={() => handleDeleteTask(task.assignmentId, task.id)}
                      title="Delete task"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 3: DONE */}
          {/* FACULTY MAY ASK: How do you show completed tasks in green without strike-through? */}
          {/* HOW TO CHANGE: In the task-name div below, remove "textDecoration: 'line-through'". */}
          <div
            className={`kanban-col ${dragOverColumn === 'done' ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'done')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'done')}
          >
            <div className="col-header">
              <div className="col-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Done
              </div>
              <span className="col-count">{columns.done.length}</span>
            </div>

            {/* List of Completed task cards */}
            <div className="task-list">
              {columns.done.map((task) => (
                <div
                  key={task.id}
                  className="task-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                >
                  <div className="task-top">
                    <div className="task-event">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {task.eventName}
                    </div>
                    <span
                      className={`priority-badge ${
                        task.priority === 'High' ? 'pri-high' : task.priority === 'Low' ? 'pri-low' : 'pri-medium'
                      }`}
                    >
                      {task.priority || 'Medium'}
                    </span>
                  </div>

                  <div className="task-name" style={{ textDecoration: 'line-through', opacity: 0.8 }}>
                    {task.desc}
                  </div>

                  <div className="task-meta">
                    <div className="task-meta-item" style={{ color: 'var(--green)' }}>
                      ✓ Completed
                    </div>
                    <div
                      className="task-meta-item"
                      style={{ color: 'var(--pink)', cursor: 'pointer' }}
                      onClick={() => handleDeleteTask(task.assignmentId, task.id)}
                      title="Delete task"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Add Task Modal Popup */}
      {/* FACULTY MAY ASK: How do you close the modal when pressing the Escape key? */}
      {/* HOW TO CHANGE: Add a window keydown listener in useEffect that calls setIsModalOpen(false) when e.key === 'Escape'. */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add New Task</div>
            </div>

            <form onSubmit={handleCreateTask}>
              {/* Event selection dropdown */}
              <div className="form-group">
                <label>Select Accepted Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="form-select"
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.eventName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task description input */}
              <div className="form-group">
                <label>Task Description</label>
                <input
                  type="text"
                  placeholder="Enter task details..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>

              {/* Priority selection dropdown */}
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="form-select"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Modal action buttons */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   VIVA QUICK NOTES - TaskBoard.jsx
   ============================================================
   DATA FLOW:
   1. Backend API: GET /api/staff-assignments & GET /api/staff load assignments and staff info.
   2. Component State: Filtered to accepted assignments matching the staff member in 'assignments' state.
   3. Grouping: Tasks inside assignments are bucketed into columns { todo, progress, done }.
   4. Interaction: Dragging a card triggers handleDrop(), which updates 'assignments' locally and
      sends PATCH /api/staff-assignments/:id to persist the task status.
   5. Workload Sync: Completing a task updates staff workload capacity by -20% via PATCH /api/staff/:id.

   TOP 5 QUESTIONS FACULTY IS MOST LIKELY TO ASK:
   1. "Add a 4th column called 'Blocked' or 'Under Review'":
      -> Edit line with 'const columns = { todo: [], progress: [], done: [] };', add 'blocked: []',
         and duplicate one <div className="kanban-col"> in JSX with onDrop={(e) => handleDrop(e, 'blocked')}.
   2. "Disable dragging for completed tasks":
      -> In the 'Done' column task mapping, change draggable={true} to draggable={false}.
   3. "Change default priority in the modal to High":
      -> Edit line with 'const [taskPriority, setTaskPriority] = useState('Medium');' and change to 'High'.
   4. "Change the automatic 5-second polling interval":
      -> In useEffect(), edit line 'setInterval(loadData, 5000)' to change 5000 to another millisecond value.
   5. "How is workload updated when a task completes?":
      -> Point to handleDrop(): if newStatus === 'done', it calls updateStaffMember(id, { workload: wl - 20 }).
   ============================================================ */