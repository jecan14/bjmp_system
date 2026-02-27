document.addEventListener('DOMContentLoaded', function() {
    loadTodayVisitors();
});

function loadTodayVisitors() {
    const today = new Date().toISOString().split('T')[0];
    fetch(`get-visitors.php?date=${today}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // The backend now does the date filtering
                displayTodayVisitors(data.visitors);
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
        const isInside = !v.checkout_time || v.checkout_time === '00:00:00' || v.checkout_time === '';
        if (isInside) insideCount++;
        
        const row = document.createElement('tr');
        if (isInside) row.classList.add('visitor-inside-row');

        row.innerHTML = `
            <td>${formatTime(v.visit_time)}</td>
            <td><strong>${v.visitor_name}</strong></td>
            <td>${v.detainee_name}</td>
            <td>${!isInside ? '<span class="badge badge-success">Checked Out</span>' : '<span class="badge badge-inside">Inside</span>'}</td>
            <td>
                ${isInside ? `<button class="btn btn-success btn-small" onclick="checkoutVisitor(${v.id})">Check Out</button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });

    const insideCountElement = document.getElementById('insideCount');
    if (insideCountElement) {
        insideCountElement.textContent = insideCount;
    }
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