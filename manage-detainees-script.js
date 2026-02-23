document.addEventListener('DOMContentLoaded', function() {
    loadDetainees();

    document.getElementById('addDetaineeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        fetch('add-detainee-process.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Detainee added successfully!');
                this.reset();
                loadDetainees();
            } else {
                alert(data.message || 'Error adding detainee');
            }
        })
        .catch(error => console.error('Error:', error));
    });
});

function loadDetainees() {
    fetch('get-detainees.php')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('#detaineesTable tbody');
            tbody.innerHTML = '';
            
            if (data.success && data.detainees.length > 0) {
                data.detainees.forEach(d => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${d.detainee_number}</td>
                        <td>${d.last_name}, ${d.first_name}</td>
                        <td><span class="badge badge-success">${d.status}</span></td>
                        <td>
                            <button class="btn-icon" onclick="deleteDetainee(${d.id})" style="color:red;">🗑️</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4" class="no-data">No detainees found.</td></tr>';
            }
        });
}

function deleteDetainee(id) {
    if(confirm('Are you sure you want to delete this detainee?')) {
        const formData = new FormData();
        formData.append('id', id);
        
        fetch('delete-detainee.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) loadDetainees();
            else alert('Error deleting');
        });
    }
}