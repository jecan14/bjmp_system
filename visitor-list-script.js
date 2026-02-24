// Function to show alert messages
function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    if (!container) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Function to fetch and display visitors
async function fetchVisitors() {
    const searchInput = document.getElementById('searchInput').value;
    const dateFilter = document.getElementById('dateFilter').value;
    const visitorsTableBody = document.querySelector('#visitorsTable tbody');
    const recordCountSpan = document.getElementById('recordCount');

    visitorsTableBody.innerHTML = '<tr><td colspan="8" class="no-data">Loading...</td></tr>';
    recordCountSpan.textContent = '0';

    let url = `get-visitors.php?search=${encodeURIComponent(searchInput)}&date=${encodeURIComponent(dateFilter)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            visitorsTableBody.innerHTML = ''; // Clear loading message
            recordCountSpan.textContent = data.visitors.length;

            if (data.visitors.length === 0) {
                visitorsTableBody.innerHTML = '<tr><td colspan="8" class="no-data">No visitor records found.</td></tr>';
                return;
            }

            data.visitors.forEach(visitor => {
                const row = visitorsTableBody.insertRow();
                const isCheckedOut = visitor.checkout_time !== null;
                if (!isCheckedOut) {
                    row.classList.add('visitor-inside-row'); // Highlight if still inside
                }

                const detaineeFullName = `${visitor.detainee_first_name} ${visitor.detainee_last_name}`;
                const checkinTime = new Date(`2000-01-01T${visitor.visit_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const checkoutTime = isCheckedOut ? new Date(`2000-01-01T${visitor.checkout_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '<span class="badge badge-warning">Still Inside</span>';

                row.innerHTML = `
                    <td>${new Date(visitor.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>${visitor.visitor_name}</td>
                    <td>${visitor.visitor_contact}</td>
                    <td>${detaineeFullName}</td>
                    <td>${visitor.relationship}</td>
                    <td>${checkinTime}</td>
                    <td>${checkoutTime}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon view-btn" data-id="${visitor.id}" title="View Details">👁️</button>
                            ${!isCheckedOut ? `<button class="btn-icon checkout-btn" data-id="${visitor.id}" title="Check Out">🚪</button>` : ''}
                        </div>
                    </td>
                `;
            });

            // Add event listeners for action buttons
            visitorsTableBody.querySelectorAll('.view-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const visitorId = event.currentTarget.dataset.id;
                    window.location.href = `view-visitor.html?id=${visitorId}`;
                });
            });

            visitorsTableBody.querySelectorAll('.checkout-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const visitorId = event.currentTarget.dataset.id;
                    if (confirm('Are you sure you want to check out this visitor?')) {
                        checkoutVisitor(visitorId);
                    }
                });
            });

        } else {
            visitorsTableBody.innerHTML = `<tr><td colspan="8" class="no-data">${data.message || 'Error loading visitors.'}</td></tr>`;
            showAlert(data.message || 'Error loading visitors.', 'error');
        }
    } catch (error) {
        console.error('Error fetching visitors:', error);
        visitorsTableBody.innerHTML = '<tr><td colspan="8" class="no-data">An error occurred while fetching data.</td></tr>';
        showAlert('An error occurred while fetching visitors.', 'error');
    }
}

// Function to filter visitors (called by button click)
function filterVisitors() {
    fetchVisitors();
}

// Function to clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('dateFilter').value = '';
    fetchVisitors();
}

// Function to handle visitor checkout
async function checkoutVisitor(visitorId) {
    try {
        const response = await fetch('checkout-visitor.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `visitor_id=${visitorId}`
        });
        const data = await response.json();

        if (data.success) {
            showAlert('Visitor checked out successfully!', 'success');
            fetchVisitors(); // Refresh the list
        } else {
            showAlert(data.message || 'Error checking out visitor.', 'error');
        }
    } catch (error) {
        console.error('Error checking out visitor:', error);
        showAlert('An error occurred during checkout.', 'error');
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    fetchVisitors();
});