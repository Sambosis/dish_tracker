document.addEventListener('DOMContentLoaded', function() {
    // Initialize views
    let currentView = 'table';
    let calendar;
    
    // Initialize DataTable
    const table = $('#salesTable').DataTable({
        order: [[0, 'asc']],  // Sort by priority by default
        pageLength: 25,
        columns: [
            { data: 'priority' },
            { data: 'salesperson' },
            { data: 'customer' },
            { data: 'machine_model' },
            { data: 'address' },
            { data: 'owner' },
            { data: 'phone' },
            { data: 'verbal_date' },
            { data: 'paperwork_date' },
            { data: 'payment_date' },
            { data: 'installation_date' },
            { data: 'lease_price' },
            { 
                data: null,
                defaultContent: $('#actionButtonsTemplate').html(),
                orderable: false
            }
        ],
        columnDefs: [
            {
                targets: 0,
                render: function(data) {
                    const priorities = {1: 'High', 2: 'Medium', 3: 'Low'};
                    return priorities[data] || data;
                }
            },
            {
                targets: [7, 8, 9, 10],
                render: function(data) {
                    return data ? new Date(data).toLocaleDateString() : '';
                }
            },
            {
                targets: 11,
                render: function(data) {
                    return data ? `$${data.toFixed(2)}` : '';
                }
            }
        ],
        createdRow: function(row, data) {
            // Add priority-based classes
            const priorityClasses = {
                1: 'priority-high',
                2: 'priority-medium',
                3: 'priority-low'
            };
            $(row).addClass(priorityClasses[data.priority]);
        }
    });

    // Load initial data
    loadSales();

    // Handle edit and delete buttons
    $('#salesTable').on('click', '.edit-btn', function() {
        const data = table.row($(this).closest('tr')).data();
        const form = document.getElementById('saleForm');
        
        // Fill form with sale data
        form.priority.value = data.priority;
        form.salesperson.value = data.salesperson;
        form.customer.value = data.customer;
        form.machine_model.value = data.machine_model;
        form.address.value = data.address || '';
        form.owner.value = data.owner || '';
        form.phone.value = data.phone || '';
        form.verbal_date.value = data.verbal_date ? data.verbal_date.split('T')[0] : '';
        form.paperwork_date.value = data.paperwork_date ? data.paperwork_date.split('T')[0] : '';
        form.payment_date.value = data.payment_date ? data.payment_date.split('T')[0] : '';
        form.installation_date.value = data.installation_date ? data.installation_date.split('T')[0] : '';
        form.lease_price.value = data.lease_price || '';
        
        // Store sale ID for update
        form.dataset.saleId = data.id;
        
        // Update modal title and button
        document.querySelector('#addSaleModal .modal-title').textContent = 'Edit Sale';
        document.getElementById('saveSaleBtn').innerHTML = '<i class="fas fa-save me-1"></i>Update Sale';
        
        // Show modal
        $('#addSaleModal').modal('show');
    });
    
    $('#salesTable').on('click', '.delete-btn', function() {
        const data = table.row($(this).closest('tr')).data();
        
        if (confirm(`Are you sure you want to delete the sale for ${data.customer}?`)) {
            fetch(`/api/sales/${data.id}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(result => {
                // Show success toast
                const toast = new bootstrap.Toast(document.getElementById('successToast'));
                document.getElementById('toastMessage').textContent = 'Sale deleted successfully!';
                toast.show();
                
                loadSales();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to delete sale. Please try again.');
            });
        }
    });

    // Reset modal when hidden
    $('#addSaleModal').on('hidden.bs.modal', function() {
        const form = document.getElementById('saleForm');
        form.reset();
        delete form.dataset.saleId;
        document.querySelector('#addSaleModal .modal-title').textContent = 'Add New Sale';
        document.getElementById('saveSaleBtn').innerHTML = '<i class="fas fa-save me-1"></i>Save Sale';
    });

    // Save/Update sale form handler
    document.getElementById('saveSaleBtn').addEventListener('click', function() {
        const form = document.getElementById('saleForm');
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            if (value) {  // Only include non-empty values
                data[key] = value;
            }
        });

        const url = form.dataset.saleId 
            ? `/api/sales/${form.dataset.saleId}`
            : '/api/sales';
            
        fetch(url, {
            method: form.dataset.saleId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.id || result.message) {
                // Success - close modal and reload data
                $('#addSaleModal').modal('hide');
                form.reset();
                delete form.dataset.saleId;
                
                // Show success toast
                const toast = new bootstrap.Toast(document.getElementById('successToast'));
                document.getElementById('toastMessage').textContent = 
                    form.dataset.saleId ? 'Sale updated successfully!' : 'Sale created successfully!';
                toast.show();
                
                loadSales();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to save sale. Please try again.');
        });
    });

    function loadSales() {
        fetch('/api/sales')
            .then(response => response.json())
            .then(data => {
                // Update table
                table.clear();
                table.rows.add(data);
                table.draw();
                
                // Update stats
                updateDashboardStats(data);
                
                // Update calendar if initialized
                if (calendar) {
                    updateCalendarEvents(data);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to load sales data. Please refresh the page.');
            });
    }

    // Initialize Calendar
    calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listMonth'
        },
        events: [],
        displayEventTime: false,
        eventDisplay: 'block',
        eventClick: function(info) {
            // Update event details in modal
            const event = info.event;
            document.getElementById('eventCustomer').textContent = event.title;
            document.getElementById('eventType').textContent = event.extendedProps.type;
            document.getElementById('eventTypeIcon').className = event.extendedProps.icon;
            document.getElementById('eventDetails').innerHTML = event.extendedProps.details;
            document.getElementById('eventModal').querySelector('.modal-content')
                .className = `modal-content border-${event.extendedProps.colorClass}`;
            
            // Show modal
            const eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
            eventModal.show();
        },
        eventContent: function(arg) {
            return {
                html: `<div class="fc-event-content">
                    <i class="${arg.event.extendedProps.icon} me-1"></i>
                    <span class="event-title">${arg.event.title}</span>
                    <div class="event-type small">${arg.event.extendedProps.type}</div>
                </div>`
            };
        }
    });
    calendar.render();

    // View switching
    document.querySelectorAll('[data-view]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const newView = this.dataset.view;
            
            // Update navigation
            document.querySelectorAll('[data-view]').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Update view
            document.querySelectorAll('.view-section').forEach(section => {
                section.classList.add('d-none');
            });
            document.getElementById(newView + 'View').classList.remove('d-none');
            
            if (newView === 'calendar') {
                calendar.updateSize();
            }
            
            currentView = newView;
        });
    });

    function updateDashboardStats(data) {
        // Update total sales
        document.getElementById('totalSales').textContent = data.length;
        
        // Update high priority count
        const highPriority = data.filter(sale => sale.priority === 1).length;
        document.getElementById('highPriority').textContent = highPriority;
        
        // Update installations this month
        const now = new Date();
        const thisMonth = data.filter(sale => {
            if (!sale.installation_date) return false;
            const installDate = new Date(sale.installation_date);
            return installDate.getMonth() === now.getMonth() && 
                   installDate.getFullYear() === now.getFullYear();
        }).length;
        document.getElementById('installationsThisMonth').textContent = thisMonth;
        
        // Update total value
        const totalValue = data.reduce((sum, sale) => sum + (sale.lease_price || 0), 0);
        document.getElementById('totalValue').textContent = '$' + totalValue.toLocaleString();
    }

    function updateCalendarEvents(data) {
        // Remove existing events
        calendar.removeAllEvents();
        
        // Add events for each date type
        data.forEach(sale => {
            const formatDetails = (sale) => `
                <div class="event-detail-row">
                    <strong>Model:</strong> ${sale.machine_model}
                </div>
                <div class="event-detail-row">
                    <strong>Salesperson:</strong> ${sale.salesperson}
                </div>
                ${sale.address ? `
                <div class="event-detail-row">
                    <strong>Address:</strong> ${sale.address}
                </div>` : ''}
                ${sale.phone ? `
                <div class="event-detail-row">
                    <strong>Phone:</strong> ${sale.phone}
                </div>` : ''}
                ${sale.lease_price ? `
                <div class="event-detail-row">
                    <strong>Lease Price:</strong> $${sale.lease_price.toLocaleString()}
                </div>` : ''}
            `;

            if (sale.verbal_date) {
                calendar.addEvent({
                    title: sale.customer,
                    start: sale.verbal_date,
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    extendedProps: {
                        type: 'Verbal Commitment',
                        icon: 'fas fa-handshake',
                        colorClass: 'primary',
                        details: formatDetails(sale)
                    }
                });
            }
            
            if (sale.paperwork_date) {
                calendar.addEvent({
                    title: sale.customer,
                    start: sale.paperwork_date,
                    backgroundColor: '#f1c40f',
                    borderColor: '#f39c12',
                    extendedProps: {
                        type: 'Paperwork Completed',
                        icon: 'fas fa-file-signature',
                        colorClass: 'warning',
                        details: formatDetails(sale)
                    }
                });
            }
            
            if (sale.payment_date) {
                calendar.addEvent({
                    title: sale.customer,
                    start: sale.payment_date,
                    backgroundColor: '#2ecc71',
                    borderColor: '#27ae60',
                    extendedProps: {
                        type: 'Payment Received',
                        icon: 'fas fa-dollar-sign',
                        colorClass: 'success',
                        details: formatDetails(sale)
                    }
                });
            }
            
            if (sale.installation_date) {
                calendar.addEvent({
                    title: sale.customer,
                    start: sale.installation_date,
                    backgroundColor: '#e74c3c',
                    borderColor: '#c0392b',
                    extendedProps: {
                        type: 'Installation Scheduled',
                        icon: 'fas fa-tools',
                        colorClass: 'danger',
                        details: formatDetails(sale)
                    }
                });
            }
        });
    }
});