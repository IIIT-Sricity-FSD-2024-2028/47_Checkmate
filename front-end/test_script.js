const fs = require('fs');
global.window = global;
global.localStorage = {
  getItem: (k) => {
    if (k === 'checkmate_session') {
      return JSON.stringify({
        token: 'session-U006-12345',
        user: { name: 'Mouli Rd', email: 'moulird@gmail.com', role: 'Staff' },
        role: 'staff'
      });
    }
    return null;
  }
};
global.XMLHttpRequest = class {
  open(m, u, a) { this.url = u; this.method = m; }
  setRequestHeader() {}
  send() {
    this.status = 200;
    if (this.url.endsWith('snapshot')) {
      this.responseText = JSON.stringify({
        staff: [{ id: 'S005', name: 'Mouli Rd', email: 'moulird@gmail.com' }],
        staffAssignments: [{ staffId: 'S005', staffName: 'Mouli Rd', status: 'pending', id: 'A001' }]
      });
    } else {
      this.responseText = 'null';
    }
  }
};
const dataJs = fs.readFileSync('/home/mouli/FFSD1/47_Checkmate/front-end/scripts/vendor_js/data.js', 'utf8');
eval(dataJs);

console.log("Session:", DB.getSession());
console.log("Staff:", DB.getAll('staff'));
let MY_NAME = DB.getSession().user;
let me = DB.getAll('staff').find(st => st.name === MY_NAME);
console.log("ME:", me);
console.log("Mine:", DB.getAll('staffAssignments').filter(a => a.staffId === me.id));
