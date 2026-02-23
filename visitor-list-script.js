let allVisitors = [];

// Load all visitors
function loadVisitors() {
    fetch('get-visitors.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.visitors) {
                allVisitors = data.visitors;
                displayVisitors(allVisitors);
            } else {
                showNoData();
            }
        })
        .catch(error => {
            console.error('Error loading visitors:', error);
            showNoData();
        });
}

// Load detainees for filter
function loadDetaineeFilter() {
    fetch('get-detainees.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.detainees) {
                const select = document.getElementById('detaineeFilter');
                data.detainees.forEach(detainee => {
                    const option = document.createElement('option');
                    option.value = detainee.id;
                    option.textContent = `${detainee.first_name} ${detainee.last_name}`;
                    select.appendChild(option);
                });
            }
        });
}

// Display visitors in table
function displayVisitors(visitors) {
    const tbody = document.querySelector('#visitorsTable tbody');
    tbody.innerHTML = '';
    
    document.getElementById('recordCount').textContent = visitors.length;
    
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
            <td>${visitor.visitor_contact}</td>
            <td>${visitor.detainee_name}</td>
            <td>${visitor.relationship}</td>
            <td>${formatTime(visitor.visit_time)}</td>
            <td>
                ${visitor.checkout_time 
                    ? `<span class="badge badge-success">${formatTime(visitor.checkout_time)}</span>` 
                    : '<span class="badge badge-inside">Inside</span>'}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="viewVisitor(${visitor.id})" title="View">👁️</button>
                    ${!visitor.checkout_time 
                        ? `<button class="btn-icon" onclick="checkoutVisitor(${visitor.id})" title="Check Out">🚪</button>` 
                        : ''}
                    <button class="btn-icon" onclick="deleteVisitor(${visitor.id})" title="Delete" style="color: #e74c3c;">🗑️</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Filter visitors
function filterVisitors() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const dateFilter = document.getElementById('dateFilter').value;
    const detaineeFilter = document.getElementById('detaineeFilter').value;
    
    let filtered = [...allVisitors];
    
    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(v => 
            v.visitor_name.toLowerCase().includes(searchTerm) ||
            v.visitor_contact.includes(searchTerm) ||
            (v.visitor_id_number && v.visitor_id_number.toLowerCase().includes(searchTerm))
        );
    }
    
    // Date filter
    if (dateFilter) {
        filtered = filtered.filter(v => v.visit_date === dateFilter);
    }
    
    // Detainee filter
    if (detaineeFilter) {
        filtered = filtered.filter(v => v.detainee_id == detaineeFilter);
    }
    
    displayVisitors(filtered);
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('dateFilter').value = '';
    document.getElementById('detaineeFilter').value = '';
    displayVisitors(allVisitors);
}

// Show no data message
function showNoData() {
    const tbody = document.querySelector('#visitorsTable tbody');
    tbody.innerHTML = '<tr><td colspan="8" class="no-data">No visitor records found.</td></tr>';
    document.getElementById('recordCount').textContent = '0';
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

// View visitor
function viewVisitor(id) {
    window.location.href = `view-visitor.html?id=${id}`;
}

// Checkout visitor
function checkoutVisitor(id) {
    if (confirm('Check out this visitor?')) {
        fetch('checkout-visitor.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `visitor_id=${id}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadVisitors();
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

// Delete visitor
function deleteVisitor(id) {
    if (confirm('Are you sure you want to delete this visitor log?')) {
        fetch('delete-visitor.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `visitor_id=${id}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadVisitors();
                alert('Visitor log deleted successfully!');
            } else {
                alert(data.message || 'Error deleting visitor log');
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            alert('Error deleting visitor log');
        });
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadVisitors();
    loadDetaineeFilter();
    
    // Add search on keyup
    document.getElementById('searchInput').addEventListener('keyup', filterVisitors);
    document.getElementById('dateFilter').addEventListener('change', filterVisitors);
    document.getElementById('detaineeFilter').addEventListener('change', filterVisitors);
});
