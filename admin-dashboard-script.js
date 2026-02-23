document.addEventListener('DOMContentLoaded', function() {
    checkAdminSession();
});

function checkAdminSession() {
    fetch('session-check.php')
        .then(response => response.json())
        .then(data => {
            if (!data.logged_in) {
                window.location.href = 'login.html';
            } else if (data.role !== 'admin') {
                // If logged in but not admin, redirect to officer dashboard
                window.location.href = 'dashboard.html';
            } else {
                loadAdminStats();
            }
        })
        .catch(error => {
            console.error('Session check error:', error);
            window.location.href = 'login.html';
        });
}

function loadAdminStats() {
    fetch('get-admin-stats.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('totalOfficers').textContent = data.total_officers;
                document.getElementById('totalDetainees').textContent = data.total_detainees;
            }
        })
        .catch(error => {
            console.error('Error loading stats:', error);
        });
}