document.addEventListener('DOMContentLoaded', function() {
    loadOfficers();

    document.getElementById('addOfficerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        fetch('add-officer.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Officer account created successfully!');
                this.reset();
                loadOfficers();
            } else {
                alert(data.message || 'Error creating account');
            }
        })
        .catch(error => console.error('Error:', error));
    });
});

function loadOfficers() {
    fetch('get-officers.php')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('#officersTable tbody');
            tbody.innerHTML = '';
            
            if (data.success && data.officers.length > 0) {
                data.officers.forEach(officer => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${officer.name}</td>
                        <td>${officer.username}</td>
                        <td>${officer.email}</td>
                        <td>${officer.contact_number}</td>
                        <td>
                            <button class="btn-icon" onclick="deleteOfficer(${officer.id})" style="color:red;">🗑️</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" class="no-data">No officers found.</td></tr>';
            }
        });
}

function deleteOfficer(id) {
    if(confirm('Are you sure you want to delete this officer account?')) {
        const formData = new FormData();
        formData.append('id', id);
        
        fetch('delete-officer.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) loadOfficers();
            else alert('Error deleting officer');
        });
    }
}