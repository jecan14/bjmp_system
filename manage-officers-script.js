document.addEventListener('DOMContentLoaded', function() {
    loadOfficers();

    document.getElementById('addOfficerForm').addEventListener('submit', function(e) {
    // Initialize password toggle icons to ensure they are visible on load.
    initializePasswordToggle('newOfficerPassword');
    initializePasswordToggle('confirmOfficerPassword');

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
                // Close the modal using the 'is-visible' class for consistency
                document.getElementById('addOfficerModal').classList.remove('is-visible');
                this.reset();
                loadOfficers();
            } else {
                alert(data.message || 'Error creating account');
            }
        })
        .catch(error => alert('An error occurred while adding the officer.'));
    });
});

function loadOfficers() {
    fetch('get-officers.php', { cache: 'no-cache' })
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
                    // Robust check: convert to string, trim, lowercase. Handles 'Active', 'active', '1', etc.
                    const statusStr = String(officer.status || '').trim().toLowerCase();
                    const isActive = statusStr === 'active' || statusStr === '1' || statusStr === 'true';
                    const statusBadge = isActive 
                        ? '<span class="badge badge-success">Active</span>' 
                        : '<span class="badge badge-secondary">Inactive</span>';

                    // Determine button properties
                    const toggleBtnText = isActive ? 'Deactivate' : 'Activate';
                    const toggleBtnClass = isActive ? 'btn-warning' : 'btn-success';
                    const deactivateIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor" style="vertical-align: middle;"><path d="M791-55 686-160H160v-112q0-34 17.5-62.5T224-378q45-23 91.5-37t94.5-21L55-791l57-57 736 736-57 57ZM240-240h366L486-360h-6q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm496-138q29 14 46 42.5t18 61.5L666-408q18 7 35.5 14t34.5 16ZM568-506l-59-59q23-9 37-29.5t14-45.5q0-33-23.5-56.5T480-720q-25 0-45.5 14T405-669l-59-59q23-34 58-53t76-19q66 0 113 47t47 113q0 41-19 76t-53 58Zm38 266H240h366ZM457-617Z"/></svg>`;
                    const activateIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor" style="vertical-align: middle;"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q62 0 126 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/></svg>`;
                    const toggleBtnIcon = isActive ? deactivateIcon : activateIcon;
                    const currentStatusForToggle = isActive ? 'active' : 'inactive';

                    row.innerHTML = `
                        <td>${officer.name}</td>
                        <td>${officer.username}</td>
                        <td>${officer.email}</td>
                        <td>${officer.contact_number}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-small ${toggleBtnClass}" onclick="toggleOfficerStatus(${officer.id}, '${currentStatusForToggle}')" title="${toggleBtnText}">
                                    ${toggleBtnIcon}
                                </button>
                                <button class="btn-icon btn-icon-danger" onclick="deleteOfficer(${officer.id})" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="no-data">No officers found.</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error loading officers:', error);
            const tbody = document.querySelector('#officersTable tbody');
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">Error loading data. Please check connection.</td></tr>';
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
                alert('Status updated successfully!'); // Give feedback
                loadOfficers(); // Refresh the list to show the new status
            } else {
                alert(data.message || `Error: Could not ${action} officer.`);
            }
        })
        .catch(error => {
            console.error('Error updating status:', error);
            alert(`An error occurred. Could not ${action} officer.`);
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
 * Initializes the password toggle icon to be visible when the page loads.
 * This prevents the icon from being invisible until the first click.
 * @param {string} inputId The ID of the password input field.
 */
function initializePasswordToggle(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const icon = input.nextElementSibling;
    if (icon && icon.innerHTML.trim() === '') {
        const eyeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        icon.innerHTML = eyeIcon;
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
        matchText.className = 'match-text match'; // Use 'match' class for success color
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