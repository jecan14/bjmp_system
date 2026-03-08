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

                    // Determine badge class for the dropdown
                    let badgeClass = 'badge-secondary';
                    if (status === 'active') {
                        badgeClass = 'badge-success';
                    } else if (status === 'transferred') {
                        badgeClass = 'badge-warning';
                    }

                    const statusDropdown = `
                        <select 
                            class="status-select badge ${badgeClass}" 
                            data-id="${detainee.id}" 
                            data-original-status="${status}"
                            onchange="updateDetaineeStatus(this)"
                        >
                            <option value="active" ${status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="transferred" ${status === 'transferred' ? 'selected' : ''}>Transferred</option>
                            <option value="released" ${status === 'released' ? 'selected' : ''}>Released</option>
                        </select>
                    `;
                    
                    row.innerHTML = `
                        <td>${detainee.detainee_number}</td>
                        <td>${fullName}</td>
                        <td>${statusDropdown}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon delete-btn" onclick="deleteDetainee(${detainee.id})" title="Delete" style="color: #ef4444;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></button>
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

function updateDetaineeStatus(selectElement) {
    const id = selectElement.dataset.id;
    const newStatus = selectElement.value;
    const originalStatus = selectElement.dataset.originalStatus;

    // Capitalize first letter for the confirmation message
    const newStatusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

    if (!confirm(`Are you sure you want to change this individual's status to "${newStatusText}"?`)) {
        selectElement.value = originalStatus; // Revert on cancel
        return;
    }

    const formData = new FormData();
    formData.append('id', id);
    formData.append('status', newStatus);

    fetch('update-detainee-status.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Status updated successfully.', 'success');
            loadDetainees(); // Refresh the list to show new styles and data
        } else {
            showAlert(data.message || 'Failed to update status.', 'error');
            selectElement.value = originalStatus; // Revert on failure
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('An error occurred while updating status.', 'error');
        selectElement.value = originalStatus; // Revert on error
    });
}

// Initial load
document.addEventListener('DOMContentLoaded', loadDetainees);