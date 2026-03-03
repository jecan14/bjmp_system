document.addEventListener('DOMContentLoaded', function() {
    loadVisitorReport();
    loadActivityLogs();
});

function loadVisitorReport() {
    const tableBody = document.querySelector('#visitorReportTable tbody');
    tableBody.innerHTML = '<tr><td colspan="6" class="no-data">Loading...</td></tr>';

    fetch('get-visitors.php') // This endpoint should fetch all visitors with joins
        .then(response => response.json())
        .then(data => {
            if (data.success && data.visitors.length > 0) {
                tableBody.innerHTML = '';
                data.visitors.slice(0, 15).forEach(v => { // Show latest 15 for this report
                    const row = tableBody.insertRow();
                    const timeIn = (v.visit_time && v.visit_time !== '00:00:00') ? new Date(`1970-01-01T${v.visit_time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                    const timeOut = (v.checkout_time && v.checkout_time !== '00:00:00') 
                        ? new Date(`1970-01-01T${v.checkout_time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
                        : 'N/A';
                    
                    row.innerHTML = `
                        <td>${new Date(v.visit_date).toLocaleDateString()}</td>
                        <td>${v.visitor_name || 'N/A'}</td>
                        <td>${v.detainee_first_name || ''} ${v.detainee_last_name || ''}</td>
                        <td>${v.officer_name || 'N/A'}</td>
                        <td>${timeIn}</td>
                        <td>${timeOut}</td>
                    `;
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No visitor logs found.</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error loading visitor report:', error);
            tableBody.innerHTML = '<tr><td colspan="6" class="no-data">Error loading data.</td></tr>';
        });
}

function loadActivityLogs() {
    const tableBody = document.querySelector('#activityLogTable tbody');
    tableBody.innerHTML = '<tr><td colspan="4" class="no-data">Loading...</td></tr>';

    fetch('get-system-logs.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.logs.length > 0) {
                tableBody.innerHTML = '';
                data.logs.forEach(log => {
                    const row = tableBody.insertRow();
                    row.innerHTML = `
                        <td>${log.action}</td>
                        <td>${log.total_count}</td>
                        <td>${new Date(log.last_occurred).toLocaleString()}</td>
                        <td>${log.latest_user || 'System'}</td>
                    `;
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="4" class="no-data">No system activity logs found.</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error loading activity logs:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="no-data">Error loading data.</td></tr>';
        });
}