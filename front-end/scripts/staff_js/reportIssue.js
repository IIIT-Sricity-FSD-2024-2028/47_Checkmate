import { showToast } from './main.js';

export function initReportIssue() {
  const inputs = document.querySelectorAll('.form-input, .form-textarea, .form-select');
  inputs.forEach(el => {
     el.addEventListener('focus', () => {
         el.parentElement.style.opacity = '1';
     });
     el.addEventListener('blur', () => {
         el.parentElement.style.opacity = '0.9';
     });
  });
}

// Global scope
window.submitIssue = function() {
  const title = document.querySelector('.form-input').value.trim();
  const desc = document.querySelector('.form-textarea').value.trim();
  const selects = document.querySelectorAll('.form-select');
  
  if(!title) {
    showToast('Please enter an issue title.', 'error');
    return;
  }
  
  if(!desc) {
    showToast('Please provide a detailed description.', 'error');
    return;
  }
  
  if(selects[0].selectedIndex === 0 || selects[1].selectedIndex === 0) {
    showToast('Please select Priority and Category.', 'warning');
    return;
  }

  const randomId = 'ISS-' + Math.floor(1000 + Math.random() * 9000);
  
  showToast(`Issue ${randomId} submitted successfully!`, 'success');
  
  // Reset Form
  document.querySelector('.form-input').value = '';
  document.querySelector('.form-textarea').value = '';
  selects.forEach(s => s.selectedIndex = 0);
};
