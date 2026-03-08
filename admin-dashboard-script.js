document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    initChart();
});

function loadDashboardStats() {
    // Fetch Visitors Count
    fetch('get-visitors.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('totalVisitors').textContent = data.visitors.length;
            }
        })
        .catch(err => console.error('Error loading visitors:', err));

    // Fetch Officers Count
    fetch('get-officers.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('totalOfficers').textContent = data.officers.length;
            }
        })
        .catch(err => console.error('Error loading officers:', err));

    // Fetch Detainees Count
    fetch('get-detainees.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Filter for active individuals
                const active = data.detainees.filter(d => d.status === 'active').length;
                document.getElementById('totalDetainees').textContent = active;
            }
        })
        .catch(err => console.error('Error loading detainees:', err));
}

let activityChart;

function initChart() {
    const ctx = document.getElementById('activityChart').getContext('2d');

    // Initialize Chart with empty data, it will be populated by fetchChartData
    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Will be filled by API
            datasets: [{
                label: 'Total Visitors',
                data: [], // Will be filled by API
                borderColor: '#2F6FED', // Emergency Blue
                backgroundColor: 'rgba(47, 111, 237, 0.1)',
                borderWidth: 2,
                tension: 0.4, // Smooth curves
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#2F6FED',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide legend for cleaner look
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [2, 4],
                        color: '#f0f0f0'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Event Listeners for Buttons
    const buttons = {
        daily: document.getElementById('btnDaily'),
        weekly: document.getElementById('btnWeekly'),
        monthly: document.getElementById('btnMonthly')
    };

    Object.keys(buttons).forEach(key => {
        buttons[key].addEventListener('click', () => {
            // Update active button state
            Object.values(buttons).forEach(btn => btn.className = 'btn btn-small btn-secondary');
            buttons[key].className = 'btn btn-small btn-primary';
            
            // Fetch and Update Chart Data
            fetchChartData(key);
        });
    });

    // Initial load of daily data
    fetchChartData('daily');
}

function fetchChartData(period) {
    fetch(`get-chart-data.php?period=${period}`)
        .then(response => response.json())
        .then(chartData => {
            if (chartData.success) {
                // Update Chart Data
                activityChart.data.labels = chartData.labels;
                activityChart.data.datasets[0].data = chartData.data;
                activityChart.update();
            } else {
                console.error('Failed to fetch chart data:', chartData.message);
            }
        })
        .catch(error => console.error('Error fetching chart data:', error));
}