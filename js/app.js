// PPPL Email Signature Generator - JavaScript

// DOM Elements
let formElements;
let previewElement;
let copyButton;
let copyStatus;
let zoomCanvas;
let zoomDownloadButton;
let zoomStatus;
let zoomBackgroundImage;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Cache DOM references
    formElements = {
        name: document.getElementById('name'),
        title: document.getElementById('title'),
        pronouns: document.getElementById('pronouns'),
        cell: document.getElementById('cell'),
        office: document.getElementById('office'),
        email: document.getElementById('email'),
        website: document.getElementById('website'),
        other: document.getElementById('other')
    };

    previewElement = document.getElementById('signature-preview');
    copyButton = document.getElementById('copy-btn');
    copyStatus = document.getElementById('copy-status');

    zoomCanvas = document.getElementById('zoom-canvas');
    zoomDownloadButton = document.getElementById('download-zoom-btn');
    zoomStatus = document.getElementById('zoom-status');

    // Load Zoom background image
    zoomBackgroundImage = new Image();
    zoomBackgroundImage.crossOrigin = 'anonymous';
    zoomBackgroundImage.src = 'images/75th_anniversary-Zoom_bg-2.jpg';
    zoomBackgroundImage.onload = () => {
        updateZoomBackground();
    };

    // Attach event listeners
    attachEventListeners();

    // Initial render
    updatePreview();
}

function attachEventListeners() {
    // Listen for input changes on all form fields
    Object.values(formElements).forEach(element => {
        element.addEventListener('input', debounce(() => {
            updatePreview();
            updateZoomBackground();
        }, 150));
    });

    // Copy button click
    copyButton.addEventListener('click', copySignature);

    // Zoom download button click
    zoomDownloadButton.addEventListener('click', downloadZoomBackground);
}

// Debounce utility to prevent excessive updates
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function updatePreview() {
    const data = getFormData();
    const signatureHTML = generateSignatureHTML(data);
    previewElement.innerHTML = signatureHTML;
}

function getFormData() {
    return {
        name: formElements.name.value.trim(),
        title: formElements.title.value.trim(),
        organization: 'Princeton Plasma Physics Laboratory',
        cell: formElements.cell.value.trim(),
        office: formElements.office.value.trim(),
        email: formElements.email.value.trim(),
        website: formElements.website.value.trim(),
        other: formElements.other.value.trim()
    };
}

