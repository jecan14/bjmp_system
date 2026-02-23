document.addEventListener('DOMContentLoaded', function() {
    loadTodayVisitors();
});

function loadTodayVisitors() {
    fetch('get-visitors.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const today = new Date().toISOString().split('T')[0];
                const visitors = data.visitors.filter(v => v.visit_date === today);
                displayTodayVisitors(visitors);
            }
        });
}

function displayTodayVisitors(visitors) {
    const tbody = document.querySelector('#todayTable tbody');
    tbody.innerHTML = '';
    
    let insideCount = 0;

    if (visitors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No visitors today yet.</td></tr>';
        document.getElementById('insideCount').textContent = '0';
        return;
    }

    visitors.forEach(v => {
        if (!v.checkout_time) insideCount++;
        
        const row = document.createElement('tr');
        if (!v.checkout_time) row.classList.add('visitor-inside-row');

        row.innerHTML = `
            <td>${formatTime(v.visit_time)}</td>
            <td><strong>${v.visitor_name}</strong></td>
            <td>${v.detainee_name}</td>
            <td>${v.checkout_time ? '<span class="badge badge-success">Checked Out</span>' : '<span class="badge badge-inside">Inside</span>'}</td>
            <td>
                ${!v.checkout_time ? `<button class="btn btn-success btn-small" onclick="checkoutVisitor(${v.id})">Check Out</button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('insideCount').textContent = insideCount;
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function checkoutVisitor(id) {
    if(confirm('Check out this visitor?')) {
        const formData = new FormData(); formData.append('visitor_id', id);
        fetch('checkout-visitor.php', { method: 'POST', body: formData }).then(() => loadTodayVisitors());
    }
}