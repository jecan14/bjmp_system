// Function to show alert messages
function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    if (!container) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Fetch and display detainees
function loadDetainees() {
    const tableBody = document.querySelector('#detaineesTable tbody');
    tableBody.innerHTML = '<tr><td colspan="4" class="no-data">Loading...</td></tr>';

    fetch('get-detainees.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.detainees.length > 0) {
                tableBody.innerHTML = '';
                data.detainees.forEach(detainee => {
                    const row = tableBody.insertRow();
                    const fullName = `${detainee.last_name}, ${detainee.first_name} ${detainee.middle_name || ''}`;
                    const status = detainee.status;
                    let badgeClass = 'badge-secondary';
                    let statusText = 'Unknown';

                    if (status === 'active') {
                        badgeClass = 'badge-success';
                        statusText = 'Active';
                    } else if (status === 'transferred') {
                        badgeClass = 'badge-warning';
                        statusText = 'Transferred';
                    } else if (status === 'released') {
                        badgeClass = 'badge-secondary';
                        statusText = 'Released';
                    } else {
                        statusText = status || 'N/A'; // Handle null or empty status
                    }
                    
                    row.innerHTML = `
                        <td>${detainee.detainee_number}</td>
                        <td>${fullName}</td>
                        <td><span class="badge ${badgeClass}">${statusText}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon delete-btn" onclick="deleteDetainee(${detainee.id})" title="Delete">🗑️</button>
                            </div>
                        </td>
                    `;
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="4" class="no-data">No active individuals found.</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="no-data">Error loading data.</td></tr>';
        });
}

// Add Detainee
document.getElementById('addDetaineeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const submitBtn = this.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    fetch('add-detainee.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message, 'success');
            this.reset();
            loadDetainees(); // Refresh list
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => showAlert('An error occurred', 'error'))
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Information';
    });
});

// Delete Detainee
function deleteDetainee(id) {
    if (!confirm('Are you sure you want to delete this individual? This action cannot be undone.')) return;

    const formData = new FormData();
    formData.append('id', id);

    fetch('delete-detainee.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message, 'success');
            loadDetainees(); // Refresh list
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => showAlert('An error occurred', 'error'));
}

// Initial load
document.addEventListener('DOMContentLoaded', loadDetainees);