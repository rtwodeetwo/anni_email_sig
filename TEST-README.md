# Testing Documentation

## Puppeteer Tests

This project includes automated tests using Puppeteer to verify the email signature generator functionality.

### Running Tests

```bash
npm install   # Install dependencies (first time only)
npm test      # Run all tests
```

### What Gets Tested

The test suite verifies:

1. **Form Field Order** - Confirms fields appear in the correct order matching the email signature output
2. **Form Input** - Tests that all form fields can be filled
3. **Email Signature Preview** - Verifies all entered data appears in the signature preview
4. **Pronouns Position** - Confirms pronouns appear between Office Phone and Email
5. **Zoom Background Canvas** - Checks that the canvas renders with content
6. **JavaScript Errors** - Monitors for console errors during execution
7. **UI Elements** - Verifies copy and download buttons exist
8. **Screenshot** - Captures a full-page screenshot for visual verification

### Test Results

All tests currently pass:
- ✅ Field order correct
- ✅ All fields present in signature
- ✅ Pronouns in correct position
- ✅ Zoom background canvas has content
- ✅ No JavaScript errors detected
- ✅ Copy button exists
- ✅ Download button exists

### Test Files

- `test-webpage.js` - Main Puppeteer test script
- `index-test.html` - Test version of the page (bypasses Firebase auth)
- `test-screenshot.png` - Screenshot output (generated during test run)

### Notes

- The test uses `index-test.html` which is a copy of `index.html` with authentication disabled
- Tests run in visible browser mode by default (set `headless: true` in test script for headless mode)
- A screenshot is saved to `test-screenshot.png` after tests complete
- The local server runs on port 8080 during tests
