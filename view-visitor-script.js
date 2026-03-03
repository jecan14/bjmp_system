// Function to show alert messages
function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    if (!container) {
        // If alertContainer is not present, create one or log to console
        console.warn('Alert container not found. Message:', message, 'Type:', type);
        return;
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Function to fetch and display visitor details
async function fetchVisitorDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const visitorId = urlParams.get('id');
    const source = urlParams.get('source');

    const visitorDetailsDiv = document.getElementById('visitorDetails');
    const checkoutSection = document.getElementById('checkoutSection');

    if (!visitorId) {
        visitorDetailsDiv.innerHTML = '<p>No visitor ID provided.</p>';
        showAlert('No visitor ID provided.', 'error');
        return;
    }

    visitorDetailsDiv.innerHTML = '<p>Loading visitor details...</p>';

    // Added for debugging. Check your browser's console (F12) to see this message.
    console.log('Running view-visitor-script.js version 1.6');

    try {
        const response = await fetch(`get-visitor-details.php?id=${visitorId}`);
        const data = await response.json();

        if (data.success && data.visitor) {
            const visitor = data.visitor;
            const detaineeFullName = `${visitor.detainee_first_name} ${visitor.detainee_middle_name ? visitor.detainee_middle_name + ' ' : ''}${visitor.detainee_last_name}`;
            const checkinTime = new Date(`2000-01-01T${visitor.visit_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isCheckedOut = visitor.checkout_time && visitor.checkout_time !== '00:00:00' && visitor.checkout_time !== '';
            
            let checkoutDisplay;
            if (isCheckedOut) {
                const time = new Date(`2000-01-01T${visitor.checkout_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                checkoutDisplay = `${time} <span class="badge badge-success">Checked Out</span>`;
            } else {
                checkoutDisplay = `<span class="badge badge-inside">Active</span>`;
            }

            visitorDetailsDiv.innerHTML = `
                <div class="detail-item">
                    <label>Visitor Name</label>
                    <p><strong>${visitor.visitor_name}</strong></p>
                </div>
                <div class="detail-item">
                    <label>ID Number</label>
                    <p>${visitor.visitor_id_number || 'N/A'}</p>
                </div>
                <div class="detail-item">
                    <label>Contact Number</label>
                    <p>${visitor.visitor_contact}</p>
                </div>
                <div class="detail-item">
                    <label>Relationship</label>
                    <p>${visitor.relationship}</p>
                </div>
                <div class="detail-item">
                    <label>Visiting Detainee</label>
                    <p><strong>${detaineeFullName}</strong><br>
                    <small>Detainee No. ${visitor.detainee_number || 'N/A'}</small></p>
                </div>
                <div class="detail-item">
                    <label>Visit Date</label>
                    <p>${new Date(visitor.visit_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div class="detail-item">
                    <label>Check-in Time</label>
                    <p>${checkinTime}</p>
                </div>
                <div class="detail-item">
                    <label>Check-out Time</label>
                    <p>${checkoutDisplay}</p>
                </div>
                <div class="detail-item full-width">
                    <label>Logged By</label>
                    <p>${visitor.officer_name || 'N/A'}<br>
                    <small>${new Date(visitor.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ${new Date(visitor.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></p>
                </div>
                ${visitor.notes ? `<div class="detail-item full-width"><label>Notes / Remarks</label><p>${visitor.notes}</p></div>` : ''}
            `;

            // Show checkout button if not checked out and not an admin viewing
            if (!isCheckedOut && source !== 'admin') {
                checkoutSection.innerHTML = `
                    <button type="button" class="btn btn-primary" id="checkoutBtn">🚪 Check Out Visitor</button>
                `;
                document.getElementById('checkoutBtn').addEventListener('click', () => {
                    if (confirm('Are you sure you want to check out this visitor?')) {
                        checkoutVisitor(visitorId);
                    }
                });
            } else {
                checkoutSection.innerHTML = ''; // Clear checkout button if already checked out or if admin
            }

        } else {
            visitorDetailsDiv.innerHTML = `<p>${data.message || 'Error loading visitor details.'}</p>`;
            showAlert(data.message || 'Error loading visitor details.', 'error');
        }
    } catch (error) {
        console.error('Error fetching visitor details:', error);
        visitorDetailsDiv.innerHTML = '<p>An error occurred while fetching data.</p>';
        showAlert('An error occurred while fetching visitor details.', 'error');
    }
}

// Function to handle visitor checkout (from view page)
async function checkoutVisitor(visitorId) {
    // This function is duplicated from visitor-list-script.js, consider refactoring to a shared utility
    try {
        const response = await fetch('checkout-visitor.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `visitor_id=${visitorId}`
        });
        const data = await response.json();

        if (data.success) {
            showAlert('Visitor checked out successfully!', 'success');
            fetchVisitorDetails(); // Refresh details to update status
        } else {
            showAlert(data.message || 'Error checking out visitor.', 'error');
        }
    } catch (error) {
        console.error('Error checking out visitor:', error);
        showAlert('An error occurred during checkout.', 'error');
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', fetchVisitorDetails);