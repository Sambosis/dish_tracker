// Main JavaScript functionality for Dish Machine Sales Tracker

let installationsTable;
let chartInstances = {};

// Initialize DataTable with enhanced features
function initializeTable() {
    installationsTable = $('#installationsTable').DataTable({
        processing: true,
        serverSide: false,
        responsive: true,
        dom: 'Bfrtip',
        buttons: [
            {
                text: '<i class="fas fa-file-excel"></i> Excel',
                className: 'btn btn-success',
                action: function() {
                    exportToExcel();
                }
            },
            {
                text: '<i class="fas fa-print"></i> Print',
                className: 'btn btn-info',
                extend: 'print'
            },
            {
                text: '<i class="fas fa-columns"></i> Columns',
                className: 'btn btn-secondary',
                extend: 'colvis'
            }
        ],
        select: {
            style: 'multi',
            selector: 'td:first-child'
        },
        order: [[0, 'asc']],
        columns: [
            {
                data: 'priority',
                render: function(data, type, row) {
                    if (type === 'display') {
                        return `<span class="badge bg-${getPriorityColor(data)}">${data}</span>`;
                    }
                    return data;
                }
            },
            { data: 'salesperson' },
            { data: 'customer' },
            {
                data: 'machine_model',
                render: function(data, type, row) {
                    return `<span class="model-badge model-${data.toLowerCase()}">${data}</span>`;
                }
            },
            {
                data: 'verbal_commit_date',
                render: function(data) {
                    return data ? new Date(data).toLocaleDateString() : '';
                }
            },
            {
                data: 'paperwork_date',
                render: function(data) {
                    return data ? new Date(data).toLocaleDateString() : '';
                }
            },
            {
                data: 'money_date',
                render: function(data) {
                    return data ? new Date(data).toLocaleDateString() : '';
                }
            },
            {
                data: 'installed_date',
                render: function(data) {
                    return data ? new Date(data).toLocaleDateString() : '';
                }
            },
            {
                data: 'status',
                render: function(data) {
                    return `<span class="status-badge status-${data.toLowerCase().replace(' ', '-')}">${data}</span>`;
                }
            },
            {
                data: 'notes',
                render: function(data) {
                    if (!data) return '';
                    if (data.length > 50) {
                        return `<span class="notes-preview" data-bs-toggle="tooltip" title="${data}">${data.substring(0, 47)}...</span>`;
                    }
                    return data;
                }
            },
            {
                data: null,
                render: function(data, type, row) {
                    return `
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-primary btn-sm" onclick="editInstallation(${row.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-info btn-sm" onclick="showTimeline(${row.id})">
                                <i class="fas fa-clock"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteInstallation(${row.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        rowCallback: function(row, data) {
            $(row).addClass(`priority-${data.priority}`);
            if (data.status === 'Complete') {
                $(row).addClass('completed-row');
            }
        },
        initComplete: function() {
            this.api().columns([1, 3, 8]).every(function() {
                const column = this;
                const select = $('<select class="form-select form-select-sm"><option value="">All</option></select>')
                    .appendTo($(column.footer()).empty())
                    .on('change', function() {
                        const val = $.fn.dataTable.util.escapeRegex($(this).val());
                        column.search(val ? `^${val}$` : '', true, false).draw();
                    });

                column.data().unique().sort().each(function(d) {
                    select.append(`<option value="${d}">${d}</option>`);
                });
            });
        }
    });

    // Add custom search functionality
    $('#searchInput').on('keyup', function() {
        installationsTable.search(this.value).draw();
    });
}

// Show add/edit installation modal
function showInstallationModal(installation = null) {
    const modal = document.getElementById('installationModal');
    const form = document.getElementById('installationForm');
    const title = modal.querySelector('.modal-title');

    // Reset form
    form.reset();
    
    if (installation) {
        title.textContent = 'Edit Installation';
        // Populate form with installation data
        Object.keys(installation).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                if (key.endsWith('_date') && installation[key]) {
                    input.value = new Date(installation[key]).toISOString().split('T')[0];
                } else {
                    input.value = installation[key];
                }
            }
        });
        document.getElementById('installId').value = installation.id;
    } else {
        title.textContent = 'Add Installation';
        document.getElementById('installId').value = '';
    }

    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Save installation
function saveInstallation() {
    const form = document.getElementById('installationForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const installId = document.getElementById('installId').value;
    const method = installId ? 'PUT' : 'POST';
    const url = installId ? `/api/installations/${installId}` : '/api/installations';

    const formData = {
        priority: parseInt(document.getElementById('priority').value),
        salesperson: document.getElementById('salesperson').value,
        customer: document.getElementById('customer').value,
        machine_model: document.getElementById('machine_model').value,
        verbal_commit_date: document.getElementById('verbal_commit_date').value || null,
        paperwork_date: document.getElementById('paperwork_date').value || null,
        installed_date: document.getElementById('installed_date').value || null,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value,
        
        // Financial information
        lease_price: parseFloat(document.getElementById('lease_price').value) || null,
        lease_term: parseInt(document.getElementById('lease_term').value) || null,
        lease_start_date: document.getElementById('lease_start_date').value || null,
        lease_end_date: document.getElementById('lease_end_date').value || null,
        installation_fee: parseFloat(document.getElementById('installation_fee').value) || null,
        payment_status: document.getElementById('payment_status').value,
        payment_frequency: document.getElementById('payment_frequency').value,
        first_payment_date: document.getElementById('first_payment_date').value || null,
        deposit_amount: parseFloat(document.getElementById('deposit_amount').value) || null,
        deposit_date: document.getElementById('deposit_date').value || null,
        monthly_payment: parseFloat(document.getElementById('monthly_payment').value) || null
    };

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('installationModal'));
        modal.hide();
        refreshTable();
        showToast('success', `Installation ${installId ? 'updated' : 'added'} successfully`);
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('error', 'An error occurred while saving the installation');
    });
}

// Delete installation
function deleteInstallation(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/installations/${id}`, {
                method: 'DELETE'
            })
            .then(() => {
                refreshTable();
                showToast('success', 'Installation deleted successfully');
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('error', 'An error occurred while deleting the installation');
            });
        }
    });
}

// Refresh table
function refreshTable() {
    fetch('/api/installations')
        .then(response => response.json())
        .then(data => {
            installationsTable.clear();
            installationsTable.rows.add(data);
            installationsTable.draw();
            updateDashboard();
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('error', 'Failed to refresh table data');
        });
}

// Update dashboard
function updateDashboard() {
    fetch('/api/dashboard')
        .then(response => response.json())
        .then(data => {
            // Update dashboard cards
            document.getElementById('totalInstallations').textContent = data.total_installations;
            document.getElementById('completedInstallations').textContent = data.completed_installations;
            document.getElementById('pendingInstallations').textContent = data.pending_installations;
            document.getElementById('highPriorityCount').textContent = data.priority_breakdown['1'] || 0;

            // Update completion progress
            const completionPercentage = (data.completed_installations / data.total_installations * 100) || 0;
            document.getElementById('completionProgress').style.width = `${completionPercentage}%`;
            document.getElementById('completedPercentage').textContent = `${Math.round(completionPercentage)}%`;

            // Update status breakdown chart
            updateStatusChart(data.status_breakdown);
            updateSalesChart(data.salesperson_performance);
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('error', 'Failed to update dashboard');
        });
}

// Chart updates
function updateStatusChart(data) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    if (chartInstances.status) {
        chartInstances.status.destroy();
    }
    
    chartInstances.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#dc3545',
                    '#ffc107',
                    '#17a2b8',
                    '#28a745'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function updateSalesChart(data) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    if (chartInstances.sales) {
        chartInstances.sales.destroy();
    }
    
    chartInstances.sales = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Installations',
                data: Object.values(data),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Utility functions
function getPriorityColor(priority) {
    const colors = {
        1: 'danger',
        2: 'warning',
        3: 'primary',
        4: 'info',
        5: 'secondary'
    };
    return colors[priority] || 'secondary';
}

function showToast(type, message) {
    const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
    
    toast.fire({
        icon: type,
        title: message
    });
}

// Show Add Modal Function
function showAddModal() {
    showInstallationModal();
}

// Initialize on document load
document.addEventListener('DOMContentLoaded', function() {
    initializeTable();
    refreshTable();
    
    // Initialize date pickers
    flatpickr("input[type=date]", {
        dateFormat: "Y-m-d",
        allowInput: true
    });
    
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});