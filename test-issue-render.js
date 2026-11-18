const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'front-end/pages/admin/issue-tracking.html'), 'utf8');

// evaluate the script block
const scriptMatch = html.match(/<script>\s*document\.addEventListener\('DOMContentLoaded', \(\) => \{([\s\S]*?)\}\);\s*<\/script>/);
if (scriptMatch) {
  let script = scriptMatch[1];
  // Mock DOM and API
  script = `
    const window = { CHECKMATE_API_BASE: 'http://localhost:3000/api', lucide: { createIcons: () => {} } };
    const lucide = window.lucide; // the page calls the global lucide.createIcons()
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
      this.status = 200;
      // The fake response is chosen in send(), after open() has set the url
      // (it used to read this.url in the constructor, where it is still undefined)
      this.send = function() {
        this.responseText = this.url && this.url.includes('/issues')
          ? JSON.stringify([{ id: '1', target: 'admin', priority: 'High', role: 'Vendor' }])
          : '[]';
      };
    };
    
    ${script}
    
    console.log("Script executed successfully without syntax errors");
  `;
  try {
    eval(script);
    // The page starts a refresh timer; stop here so the test ends with a result
    process.exit(0);
  } catch (e) {
    console.error("Error executing script:", e);
    process.exit(1);
  }
} else {
  console.log("No script found");
}
