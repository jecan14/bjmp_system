// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
}

let loginAttempts = 0;
let lockoutTime = null;

function handleLogin(event) {
    event.preventDefault();
    
    // Check if locked
    if (lockoutTime && new Date() < lockoutTime) {
        showLockMessage();
        return;
    }
    
    // Attempt login via PHP
    const formData = new FormData(event.target);
    
    fetch('login-process.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Redirect based on role
            window.location.href = data.role === 'admin' 
                ? 'admin-dashboard.html' 
                : 'dashboard.html';
        } else {
            loginAttempts++;
            
            if (loginAttempts >= 3) {
                lockAccount();
            } else {
                showError(`Invalid credentials. ${3 - loginAttempts} attempts remaining.`);
            }
        }
    });
}

function lockAccount() {
    lockoutTime = new Date(Date.now() + 30000); // 30 seconds
    showLockMessage();
    startLockTimer();
}


// Check password strength
function checkPasswordStrength(password) {
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    
    // Remove previous classes
    strengthBar.className = 'strength-bar';
    strengthText.className = 'strength-text';
    
    if (password.length === 0) {
        strengthText.textContent = 'Enter password';
        return;
    }
    
    let strength = 0;
    
    // Check password length
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Check for lowercase letters
    if (/[a-z]/.test(password)) strength += 1;
    
    // Check for uppercase letters
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Check for numbers
    if (/[0-9]/.test(password)) strength += 1;
    
    // Check for special characters
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    // Determine strength level
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

// Form validation
document.addEventListener('DOMContentLoaded', function() {
    // Login form submission
    const loginForm = document.querySelector('#loginForm form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            if (username && password) {
                alert('Login functionality will be implemented with Laravel backend');
                // This is where you'll add Laravel integration later
                // For now, it's just a placeholder
            }
        });
    }
    
    // Registration form submission
    const registerForm = document.querySelector('#registerForm form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const accountType = document.getElementById('reg-account-type').value;
            const name = document.getElementById('reg-name').value;
            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const number = document.getElementById('reg-number').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            
            // Validate all fields are filled
            if (!accountType || !name || !username || !email || !number || !password || !confirmPassword) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Validate password match
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            // Validate password strength
            if (password.length < 8) {
                alert('Password must be at least 8 characters long');
                return;
            }
            
            alert('Account creation functionality will be implemented with Laravel backend');
            // This is where you'll add Laravel integration later
            // For now, it's just a placeholder
        });
    }
});
