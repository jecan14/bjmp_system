document.addEventListener('DOMContentLoaded', function() {
    loadOfficers();

    document.getElementById('addOfficerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');

        // Add password match validation before submitting
        if (password !== confirmPassword) {
            alert("Passwords do not match. Please try again.");
            return; // Stop the submission
        }

        fetch('add-officer.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Officer account created successfully!');
                // Close the modal on success
                const matchText = document.getElementById('matchText');
                if (matchText) {
                    matchText.textContent = '';
                    matchText.className = 'match-text';
                }
                document.getElementById('addOfficerModal').style.display = 'none';
                this.reset();
                loadOfficers();
            } else {
                alert(data.message || 'Error creating account');
            }
        })
        .catch(error => console.error('Error:', error));
    });
});

function loadOfficers() {
    fetch('get-officers.php')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('#officersTable tbody');
            tbody.innerHTML = '';
            
            if (data.success && data.officers.length > 0) {
                data.officers.forEach(officer => {
                    // Don't list admin accounts to prevent self-modification
                    if (officer.role === 'admin') return;

                    const row = document.createElement('tr');

                    // Determine status and badge
                    const isActive = officer.status === 'active';
                    const statusBadge = isActive 
                        ? '<span class="badge badge-success">Active</span>' 
                        : '<span class="badge badge-secondary">Inactive</span>';

                    // Determine button properties
                    const toggleBtnText = isActive ? 'Deactivate' : 'Activate';
                    const toggleBtnClass = isActive ? 'btn-warning' : 'btn-success';
                    const toggleBtnIcon = isActive ? '⏸️' : '▶️';
                    const currentStatus = officer.status || 'inactive';

                    row.innerHTML = `
                        <td>${officer.name}</td>
                        <td>${officer.username}</td>
                        <td>${officer.email}</td>
                        <td>${officer.contact_number}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-small ${toggleBtnClass}" onclick="toggleOfficerStatus(${officer.id}, '${currentStatus}')" title="${toggleBtnText}">
                                    ${toggleBtnIcon}
                                </button>
                                <button class="btn-icon" onclick="deleteOfficer(${officer.id})" style="color:red;" title="Delete">🗑️</button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="no-data">No officers found.</td></tr>';
            }
        });
}

function toggleOfficerStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'inactive' ? 'deactivate' : 'activate';

    if (confirm(`Are you sure you want to ${action} this officer account?`)) {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('status', newStatus);

        fetch('update-officer-status.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadOfficers(); // Refresh the list to show the new status
            } else {
                alert(data.message || `Error: Could not ${action} officer.`);
            }
        });
    }
}

/**
 * Toggles the visibility of a password field.
 * @param {string} inputId The ID of the password input field.
 */
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling; // Assumes icon is the next sibling in the HTML
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);

    const eyeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    const eyeOffIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

    // Change eye icon to give visual feedback
    if (icon) {
        icon.innerHTML = type === 'password' ? eyeIcon : eyeOffIcon;
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
    const password = document.getElementById('newOfficerPassword').value;
    const confirmPassword = document.getElementById('confirmOfficerPassword').value;
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
        matchText.className = 'match-text'; // Reset to default color
    }
}

function deleteOfficer(id) {
    if(confirm('Are you sure you want to delete this officer account?')) {
        const formData = new FormData();
        formData.append('id', id);
        
        fetch('delete-officer.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                loadOfficers();
            } else {
                alert(data.message || 'Error deleting officer');
            }
        });
    }
}