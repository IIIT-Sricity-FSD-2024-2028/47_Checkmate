const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('/home/mouli/FFSD1/47_Checkmate/front-end/pages/staff/AssignedEvents.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });

// We need to inject data.js before the scripts run, or mock DB.
dom.window.DB = {
  getSession: () => ({ user: 'Mouli Rd', email: 'moulird@gmail.com' }),
  getAll: (collection) => {
    if (collection === 'staff') {
      return [{ id: 'S005', name: 'Mouli Rd', email: 'moulird@gmail.com' }];
    }
    if (collection === 'staffAssignments') {
      return [{
        id: 'A001', staffId: 'S005', staffName: 'Mouli Rd', status: 'pending',
        priority: 'Medium', eventName: 'Test Event', eventDate: '2026-05-10',
        assignedAt: '2026-05-03T04:26:40.102Z'
      }];
    }
    return [];
  }
};

setTimeout(() => {
  // Dispatch DOMContentLoaded
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  setTimeout(() => {
    console.log("aeGrid innerHTML length:", dom.window.document.getElementById('aeGrid').innerHTML.length);
    console.log("aeGrid HTML:", dom.window.document.getElementById('aeGrid').innerHTML.substring(0, 100) + "...");
  }, 100);
}, 100);
