// Bulk Actions functionality

// Initialize bulk action functionality
function initializeBulkActions() {
    // Enable row selection in DataTable
    installationsTable.select.style('multi');
    
    // Add bulk action buttons event listeners
    document.getElementById('bulkStatusUpdate').addEventListener('click', showBulkStatusModal);
    document.getElementById('bulkPriorityUpdate').addEventListener('click', showBulkPriorityModal);
    document.getElementById('bulkDelete').addEventListener('click', showBulkDeleteConfirmation);
}

// Show bulk status update modal
function showBulkStatusModal() {
    const selectedRows = installationsTable.rows({ selected: true }).data();
    if (selectedRows.length === 0) {
        showToast('warning', 'Please select at least one installation');
        return;
    }

    const installationIds = Array.from(selectedRows).map(row => row.id);
    
    Swal.fire({
        title: 'Update Status',
        html: `
            <select id="bulkStatus" class="form-select">
                <option value="">Select Status</option>
                <option value="Pending Salesperson">Pending Salesperson</option>
                <option value="Pending Machine">Pending Machine</option>
                <option value="Pending Customer">Pending Customer</option>
                <option value="Complete">Complete</option>
            </select>
        `,
        showCancelButton: true,
        confirmButtonText: 'Update',
        preConfirm: () => {
            const status = document.getElementById('bulkStatus').value;
            if (!status) {
                Swal.showValidationMessage('Please select a status');
                return false;
            }
            return { status, installationIds };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            updateBulkStatus(result.value.status, result.value.installationIds);
        }
    });
}

// Show bulk priority update modal
function showBulkPriorityModal() {
    const selectedRows = installationsTable.rows({ selected: true }).data();
    if (selectedRows.length === 0) {
        showToast('warning', 'Please select at least one installation');
        return;
    }

    const installationIds = Array.from(selectedRows).map(row => row.id);
    
    Swal.fire({
        title: 'Update Priority',
        html: `
            <select id="bulkPriority" class="form-select">
                <option value="">Select Priority</option>
                <option value="1">1 - Highest (Urgent)</option>
                <option value="2">2 - High (Time Sensitive)</option>
                <option value="3">3 - Medium (Normal)</option>
                <option value="4">4 - Low (Flexible)</option>
                <option value="5">5 - Lowest (No Rush)</option>
            </select>
        `,
        showCancelButton: true,
        confirmButtonText: 'Update',
        preConfirm: () => {
            const priority = document.getElementById('bulkPriority').value;
            if (!priority) {
                Swal.showValidationMessage('Please select a priority level');
                return false;
            }
            return { priority, installationIds };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            updateBulkPriority(result.value.priority, result.value.installationIds);
        }
    });
}

// Show bulk delete confirmation
function showBulkDeleteConfirmation() {
    const selectedRows = installationsTable.rows({ selected: true }).data();
    if (selectedRows.length === 0) {
        showToast('warning', 'Please select at least one installation');
        return;
    }

    const installationIds = Array.from(selectedRows).map(row => row.id);
    
    Swal.fire({
        title: 'Are you sure?',
        text: `You are about to delete ${selectedRows.length} installation(s). This action cannot be undone!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete them!'
    }).then((result) => {
        if (result.isConfirmed) {
            bulkDelete(installationIds);
        }
    });
}

// Update status for multiple installations
function updateBulkStatus(status, installationIds) {
    fetch('/api/installations/bulk_status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: status,
            installation_ids: installationIds
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', `Successfully updated status for ${installationIds.length} installation(s)`);
            refreshTable();
        } else {
            showToast('error', `Error: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'An error occurred while updating installations');
    });
}

// Update priority for multiple installations
function updateBulkPriority(priority, installationIds) {
    fetch('/api/installations/bulk_priority', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            priority: priority,
            installation_ids: installationIds
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', `Successfully updated priority for ${installationIds.length} installation(s)`);
            refreshTable();
        } else {
            showToast('error', `Error: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'An error occurred while updating installations');
    });
}

// Delete multiple installations
function bulkDelete(installationIds) {
    fetch('/api/installations/bulk_delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            installation_ids: installationIds
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', `Successfully deleted ${installationIds.length} installation(s)`);
            refreshTable();
        } else {
            showToast('error', `Error: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'An error occurred while deleting installations');
    });
}

// Export functions
export {
    initializeBulkActions,
    showBulkStatusModal,
    showBulkPriorityModal,
    showBulkDeleteConfirmation
};