const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err));
  
  // Set up local storage to mock login
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.setItem('eventpro_session', JSON.stringify({
      user: 'John',
      name: 'John',
      email: 'john@example.com',
      role: 'vendor',
      id: 'V001'
    }));
  });
  
  await page.goto('http://localhost:3000/front-end/pages/vendor/monitoring.html');
  await new Promise(r => setTimeout(r, 4000));
  
  console.log('Risks HTML:', await page.evaluate(() => {
    const list = document.querySelector('.mon-risk-list');
    return list ? list.innerHTML : 'List not found';
  }));
  
  await browser.close();
})();
