// Login attempts tracking
let loginAttempts = 0;
let lockoutTime = null;
let lockTimer = null;

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
}

// Check password strength
function checkPasswordStrength(password) {
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    
    strengthBar.className = 'strength-bar';
    strengthText.className = 'strength-text';
    
    if (password.length === 0) {
        strengthText.textContent = 'Enter password';
        return;
    }
    
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    if (strength <= 2) {
        strengthBar.classList.add('weak');
        strengthText.classList.add('weak');
        strengthText.textContent = 'Weak password';
    } else if (strength <= 4) {
        strengthBar.classList.add('medium');
        strengthText.classList.add('medium');
        strengthText.textContent = 'Medium password';
    } else {
        strengthBar.classList.add('strong');
        strengthText.classList.add('strong');
        strengthText.textContent = 'Strong password';
    }
}

// Check password match
function checkPasswordMatch() {
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const matchText = document.getElementById('matchText');
    
    if (confirmPassword.length === 0) {
        matchText.textContent = '';
        matchText.className = 'match-text';
        return;
    }
    
    if (password !== confirmPassword) {
        matchText.textContent = "Passwords don't match";
        matchText.className = 'match-text no-match';
    } else {
        matchText.textContent = 'Passwords match';
        matchText.className = 'match-text match';
    }
}

// Show registration form
function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

// Show login form
function showLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Show lock message
function showLockMessage() {
    const lockDiv = document.getElementById('lockMessage');
    lockDiv.style.display = 'block';
    document.getElementById('loginBtn').disabled = true;
    document.getElementById('login-username').disabled = true;
    document.getElementById('login-password').disabled = true;
}

// Hide lock message
function hideLockMessage() {
    const lockDiv = document.getElementById('lockMessage');
    lockDiv.style.display = 'none';
    document.getElementById('loginBtn').disabled = false;
    document.getElementById('login-username').disabled = false;
    document.getElementById('login-password').disabled = false;
}

// Start lock countdown timer
function startLockTimer() {
    let seconds = 30;
    const timerSpan = document.getElementById('lockTimer');
    
    lockTimer = setInterval(() => {
        seconds--;
        timerSpan.textContent = seconds;
        
        if (seconds <= 0) {
            clearInterval(lockTimer);
            lockoutTime = null;
            loginAttempts = 0;
            hideLockMessage();
        }
    }, 1000);
}

// Update attempts text
function updateAttemptsText(remaining) {
    const attemptsText = document.getElementById('attemptsText');
    if (remaining > 0) {
        attemptsText.textContent = `${remaining} attempt${remaining > 1 ? 's' : ''} remaining`;
        attemptsText.className = 'attempts-text warning';
    } else {
        attemptsText.textContent = '';
    }
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    // Check if locked
    if (lockoutTime && new Date() < lockoutTime) {
        showLockMessage();
        return;
    }
    
    const formData = new FormData(event.target);
    
    // Send login request to PHP
    fetch('login-process.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Successful login - redirect based on role
            if (data.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Failed login
            if (data.locked) {
                // Account locked
                lockoutTime = new Date(Date.now() + 30000); // 30 seconds
                loginAttempts = 3;
                showLockMessage();
                startLockTimer();
            } else {
                // Increment attempts
                loginAttempts = data.attempts || loginAttempts + 1;
                const remaining = 3 - loginAttempts;
                
                if (loginAttempts >= 3) {
                    lockoutTime = new Date(Date.now() + 30000);
                    showLockMessage();
                    startLockTimer();
                } else {
                    showError(data.message || 'Invalid credentials');
                    updateAttemptsText(remaining);
                }
            }
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showError('An error occurred. Please try again.');
    });
}

// Handle registration form submission
function handleRegistration(event) {
    event.preventDefault();
    
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    // Validate password match
    if (password !== confirmPassword) {
        showError("Passwords don't match");
        return;
    }
    
    // Validate password strength
    if (password.length < 8) {
        showError('Password must be at least 8 characters long');
        return;
    }
    
    const formData = new FormData(event.target);
    
    // Send registration request to PHP
    fetch('register-process.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Account created successfully! Please login.');
            showLogin();
        } else {
            showError(data.message || 'Registration failed');
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showError('An error occurred. Please try again.');
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Registration form
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
});
