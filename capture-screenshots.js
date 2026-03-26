import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const routes = [
    { name: '01_Dashboard', path: '/' },
    { name: '02_Patients', path: '/patients' },
    { name: '03_Appointments', path: '/appointments' },
    { name: '04_EMR', path: '/emr' },
    { name: '05_Billing', path: '/billing' },
    { name: '06_Pharmacy', path: '/pharmacy' },
    { name: '07_Lab', path: '/lab' },
    { name: '08_Beds', path: '/beds' },
    { name: '09_Staff', path: '/staff' },
    { name: '10_Reports', path: '/reports' },
    { name: '11_Inventory', path: '/inventory' },
    { name: '12_BloodBank', path: '/bloodbank' }
];

async function capture() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Navigating to signup...');
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle0' });

    // Fill signup form
    console.log('Signing up...');
    try {
        await page.type('input[placeholder="Jane Admin"]', 'Doc Admin');
        await page.type('input[placeholder="name@hospital.com"]', 'admin' + Date.now() + '@hms.com');
        await page.type('input[placeholder="Enter your username"]', 'admin_' + Date.now());
        await page.type('input[placeholder="********"]', 'password123');
        // Type confirm password
        const confirmInputs = await page.$$('input[placeholder="Confirm password"]');
        if (confirmInputs.length > 0) {
            await confirmInputs[0].type('password123');
        }
        await page.select('select', 'Admin');
        await page.click('button[type="submit"]');
        
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log('Logged in successfully!');
    } catch (e) {
        console.log('Signup failed or already logged in, attempting login...');
    }

    // Capture each page
    for (const route of routes) {
        console.log(`Capturing ${route.name}...`);
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle0' });
        // Wait for some time for animations/charts to load
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ 
            path: path.join(SCREENSHOT_DIR, `${route.name}.png`),
            fullPage: false 
        });
    }

    await browser.close();
    console.log('All screenshots captured!');
}

capture().catch(console.error);
