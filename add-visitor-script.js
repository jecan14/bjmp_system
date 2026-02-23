// Load detainees into dropdown
function loadDetainees() {
    fetch('get-detainees.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.detainees) {
                const select = document.getElementById('detaineeId');
                select.innerHTML = '<option value="">Select Detainee</option>';
                
                data.detainees.forEach(detainee => {
                    const option = document.createElement('option');
                    option.value = detainee.id;
                    option.textContent = `${detainee.detainee_number} - ${detainee.first_name} ${detainee.last_name}`;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading detainees:', error);
            showAlert('Error loading detainees', 'error');
        });
}

// Set default date and time
function setDefaultDateTime() {
    const dateInput = document.getElementById('visitDate');
    const timeInput = document.getElementById('visitTime');
    
    if (dateInput) {
        const today = new Date();
        dateInput.value = today.toISOString().split('T')[0];
    }
    
    if (timeInput) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }
}

// Show alert message
function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Handle form submission
function handleSubmit(event) {
    event.preventDefault();
    
    const form = document.getElementById('addVisitorForm');
    const formData = new FormData(form);
    
    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    // Send to PHP
    fetch('add-visitor-process.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Visitor logged successfully!', 'success');
            
            // Reset form
            form.reset();
            setDefaultDateTime();
            
            // Redirect after 1 second
            setTimeout(() => {
                window.location.href = 'visitor-list.html';
            }, 1000);
        } else {
            showAlert(data.message || 'Error logging visitor', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = '✓ Log Visitor';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('An error occurred. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = '✓ Log Visitor';
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadDetainees();
    setDefaultDateTime();
    
    const form = document.getElementById('addVisitorForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});
