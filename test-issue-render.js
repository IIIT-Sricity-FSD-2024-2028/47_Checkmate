const fs = require('fs');
const html = fs.readFileSync('/home/mouli/FFSD1/47_Checkmate/front-end/pages/admin/issue-tracking.html', 'utf8');

// evaluate the script block
const scriptMatch = html.match(/<script>\s*document\.addEventListener\('DOMContentLoaded', \(\) => \{([\s\S]*?)\}\);\s*<\/script>/);
if (scriptMatch) {
  let script = scriptMatch[1];
  // Mock DOM and API
  script = `
    const window = { CHECKMATE_API_BASE: 'http://localhost:3000/api', lucide: { createIcons: () => {} } };
    const sessionStorage = { getItem: () => null };
    const localStorage = { getItem: () => null };
    
    // Mock elements
    const document = {
      getElementById: (id) => {
        return {
          innerHTML: '',
          appendChild: () => {},
          addEventListener: () => {}
        };
      },
      createElement: () => ({ innerHTML: '' })
    };
    
    const XMLHttpRequest = function() {
      this.open = function(method, url) { this.url = url; };
      this.setRequestHeader = function() {};
      this.send = function() {};
      this.status = 200;
      if (this.url.includes('/issues')) {
        this.responseText = JSON.stringify([{ id: '1', target: 'admin', priority: 'High', role: 'Vendor' }]);
      } else {
        this.responseText = '[]';
      }
    };
    
    ${script}
    
    console.log("Script executed successfully without syntax errors");
  `;
  try {
    eval(script);
  } catch (e) {
    console.error("Error executing script:", e);
  }
} else {
  console.log("No script found");
}
