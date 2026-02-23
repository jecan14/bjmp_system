// Check if user is logged in
function checkSession() {
    fetch('session-check.php')
        .then(response => response.json())
        .then(data => {
            if (!data.logged_in) {
                window.location.href = 'login.html';
            } else {
                // Update user info
                document.getElementById('officerName').textContent = data.name;
                document.getElementById('officerEmail').textContent = data.email;
                
                // Load dashboard data
                loadDashboardStats();
                loadRecentLogs();
            }
        })
        .catch(error => {
            console.error('Session check error:', error);
            window.location.href = 'login.html';
        });
}

// Load dashboard statistics
function loadDashboardStats() {
    fetch('get-dashboard-stats.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('todayVisitors').textContent = data.today_visitors || 0;
                document.getElementById('activeDetainees').textContent = data.active_detainees || 0;
                document.getElementById('myLogs').textContent = data.my_logs || 0;
                document.getElementById('currentlyInside').textContent = data.currently_inside || 0;
            }
        })
        .catch(error => {
            console.error('Error loading stats:', error);
        });
}

// Load recent visitor logs
function loadRecentLogs() {
    fetch('get-recent-visitors.php?limit=5')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.visitors) {
                displayRecentLogs(data.visitors);
            } else {
                showNoData();
            }
        })
        .catch(error => {
            console.error('Error loading recent logs:', error);
            showNoData();
        });
}

// Display recent logs in table
function displayRecentLogs(visitors) {
    const tbody = document.querySelector('#recentLogsTable tbody');
    tbody.innerHTML = '';
    
    if (visitors.length === 0) {
        showNoData();
        return;
    }
    
    visitors.forEach(visitor => {
        const row = document.createElement('tr');
        
        // Add GREEN highlight if visitor is still inside
        if (!visitor.checkout_time) {
            row.classList.add('visitor-inside-row');
        }
        
        row.innerHTML = `
            <td>${formatDate(visitor.visit_date)}</td>
            <td><strong>${visitor.visitor_name}</strong></td>
            <td>${visitor.detainee_name}</td>
            <td>${formatTime(visitor.visit_time)}</td>
            <td>
                ${visitor.checkout_time 
                    ? `<span class="badge badge-success">Checked Out</span>` 
                    : `<span class="badge badge-inside">Inside</span>`}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="viewVisitor(${visitor.id})" title="View Details">👁️</button>
                    ${!visitor.checkout_time 
                        ? `<button class="btn-icon" onclick="checkoutVisitor(${visitor.id})" title="Check Out">🚪</button>` 
                        : ''}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Show no data message
function showNoData() {
    const tbody = document.querySelector('#recentLogsTable tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="no-data">No visitor logs yet. <a href="add-visitor.html">Log your first visitor!</a></td></tr>';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format time
function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// View visitor details
function viewVisitor(id) {
    window.location.href = `view-visitor.html?id=${id}`;
}

// Checkout visitor
function checkoutVisitor(id) {
    if (confirm('Check out this visitor?')) {
        fetch('checkout-visitor.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `visitor_id=${id}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reload dashboard
                loadDashboardStats();
                loadRecentLogs();
                alert('Visitor checked out successfully!');
            } else {
                alert(data.message || 'Error checking out visitor');
            }
        })
        .catch(error => {
            console.error('Checkout error:', error);
            alert('Error checking out visitor');
        });
    }
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
});
