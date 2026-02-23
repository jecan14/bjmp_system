let allDetainees = [];

document.addEventListener('DOMContentLoaded', function() {
    fetch('get-detainees.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                allDetainees = data.detainees;
                displayDetainees(allDetainees);
            }
        });

    document.getElementById('detaineeSearch').addEventListener('keyup', function(e) {
        const term = e.target.value.toLowerCase();
        
        const filtered = allDetainees.filter(d => 
            d.first_name.toLowerCase().includes(term) || 
            d.last_name.toLowerCase().includes(term) || 
            d.detainee_number.toLowerCase().includes(term)
        );

        displayDetainees(filtered);
    });
});

function displayDetainees(detainees) {
    const tbody = document.querySelector('#detaineeTable tbody');
    tbody.innerHTML = '';

    if (detainees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No detainees found</td></tr>';
        return;
    }

    detainees.forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${d.detainee_number}</td>
            <td><strong>${d.first_name} ${d.last_name}</strong></td>
            <td>${d.date_of_birth}</td>
            <td><span class="badge badge-success">${d.status}</span></td>
            <td><button class="btn btn-primary btn-small" onclick="window.location.href='add-visitor.html'">Log Visitor</button></td>
        `;
        tbody.appendChild(row);
    });
}