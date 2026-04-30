/* ═══════════════════════════════════════════
   create_event_client.js  —  Client Event Form
   • Validates inputs
   • Saves new event to shared DB (data.js)
     so vendors see it in Event Request page
   • Redirects to My Events on success
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // Cancel button
    const cancelBtn = document.querySelector('.btn-ghost');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            // Only intercept if it's the cancel button (not other ghost btns)
            if (cancelBtn.textContent.trim() === 'Cancel') {
                e.preventDefault();
                window.location.href = 'client-dashboard.html';
            }
        });
    }

    // Form & inputs
    const form = document.getElementById('create-event-form');
    if (!form) return;

    const inputs = form.querySelectorAll('input[required], select[required]');

    // Validate a single input
    const validateInput = (input) => {
        let isValid = true;
        const errorMsg = input.parentElement.querySelector('.error-msg');

        if (input.hasAttribute('required')) {
            if (input.multiple) {
                if (input.selectedOptions.length === 0) isValid = false;
            } else if (!input.value.trim()) {
                isValid = false;
            }
        }

        if (!isValid) {
            input.classList.add('input-error');
            if (errorMsg) errorMsg.style.display = 'block';
        } else {
            input.classList.remove('input-error');
            if (errorMsg) errorMsg.style.display = 'none';
        }

        return isValid;
    };

    // Live validation
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.classList.contains('input-error')) validateInput(input);
        });
        input.addEventListener('blur', () => {
            if (input.value.trim() !== '') validateInput(input);
        });
    });

    // Generate unique event ID
    function generateId() {
        const existing = typeof DB !== 'undefined' ? DB.getAll('events') : [];
        const maxNum = existing.reduce((max, ev) => {
            const num = parseInt((ev.id || '').replace(/\D/g, ''), 10) || 0;
            return Math.max(max, num);
        }, 0);
        return `EVT${String(maxNum + 1).padStart(3, '0')}`;
    }

    // Format time to display (e.g. 09:00 → 9:00 AM)
    function fmtTime(t) {
        if (!t) return '09:00';
        const [h, m] = t.split(':').map(Number);
        const suffix = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
    }

    // Form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        let formIsValid = true;
        inputs.forEach(input => {
            if (!validateInput(input)) formIsValid = false;
        });

        if (!formIsValid) {
            const firstError = form.querySelector('.input-error');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Collect values
        const name    = document.getElementById('fieldEventName')?.value.trim()  || 'New Event';
        const type    = document.getElementById('fieldEventType')?.value          || 'Conference';
        const date    = document.getElementById('fieldEventDate')?.value          || '';
        const time    = document.getElementById('fieldEventTime')?.value          || '09:00';
        const venue   = document.getElementById('fieldVenue')?.value.trim()       || 'TBD';
        const people  = parseInt(document.getElementById('fieldPeople')?.value, 10) || 0;
        const notes   = form.querySelector('textarea')?.value.trim()              || '';

        // Build event object matching data.js schema
        const newEvent = {
            id:         generateId(),
            name:       name,
            type:       type,
            date:       date,
            time:       fmtTime(time),
            venue:      venue,
            people:     people,
            status:     'pending',
            notes:      notes,
            createdBy:  'client',   // tag so client's My Events can filter
            submittedAt: new Date().toISOString(),
        };

        // Save to shared DB
        if (typeof DB !== 'undefined') {
            DB.add('events', newEvent);
        } else {
            console.warn('DB not loaded — event not persisted.');
        }

        // UI success feedback
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalContent = submitBtn.innerHTML;

        submitBtn.innerHTML = '<i class="ph ph-spinner-gap ph-spin"></i> Submitting...';
        submitBtn.style.opacity = '0.8';
        submitBtn.style.pointerEvents = 'none';

        setTimeout(() => {
            submitBtn.innerHTML = '<i class="ph ph-check-circle"></i> Success!';
            submitBtn.style.background = 'var(--green-solid, #22c55e)';
            submitBtn.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.4)';

            setTimeout(() => {
                form.reset();
                submitBtn.innerHTML = originalContent;
                submitBtn.style.background = '';
                submitBtn.style.boxShadow = '';
                submitBtn.style.opacity = '1';
                submitBtn.style.pointerEvents = 'all';

                // Go to My Events so the user sees their new event
                window.location.href = 'client_myevents.html';
            }, 1800);

        }, 1200);
    });

    // Phosphor spin animation
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes ph-spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(359deg); }
        }
        .ph-spin { animation: ph-spin 1s linear infinite; }
    `;
    document.head.appendChild(style);
});
