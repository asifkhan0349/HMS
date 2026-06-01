import puppeteer from 'puppeteer';

const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

(async () => {
    // Generate a unique license plate to avoid DB duplicate constraint errors
    const uniqueId = Math.floor(1000 + Math.random() * 9000);
    const vehicleLicense = `AMB-E2E-${uniqueId}`;
    
    console.log(`[*] Launching browser for Ambulance Completed Trips E2E UI Test (License: ${vehicleLicense})...`);
    
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log("[*] Navigating to Login page...");
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
        
        // Wait for inputs
        await page.waitForSelector('input[type="text"]');
        
        // Fill credentials
        const inputs = await page.$$('input');
        await inputs[0].type('admin_hms');
        await inputs[1].type('ham33dSh@ika7m1n4m5');
        
        // Click submit
        const button = await page.$('button[type="submit"]');
        await button.click();
        
        console.log("[+] Submitted admin credentials. Waiting for login navigation...");
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log("[+] Login successful.");

        // Navigating to Ambulance Service
        console.log("[*] Navigating to Ambulance Service Dashboard...");
        await page.goto('http://localhost:5173/ambulance-service', { waitUntil: 'networkidle0' });
        await delay(2000); // Allow data fetch to finish

        // 1. REGISTER VEHICLE
        console.log("[*] UI Action: Registering Vehicle...");
        const buttons = await page.$$('button');
        let registerBtn;
        for (let btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Register Vehicle')) {
                registerBtn = btn;
                break;
            }
        }
        if (!registerBtn) {
            throw new Error("Could not find 'Register Vehicle' button");
        }
        await registerBtn.click();
        
        // Wait for register modal
        await page.waitForSelector('#reg-license', { visible: true });
        
        // Fill registration form
        await page.type('#reg-license', vehicleLicense);
        await page.select('#reg-type', 'ALS');
        await page.select('#reg-status', 'Available');
        await page.type('#reg-driver', 'Trip Driver');
        await page.type('#reg-contact', '555-8888');
        await page.type('#reg-paramedic', 'Trip Paramedic');
        await page.type('#reg-checklist', 'Trauma Kit, Oxygen');
        
        // Submit registration
        const regSubmit = await page.$('form button[type="submit"]');
        await regSubmit.click();
        console.log("[+] Registration form submitted.");
        
        await delay(2000);

        // Verify it exists in the table
        let pageSourceBeforeDispatch = await page.content();
        if (pageSourceBeforeDispatch.includes(vehicleLicense)) {
            console.log(`[+] Vehicle ${vehicleLicense} registered successfully and visible in table.`);
        } else {
            throw new Error(`Vehicle ${vehicleLicense} not found in fleet table after registration`);
        }

        // 2. DISPATCH VEHICLE
        console.log("[*] UI Action: Dispatching Vehicle...");
        await page.type('input[placeholder*="Search fleet"]', vehicleLicense);
        await delay(1000);

        const dispatchButtons = await page.$$('button');
        let dispatchBtn;
        for (let btn of dispatchButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Dispatch')) {
                dispatchBtn = btn;
                break;
            }
        }
        if (!dispatchBtn) {
            throw new Error("Could not find Dispatch button for the vehicle");
        }
        await dispatchBtn.click();

        // Wait for dispatch modal
        await page.waitForSelector('#disp-patient', { visible: true });
        
        // Fill dispatch details
        const patientName = `Patient-${uniqueId}`;
        const destinationAddr = `${uniqueId} Rescue Lane`;
        await page.type('#disp-patient', patientName);
        await page.type('#disp-dest', destinationAddr);
        
        // Submit dispatch by text selector
        const dispatchModalButtons = await page.$$('button');
        let confirmDispatchBtn;
        for (let btn of dispatchModalButtons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Confirm Dispatch')) {
                confirmDispatchBtn = btn;
                break;
            }
        }
        if (!confirmDispatchBtn) {
            throw new Error("Could not find 'Confirm Dispatch' button");
        }
        await confirmDispatchBtn.click();
        console.log("[+] Dispatch form submitted.");
        await delay(2000);

        // 3. COMPLETE TRIP
        console.log("[*] UI Action: Completing Trip...");
        // Clear search
        await page.click('input[placeholder*="Search fleet"]', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await delay(1000);

        // Find the card containing our vehicle license and click its Complete Trip button
        await page.evaluate((licNum) => {
            const cards = Array.from(document.querySelectorAll('.ambulance-service-page .col-lg-5 .rounded-3'));
            const targetCard = cards.find(card => card.textContent.includes(licNum));
            if (targetCard) {
                const completeBtn = targetCard.querySelector('button');
                if (completeBtn) {
                    completeBtn.click();
                } else {
                    throw new Error("Complete Trip button not found inside target card");
                }
            } else {
                throw new Error("Active trip card containing license " + licNum + " not found");
            }
        }, vehicleLicense);

        console.log("[+] Complete Trip button clicked.");
        await delay(2000);

        // 4. VERIFY COMPLETED TRIP LOG
        console.log("[*] Verifying trip is logged in the Completed Trips panel...");
        let pageSource = await page.content();
        if (pageSource.includes('Completed Trips Log') && pageSource.includes(patientName) && pageSource.includes(destinationAddr)) {
            console.log(`[+] SUCCESS: Completed trip is logged and visible in 'Completed Trips Log' with patient: ${patientName}!`);
        } else {
            throw new Error("Completed trip log was NOT found in the 'Completed Trips Log' panel!");
        }

        // 5. VERIFY PERSISTENCE AFTER REFRESH
        console.log("[*] Reloading the page to test persistence...");
        await page.reload({ waitUntil: 'networkidle0' });
        await delay(2000);

        let refreshedSource = await page.content();
        if (refreshedSource.includes('Completed Trips Log') && refreshedSource.includes(patientName) && refreshedSource.includes(destinationAddr)) {
            console.log("[+] SUCCESS: Completed trip is still present in 'Completed Trips Log' after page reload!");
        } else {
            throw new Error("Completed trip log disappeared after page reload!");
        }

        // 6. CLEANUP
        console.log("[*] Cleaning up E2E vehicle...");
        await page.type('input[placeholder*="Search fleet"]', vehicleLicense);
        await delay(1000);

        const deleteBtn = await page.$('button[title="Delete Vehicle"]');
        if (!deleteBtn) {
            throw new Error("Could not find Delete Vehicle button");
        }
        await deleteBtn.click();
        await delay(500);

        const confirmDeleteBtn = await page.$('button.btn-danger');
        if (confirmDeleteBtn) await confirmDeleteBtn.click();
        console.log("[+] E2E vehicle deleted.");
        await delay(2000);

        console.log("\n[SUCCESS] E2E Trip Logging UI Verification complete!");

    } catch (err) {
        console.error("\n[FAIL] UI Verification Error:", err);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
