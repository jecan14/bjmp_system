document.addEventListener('DOMContentLoaded', function() {
    // Password change form
    const passwordForm = document.getElementById('changePasswordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handleChangePassword);
    }

    // Clear logs button
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', handleClearLogs);
    }

    // Initialize password toggles
    initializePasswordToggles();
});

function showAlert(message, type = 'success', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);

    setTimeout(() => {
        alert.style.transition = 'opacity 0.3s ease';
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

function handleChangePassword(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_password');

    if (newPassword !== confirmPassword) {
        showAlert('New passwords do not match.', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    fetch('update-admin-password.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message, 'success');
            form.reset();
            // Manually clear the indicators after form reset
            checkPasswordStrength('');
            checkPasswordMatch();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('An error occurred. Please try again.', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Password';
    });
}

function handleClearLogs() {
    if (!confirm('Are you sure you want to permanently delete all system activity logs? This action cannot be undone.')) {
        return;
    }

    const btn = document.getElementById('clearLogsBtn');
    btn.disabled = true;
    btn.textContent = 'Clearing...';

    fetch('clear-logs.php', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message, 'success', 'systemActionsAlertContainer');
        } else {
            showAlert(data.message, 'error', 'systemActionsAlertContainer');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('An error occurred while clearing logs.', 'error', 'systemActionsAlertContainer');
    })
    .finally(() => {
        btn.disabled = false;
        btn.textContent = 'Clear Activity Logs';
    });
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling;
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);

    const eyeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    const eyeOffIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

    if (icon) {
        icon.innerHTML = type === 'password' ? eyeIcon : eyeOffIcon;
    }
}

function initializePasswordToggles() {
    const eyeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    document.querySelectorAll('.toggle-password').forEach(icon => {
        if (icon.innerHTML.trim() === '') {
            icon.innerHTML = eyeIcon;
        }
    });
}

/**
 * Checks the strength of a password and updates the UI.
 * @param {string} password The password string to check.
 */
function checkPasswordStrength(password) {
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    if (!strengthBar || !strengthText) return;

    // Reset if no password
    if (!password) {
        strengthBar.className = 'strength-bar';
        strengthText.textContent = '';
        return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    // Update UI based on strength score
    strengthBar.className = 'strength-bar'; // Reset classes
    strengthText.className = 'strength-text'; // Reset classes

    if (strength <= 2) {
        strengthBar.classList.add('weak');
        strengthText.textContent = 'Weak';
    } else if (strength <= 4) {
        strengthBar.classList.add('medium');
        strengthText.textContent = 'Medium';
    } else {
        strengthBar.classList.add('strong');
        strengthText.textContent = 'Strong';
    }
}

/**
 * Checks if the two password fields match and updates the UI.
 */
function checkPasswordMatch() {
    const password = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const matchText = document.getElementById('matchText');

    if (!matchText) return;

    if (confirmPassword.length === 0) {
        matchText.textContent = '';
        matchText.className = 'match-text';
        return;
    }

    if (password !== confirmPassword) {
        matchText.textContent = "Passwords do not match";
        matchText.className = 'match-text no-match';
    } else {
        matchText.textContent = 'Passwords match';
        matchText.className = 'match-text match';
    }
}

/**
 * Checks the strength of a password and updates the UI.
 * @param {string} password The password string to check.
 */
function checkPasswordStrength(password) {
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    // Reset if no password
    if (!password) {
        strengthBar.className = 'strength-bar';
        strengthText.textContent = '';
        return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    // Update UI based on strength score
    strengthBar.className = 'strength-bar'; // Reset classes
    strengthText.className = 'strength-text'; // Reset classes

    if (strength <= 2) {
        strengthBar.classList.add('weak');
        strengthText.textContent = 'Weak';
    } else if (strength <= 4) {
        strengthBar.classList.add('medium');
        strengthText.textContent = 'Medium';
    } else {
        strengthBar.classList.add('strong');
        strengthText.textContent = 'Strong';
    }
}

/**
 * Checks if the two password fields match and updates the UI.
 */
function checkPasswordMatch() {
    const password = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const matchText = document.getElementById('matchText');

    if (confirmPassword.length === 0) {
        matchText.textContent = '';
        matchText.className = 'match-text';
        return;
    }

    if (password !== confirmPassword) {
        matchText.textContent = "Passwords do not match";
        matchText.className = 'match-text no-match';
    } else {
        matchText.textContent = 'Passwords match';
        matchText.className = 'match-text match';
    }
}