// PPPL Email Signature Generator - JavaScript

// DOM Elements
let formElements;
let previewElement;
let copyButton;
let copyStatus;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Cache DOM references
    formElements = {
        name: document.getElementById('name'),
        title: document.getElementById('title'),
        cell: document.getElementById('cell'),
        office: document.getElementById('office'),
        email: document.getElementById('email'),
        website: document.getElementById('website'),
        other: document.getElementById('other')
    };

    previewElement = document.getElementById('signature-preview');
    copyButton = document.getElementById('copy-btn');
    copyStatus = document.getElementById('copy-status');

    // Attach event listeners
    attachEventListeners();

    // Initial render
    updatePreview();
}

function attachEventListeners() {
    // Listen for input changes on all form fields
    Object.values(formElements).forEach(element => {
        element.addEventListener('input', debounce(updatePreview, 150));
    });

    // Copy button click
    copyButton.addEventListener('click', copySignature);
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
        contactLines += `<tr><td style="font-family: Arial, sans-serif; font-size: 13px; color: #405965; padding: 2px 0;">Cell: ${escapeHTML(data.cell)}</td></tr>`;
    }

    if (data.office) {
        contactLines += `<tr><td style="font-family: Arial, sans-serif; font-size: 13px; color: #405965; padding: 2px 0;">Office: ${escapeHTML(data.office)}</td></tr>`;
    }

    if (data.email) {
        contactLines += `<tr><td style="font-family: Arial, sans-serif; font-size: 13px; color: #405965; padding: 2px 0;"><a href="mailto:${escapeHTML(data.email)}" style="color: #c12d63; text-decoration: none;">${escapeHTML(data.email)}</a></td></tr>`;
    }

    if (data.website) {
        const websiteURL = data.website.startsWith('http') ? data.website : `https://${data.website}`;
        contactLines += `<tr><td style="font-family: Arial, sans-serif; font-size: 13px; color: #405965; padding: 2px 0;"><a href="${escapeHTML(websiteURL)}" style="color: #c12d63; text-decoration: none;">${escapeHTML(data.website)}</a></td></tr>`;
    }

    if (data.other) {
        contactLines += `<tr><td style="font-family: Arial, sans-serif; font-size: 12px; color: #577582; padding: 8px 0 2px 0; font-style: italic;">${escapeHTML(data.other)}</td></tr>`;
    }

    // Main signature template with table-based layout for email compatibility
    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4;">
    <tr>
        <td style="vertical-align: top; padding-right: 15px;">
            <img src="https://www.pppl.gov/sites/g/files/toruqf286/files/2025-12/75_anni_logo.png" alt="PPPL 75th Anniversary" width="70" height="73" style="display: block; border: 0;">
        </td>
        <td style="width: 3px; background-color: #f58025; vertical-align: top;"></td>
        <td style="vertical-align: top; padding-left: 15px;">
            <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #405965; padding-bottom: 2px;">
                        ${escapeHTML(data.name) || '<span style="color: #999;">Your Name</span>'}
                    </td>
                </tr>
                <tr>
                    <td style="font-family: Arial, sans-serif; font-size: 14px; color: #577582; padding-bottom: 2px;">
                        ${escapeHTML(data.title) || '<span style="color: #999;">Your Title</span>'}
                    </td>
                </tr>
                <tr>
                    <td style="font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #405965; padding-bottom: 8px;">
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
