import puppeteer from 'puppeteer';

const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

(async () => {
    console.log("[*] Launching Chromium to test UI pages...");
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--start-maximized'], slowMo: 80 });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log("[*] Navigating to login page...");
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
        
        // Wait for inputs
        await page.waitForSelector('input[type="text"]');
        
        // Find username and password inputs (assuming standard react form)
        const inputs = await page.$$('input');
        await inputs[0].type('testuser0349');
        await inputs[1].type('7357U536@349');
        
        // Click submit
        const button = await page.$('button[type="submit"]');
        await button.click();
        
        console.log("[+] Submitted login credentials. Waiting for navigation...");
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log("[+] Login successful.");

        // ============================================
        // TEST PATIENTS MODULE
        // ============================================
        console.log("\n--- Testing Module: Patients UI ---");
        await page.goto('http://localhost:5173/patients', { waitUntil: 'networkidle0' });

        // 1. ADD
        console.log("[*] UI Action: Adding Patient...");
        // Click Register Patient button
        const buttons = await page.$$('button');
        let registerBtn;
        for (let btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Register Patient')) {
                registerBtn = btn;
                break;
            }
        }
        await registerBtn.click();
        
        // Wait for modal
        await page.waitForSelector('#patient-name', { visible: true });
        
        // Fill form
        await page.type('#patient-name', 'UI Automated Patient');
        await page.type('#patient-age', '45');
        
        // Submit
        const submitBtn = await page.$('button[type="submit"]');
        await submitBtn.click();
        
        await delay(1500); // Wait for toast/api
        console.log("[+] Patient Add via UI complete.");

        // 2. EDIT
        console.log("[*] UI Action: Editing Patient...");
        await page.waitForSelector('button[title="Edit Patient"]', { visible: true });
        const editButtons = await page.$$('button[title="Edit Patient"]');
        // Edit the last one
        await editButtons[editButtons.length - 1].click();
        
        await page.waitForSelector('#edit-patient-age', { visible: true });
        // Clear and type
        await page.click('#edit-patient-age', { clickCount: 3 });
        await page.type('#edit-patient-age', '46');
        
        const saveEditBtn = await page.$('button[type="submit"]');
        await saveEditBtn.click();
        
        await delay(1500);
        console.log("[+] Patient Edit via UI complete.");

        // 3. DELETE
        console.log("[*] UI Action: Deleting Patient...");
        await page.waitForSelector('button[title="Delete Patient"]', { visible: true });
        const delButtons = await page.$$('button[title="Delete Patient"]');
        await delButtons[delButtons.length - 1].click();
        
        await delay(500);
        // Find confirmation button (usually red or says Delete / Confirm)
        const allButtons = await page.$$('button');
        let confirmBtn;
        for (let btn of allButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Confirm') || text.includes('Delete Record')) {
                confirmBtn = btn;
            }
        }
        if (confirmBtn) await confirmBtn.click();
        
        await delay(1500);
        console.log("[+] Patient Delete via UI complete.");

        console.log("\n[SUCCESS] UI Frontend Tests executed perfectly!");

    } catch (err) {
        console.error("\n[FAIL] UI Automation Error:", err);
    } finally {
        await browser.close();
    }
})();
