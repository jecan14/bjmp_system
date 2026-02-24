document.addEventListener('DOMContentLoaded', function() {
    // Load reports on page load
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

                // Populate Activity Logs (Summarized View)
                const logTable = document.querySelector('#activityLogTable');
                const logBody = logTable.querySelector('tbody');

                logBody.innerHTML = '';
                if (data.logs.length > 0) {
                    // Group logs by action to create summary
                    const summary = {};
                    
                    data.logs.forEach(l => {
                        if (!summary[l.action]) {
                            summary[l.action] = {
                                count: 0,
                                lastTime: l.created_at,
                                lastUser: l.username || 'System'
                            };
                        }
                        summary[l.action].count++;
                        
                        // Track the latest occurrence
                        if (l.created_at > summary[l.action].lastTime) {
                            summary[l.action].lastTime = l.created_at;
                            summary[l.action].lastUser = l.username || 'System';
                        }
                    });

                    // Render summary rows
                    Object.keys(summary).forEach(action => {
                        const item = summary[action];
                        const row = document.createElement('tr');
                        const actionLabel = action.replace(/_/g, ' ').toUpperCase();
                        
                        row.innerHTML = `
                            <td><span class="badge badge-secondary">${actionLabel}</span></td>
                            <td style="font-weight: bold; font-size: 1.1em;">${item.count}</td>
                            <td>${item.lastTime}</td>
                            <td>${item.lastUser}</td>
                        `;
                        logBody.appendChild(row);
                    });
                } else {
                    logBody.innerHTML = '<tr><td colspan="4" class="no-data">No logs found</td></tr>';
                }
            }
        })
        .catch(error => console.error('Error loading reports:', error));
}