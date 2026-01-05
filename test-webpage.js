const puppeteer = require('puppeteer');
const http = require('http');
const httpServer = require('http-server');
const path = require('path');

// Test configuration
const PORT = 8080;
const BASE_URL = `http://localhost:${PORT}`;

// Start local server
function startServer() {
    return new Promise((resolve) => {
        const server = httpServer.createServer({
            root: __dirname,
            cache: -1
        });
        server.listen(PORT, () => {
            console.log(`Server started on ${BASE_URL}`);
            resolve(server);
        });
    });
}

async function runTests() {
    let server;
    let browser;

    try {
        // Start server
        server = await startServer();

        // Launch browser
        console.log('\nLaunching browser...');
        browser = await puppeteer.launch({
            headless: false, // Set to true for CI/CD
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Navigate to test page (bypasses auth)
        console.log(`\nNavigating to ${BASE_URL}/index-test.html...`);
        await page.goto(`${BASE_URL}/index-test.html`, { waitUntil: 'networkidle0' });

        // Check if login screen is shown
        const loginScreen = await page.$('#login-screen');
        const loginVisible = await page.evaluate(el => {
            return el && window.getComputedStyle(el).display !== 'none';
        }, loginScreen);

        if (loginVisible) {
            console.log('\n⚠️  Login screen detected. Authentication required to test the form.');
            console.log('Please sign in manually in the browser window...');
            console.log('Waiting 60 seconds for manual authentication...\n');

            // Wait for app content to appear (user logs in manually)
            await page.waitForSelector('#app-content[style*="display: block"]', {
                timeout: 60000
            }).catch(() => {
                console.log('❌ Authentication timeout. Unable to proceed with tests.');
                throw new Error('Authentication required');
            });

            console.log('✅ Authentication successful!\n');
        }

        // Wait for form to be ready
        await page.waitForSelector('#signature-form');
        console.log('✅ Page loaded successfully\n');

        // Test 1: Check form field order
        console.log('Test 1: Checking form field order...');
        const fieldOrder = await page.evaluate(() => {
            const form = document.getElementById('signature-form');
            const inputs = form.querySelectorAll('input:not([disabled]), textarea');
            return Array.from(inputs).map(input => input.id);
        });

        const expectedOrder = ['name', 'title', 'cell', 'office', 'pronouns', 'email', 'website', 'other'];
        const orderMatch = JSON.stringify(fieldOrder) === JSON.stringify(expectedOrder);

        console.log(`Expected order: ${expectedOrder.join(', ')}`);
        console.log(`Actual order:   ${fieldOrder.join(', ')}`);
        console.log(orderMatch ? '✅ Field order correct\n' : '❌ Field order incorrect\n');

        // Test 2: Fill in form fields
        console.log('Test 2: Filling in form fields...');
        await page.type('#name', 'Dr. Jane Smith');
        await page.type('#title', 'Principal Research Physicist');
        await page.type('#cell', '(609) 555-1234');
        await page.type('#office', '(609) 243-2000');
        await page.type('#pronouns', 'she/her');
        await page.type('#email', 'jsmith@pppl.gov');
        await page.type('#website', 'https://www.pppl.gov');
        await page.type('#other', 'Schedule a meeting: calendly.com/jsmith');
        console.log('✅ Form fields filled\n');

        // Wait for preview to update (debounced)
        await new Promise(resolve => setTimeout(resolve, 200));

        // Test 3: Verify email signature preview content
        console.log('Test 3: Checking email signature preview...');
        const signatureContent = await page.evaluate(() => {
            const preview = document.getElementById('signature-preview');
            return preview.innerText;
        });

        const requiredFields = ['Dr. Jane Smith', 'Principal Research Physicist',
                                'Princeton Plasma Physics Laboratory', 'Cell: (609) 555-1234',
                                'Office: (609) 243-2000', 'Pronouns: she/her',
                                'jsmith@pppl.gov'];

        const allFieldsPresent = requiredFields.every(field => signatureContent.includes(field));
        console.log('Signature preview content:');
        console.log(signatureContent);
        console.log(allFieldsPresent ? '✅ All fields present in signature\n' : '❌ Some fields missing\n');

        // Test 4: Verify pronouns position in signature
        console.log('Test 4: Checking pronouns position in signature...');
        const pronounsAfterOffice = signatureContent.indexOf('Pronouns: she/her') >
                                     signatureContent.indexOf('Office: (609) 243-2000');
        const pronounsBeforeEmail = signatureContent.indexOf('Pronouns: she/her') <
                                    signatureContent.indexOf('jsmith@pppl.gov');

        console.log(`Pronouns after Office: ${pronounsAfterOffice ? '✅' : '❌'}`);
        console.log(`Pronouns before Email: ${pronounsBeforeEmail ? '✅' : '❌'}`);
        console.log((pronounsAfterOffice && pronounsBeforeEmail) ?
                    '✅ Pronouns in correct position\n' : '❌ Pronouns position incorrect\n');

        // Test 5: Check Zoom background canvas
        console.log('Test 5: Checking Zoom background canvas...');
        const canvasExists = await page.$('#zoom-canvas');
        const canvasData = await page.evaluate(() => {
            const canvas = document.getElementById('zoom-canvas');
            if (!canvas) return null;

            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Check if canvas has any non-transparent pixels
            let hasContent = false;
            for (let i = 3; i < imageData.data.length; i += 4) {
                if (imageData.data[i] !== 0) {
                    hasContent = true;
                    break;
                }
            }

            return {
                width: canvas.width,
                height: canvas.height,
                hasContent
            };
        });

        console.log(`Canvas dimensions: ${canvasData.width}x${canvasData.height}`);
        console.log(canvasData.hasContent ?
                    '✅ Zoom background canvas has content\n' :
                    '⚠️  Zoom background canvas is empty (image may still be loading)\n');

        // Test 6: Check for console errors
        console.log('Test 6: Checking for JavaScript errors...');
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        // Wait a moment to catch any delayed errors
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (errors.length === 0) {
            console.log('✅ No JavaScript errors detected\n');
        } else {
            console.log('❌ JavaScript errors found:');
            errors.forEach(err => console.log(`  - ${err}`));
            console.log('');
        }

        // Test 7: Test copy button (without actually copying)
        console.log('Test 7: Testing copy button...');
        const copyButtonExists = await page.$('#copy-btn');
        const copyButtonText = await page.evaluate(() => {
            const btn = document.getElementById('copy-btn');
            return btn ? btn.textContent : null;
        });
        console.log(`Copy button text: "${copyButtonText}"`);
        console.log(copyButtonExists ? '✅ Copy button exists\n' : '❌ Copy button missing\n');

        // Test 8: Test download button
        console.log('Test 8: Testing download button...');
        const downloadButtonExists = await page.$('#download-zoom-btn');
        const downloadButtonText = await page.evaluate(() => {
            const btn = document.getElementById('download-zoom-btn');
            return btn ? btn.textContent : null;
        });
        console.log(`Download button text: "${downloadButtonText}"`);
        console.log(downloadButtonExists ? '✅ Download button exists\n' : '❌ Download button missing\n');

        // Take screenshot
        console.log('Taking screenshot...');
        await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
        console.log('✅ Screenshot saved as test-screenshot.png\n');

        console.log('=================================');
        console.log('All tests completed!');
        console.log('=================================\n');

    } catch (error) {
        console.error('\n❌ Test failed with error:');
        console.error(error);
        process.exit(1);
    } finally {
        // Cleanup
        if (browser) {
            console.log('Closing browser...');
            await browser.close();
        }
        if (server) {
            console.log('Stopping server...');
            server.close();
        }
    }
}

// Run tests
runTests().then(() => {
    console.log('Tests finished successfully!');
    process.exit(0);
}).catch(error => {
    console.error('Tests failed:', error);
    process.exit(1);
});
