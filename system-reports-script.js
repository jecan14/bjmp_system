document.addEventListener('DOMContentLoaded', function() {
    loadReports();
});

function loadReports() {
    fetch('get-reports.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Populate Visitor Logs
                const visitorBody = document.querySelector('#visitorReportTable tbody');
                visitorBody.innerHTML = '';
                if (data.visitors.length > 0) {
                    data.visitors.forEach(v => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${v.visit_date}</td>
                            <td>${v.visitor_name}</td>
                            <td>${v.first_name} ${v.last_name}</td>
                            <td>${v.officer_name || 'Unknown'}</td>
                            <td>${v.visit_time}</td>
                            <td>${v.checkout_time || '<span style="color:green">Inside</span>'}</td>
                        `;
                        visitorBody.appendChild(row);
                    });
                } else {
                    visitorBody.innerHTML = '<tr><td colspan="6" class="no-data">No records found</td></tr>';
                }

                // Populate Activity Logs
                const logBody = document.querySelector('#activityLogTable tbody');
                logBody.innerHTML = '';
                if (data.logs.length > 0) {
                    data.logs.forEach(l => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${l.created_at}</td>
                            <td>${l.username || 'System'}</td>
                            <td>${l.action}</td>
                            <td>${l.description}</td>
                            <td>${l.ip_address}</td>
                        `;
                        logBody.appendChild(row);
                    });
                } else {
                    logBody.innerHTML = '<tr><td colspan="5" class="no-data">No logs found</td></tr>';
                }
            }
        })
        .catch(error => console.error('Error loading reports:', error));
}