function generateSignatureHTML(data) {
    // Build contact info lines conditionally
    let contactLines = '';

    if (data.cell) {
        contactLines += `<tr><td style="font-family: 'Roboto Condensed', sans-serif; font-size: 16px; color: #405965; padding: 4px 0;">Cell: ${escapeHTML(data.cell)}</td></tr>`;
    }

    if (data.office) {
        contactLines += `<tr><td style="font-family: 'Roboto Condensed', sans-serif; font-size: 16px; color: #405965; padding: 4px 0;">Office: ${escapeHTML(data.office)}</td></tr>`;
    }

    if (data.email) {
        contactLines += `<tr><td style="font-family: 'Roboto Condensed', sans-serif; font-size: 16px; color: #405965; padding: 4px 0;"><a href="mailto:${escapeHTML(data.email)}" style="color: #405965; text-decoration: none;">${escapeHTML(data.email)}</a></td></tr>`;
    }

    if (data.website) {
        const websiteURL = data.website.startsWith('http') ? data.website : `https://${data.website}`;
        contactLines += `<tr><td style="font-family: 'Roboto Condensed', sans-serif; font-size: 16px; color: #405965; padding: 4px 0;"><a href="${escapeHTML(websiteURL)}" style="color: #405965; text-decoration: none;">${escapeHTML(data.website)}</a></td></tr>`;
    }

    if (data.other) {
        contactLines += `<tr><td style="font-family: 'Roboto Condensed', sans-serif; font-size: 16px; color: #405965; padding: 4px 0;">${escapeHTML(data.other)}</td></tr>`;
    }

    // Main signature template with table-based layout for email compatibility
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Roboto Condensed', sans-serif; font-size: 16px; line-height: 1.4;">
    <tr>
        <td style="vertical-align: top; padding-right: 15px;">
            <img src="https://www.pppl.gov/sites/g/files/toruqf286/files/styles/medium/public/2026-01/75_anni_logo.png" alt="PPPL 75th Anniversary" style="display: block; border: 0;">
        </td>
        <td style="width: 3px; background-color: #f58025; vertical-align: top;"></td>
        <td style="vertical-align: top; padding-left: 15px;">
            <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="font-family: 'Roboto Condensed', sans-serif; font-size: 16px; font-weight: bold; color: #405965; padding: 4px 0;">
                        ${escapeHTML(data.name) || '<span style="color: #999;">Your Name</span>'}
                    </td>
                </tr>
                <tr>
                    <td style="font-family: 'Roboto Condensed', sans-serif; font-size: 16px; color: #405965; padding: 4px 0;">
                        ${escapeHTML(data.title) || '<span style="color: #999;">Your Title</span>'}
                    </td>
                </tr>
                <tr>
                    <td style="font-family: 'Roboto Condensed', sans-serif; font-size: 16px; color: #405965; padding: 4px 0;">
                        ${escapeHTML(data.organization)}
                    </td>
                </tr>
                ${contactLines}
            </table>
        </td>
    </tr>
</table>
    `.trim();
}

// HTML escape utility for security
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function copySignature() {
    const data = getFormData();

    // Validate required fields
    if (!data.name || !data.title) {
        showCopyStatus('Please fill in Name and Job Title', 'error');
        return;
    }

    const signatureHTML = generateSignatureHTML(data);

    try {
        // Use Clipboard API with HTML MIME type for rich text
        await navigator.clipboard.write([
            new ClipboardItem({
                'text/html': new Blob([signatureHTML], { type: 'text/html' }),
                'text/plain': new Blob([getPlainTextSignature(data)], { type: 'text/plain' })
            })
        ]);
        showCopyStatus('Signature copied! Paste it in your email settings.', 'success');
    } catch (err) {
        // Fallback for browsers without ClipboardItem support
        fallbackCopy(signatureHTML);
    }
}

// Fallback copy method using execCommand
function fallbackCopy(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const range = document.createRange();
    range.selectNodeContents(container);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    try {
        document.execCommand('copy');
        showCopyStatus('Signature copied! Paste it in your email settings.', 'success');
    } catch (err) {
        showCopyStatus('Copy failed. Please select and copy manually.', 'error');
    }

    selection.removeAllRanges();
    document.body.removeChild(container);
}

// Plain text fallback for clipboard
function getPlainTextSignature(data) {
    let text = `${data.name}\n${data.title}\n${data.organization}\n`;
    if (data.cell) text += `Cell: ${data.cell}\n`;
    if (data.office) text += `Office: ${data.office}\n`;
    if (data.email) text += `${data.email}\n`;
    if (data.website) text += `${data.website}\n`;
    if (data.other) text += `\n${data.other}`;
    return text.trim();
}

// Status message display
function showCopyStatus(message, type) {
    copyStatus.textContent = message;
    copyStatus.className = `copy-status ${type}`;

    // Clear after 4 seconds
    setTimeout(() => {
        copyStatus.textContent = '';
        copyStatus.className = 'copy-status';
    }, 4000);
}

// ================================
// Zoom Background Functions
// ================================

function updateZoomBackground() {
    if (!zoomBackgroundImage.complete) return;

    const ctx = zoomCanvas.getContext('2d');
    const canvasWidth = zoomCanvas.width;
    const canvasHeight = zoomCanvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw background image
    ctx.drawImage(zoomBackgroundImage, 0, 0, canvasWidth, canvasHeight);

    // Get name and pronouns
    const name = formElements.name.value.trim();
    const pronouns = formElements.pronouns.value.trim();

    if (!name) return;

    // Parse name into first and last
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Set text properties
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Draw orange bar
    const barX = 20;
    const barY = 40;
    const barWidth = 6;
    const barHeight = 180;
    ctx.fillStyle = '#f58025';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Text positioning
    const textX = barX + barWidth + 20;
    const textY = barY;

    // Font sizes: first line larger, second line smaller to fit within bar
    const firstLineFontSize = 120;
    const secondLineFontSize = 60;

    if (pronouns) {
        // If pronouns provided: first+last name on line 1, pronouns on line 2
        const fullName = name;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${firstLineFontSize}px "Roboto Condensed", sans-serif`;
        ctx.fillText(fullName, textX, textY);

        // Pronouns on second line
        ctx.font = `bold ${secondLineFontSize}px "Roboto Condensed", sans-serif`;
        ctx.fillText(pronouns, textX, textY + firstLineFontSize + 5);
    } else {
        // No pronouns: first name on line 1, last name on line 2
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${firstLineFontSize}px "Roboto Condensed", sans-serif`;
        ctx.fillText(firstName, textX, textY);

        if (lastName) {
            ctx.font = `bold ${secondLineFontSize}px "Roboto Condensed", sans-serif`;
            ctx.fillText(lastName, textX, textY + firstLineFontSize + 5);
        }
    }
}

function downloadZoomBackground() {
    const name = formElements.name.value.trim();

    if (!name) {
        showZoomStatus('Please enter your name first', 'error');
        return;
    }

    try {
        // Convert canvas to blob and download
        zoomCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `PPPL-75th-Zoom-Background-${name.replace(/\s+/g, '-')}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showZoomStatus('Zoom background downloaded!', 'success');
        }, 'image/jpeg', 0.95);
    } catch (err) {
        showZoomStatus('Download failed. Please try again.', 'error');
    }
}

function showZoomStatus(message, type) {
    zoomStatus.textContent = message;
    zoomStatus.className = `copy-status ${type}`;

    // Clear after 4 seconds
    setTimeout(() => {
        zoomStatus.textContent = '';
        zoomStatus.className = 'copy-status';
    }, 4000);
}
