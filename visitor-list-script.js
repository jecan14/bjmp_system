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

    // Determine if we are on the admin page or officer page
    const isAdminPage = window.location.pathname.includes('visitor-list.html');

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
                const isCheckedOut = visitor.checkout_time && visitor.checkout_time !== '00:00:00' && visitor.checkout_time !== '';
                if (!isCheckedOut) {
                    row.classList.add('visitor-inside-row'); // Highlight if still inside
                }

                const detaineeFullName = `${visitor.detainee_first_name} ${visitor.detainee_last_name}`;
                const checkinTime = new Date(`2000-01-01T${visitor.visit_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const checkoutTime = isCheckedOut ? new Date(`2000-01-01T${visitor.checkout_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '<span class="badge badge-inside">Active</span>';

                // Conditionally build action buttons based on the page
                let actionButtonsHTML = `<button class="btn-icon view-btn" data-id="${visitor.id}" title="View Details">👁️</button>`;
                if (!isAdminPage && !isCheckedOut) {
                    actionButtonsHTML += ` <button class="btn-icon checkout-btn" data-id="${visitor.id}" title="Check Out"><img src="images/checkout.jpg" alt="Check Out" style="width: 20px; height: 20px; vertical-align: middle;"></button>`;
                }

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
                            ${actionButtonsHTML}
                        </div>
                    </td>
                `;
            });

            // Add event listeners for action buttons
            visitorsTableBody.querySelectorAll('.view-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const visitorId = event.currentTarget.dataset.id;
                    const sourceParam = isAdminPage ? '&source=admin' : '';
                    window.location.href = `view-visitor.html?id=${visitorId}${sourceParam}`;
                });
            });

            // Only add checkout listeners on the officer page
            if (!isAdminPage) {
                visitorsTableBody.querySelectorAll('.checkout-btn').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const visitorId = event.currentTarget.dataset.id;
                        if (confirm('Are you sure you want to check out this visitor?')) {
                            checkoutVisitor(visitorId);
                        }
                    });
                });
            }

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

// Function to format time to AM/PM (from today-visitors-script.js)
function formatTime(timeString) {
    if (!timeString || !timeString.includes(':')) return 'Invalid Time';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Function to fetch Today's Visitors specifically for the top table
async function fetchTodayVisitors() {
    const todayTableBody = document.querySelector('#todayTable tbody');
    if (!todayTableBody) return;

    // FIX: Use local date instead of UTC to ensure we get today's records correctly
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    try {
        const response = await fetch(`get-visitors.php?date=${today}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.success) {
            todayTableBody.innerHTML = '';
            let insideCount = 0;

            if (data.visitors.length === 0) {
                todayTableBody.innerHTML = '<tr><td colspan="4" class="no-data">No visitors today yet.</td></tr>';
            } else {
                data.visitors.forEach(v => {
                    const isInside = !v.checkout_time || v.checkout_time === '00:00:00' || v.checkout_time === '';
                    if (isInside) insideCount++;
                    
                    const row = document.createElement('tr');
                    if (isInside) row.classList.add('visitor-inside-row');

                    const timeIn = formatTime(v.visit_time);
                    const detaineeName = (`${v.detainee_first_name || ''} ${v.detainee_last_name || ''}`).trim() || 'N/A';

                    row.innerHTML = `
                        <td>${timeIn}</td>
                        <td><strong>${v.visitor_name}</strong></td>
                        <td>${detaineeName}</td>
                        <td>${!isInside ? '<span class="badge badge-success">Checked Out</span>' : '<span class="badge badge-inside">Inside</span>'}</td>
                    `;
                    todayTableBody.appendChild(row);
                });
            }

            // Update inside count display from Today's data (most accurate)
            const insideCountElement = document.getElementById('insideCount');
            if (insideCountElement) {
                insideCountElement.textContent = insideCount;
            }
        } else {
            // Handle case where fetch was successful but API returned an error
            todayTableBody.innerHTML = `<tr><td colspan="4" class="no-data">${data.message || "Error loading today's visitors."}</td></tr>`;
            showAlert(data.message || "Could not load today's visitors.", 'error');
        }
    } catch (error) {
        console.error("Error fetching today's visitors:", error);
        todayTableBody.innerHTML = '<tr><td colspan="4" class="no-data">Error loading data.</td></tr>';
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

function confirmCheckout(visitorId) {
    if (confirm('Are you sure you want to check out this visitor?')) {
        checkoutVisitor(visitorId);
    }
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
            fetchTodayVisitors(); // Refresh today's list
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
    fetchTodayVisitors();
});