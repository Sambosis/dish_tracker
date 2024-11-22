// Enhanced functionality for Dish Machine Sales Tracker

// Dark mode handling
const darkModeSwitch = document.getElementById('darkModeSwitch');
darkModeSwitch.addEventListener('change', function() {
    document.body.setAttribute('data-theme', this.checked ? 'dark' : 'light');
    localStorage.setItem('theme', this.checked ? 'dark' : 'light');
});

// Initialize dark mode from localStorage
if (localStorage.getItem('theme') === 'dark') {
    darkModeSwitch.checked = true;
    document.body.setAttribute('data-theme', 'dark');
}

// View switching
const viewContainers = document.querySelectorAll('.view-container');
const navLinks = document.querySelectorAll('.nav-link[data-view]');

function switchView(viewName) {
    viewContainers.forEach(container => {
        container.classList.add('d-none');
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    const targetView = document.getElementById(`${viewName}View`);
    const targetLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
    
    if (targetView) {
        targetView.classList.remove('d-none');
    }
    if (targetLink) {
        targetLink.classList.add('active');
    }
    
    // Initialize specific view content
    switch(viewName) {
        case 'calendar':
            initializeCalendar();
            break;
        case 'timeline':
            loadTimeline();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// Calendar initialization
let calendar;
function initializeCalendar() {
    if (calendar) {
        calendar.destroy();
    }
    
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        events: '/api/calendar',
        eventClick: function(info) {
            const installId = info.event.id.split('_')[1];
            showInstallationDetails(installId);
        },
        eventDidMount: function(info) {
            // Add tooltips to events
            new bootstrap.Tooltip(info.el, {
                title: info.event.title,
                placement: 'top',
                trigger: 'hover',
                container: 'body'
            });
        }
    });
    calendar.render();
}

// Timeline functionality
function loadTimeline() {
    fetch('/api/timeline')
        .then(response => response.json())
        .then(data => {
            const container = document.querySelector('.timeline-content');
            container.innerHTML = ''; // Clear existing content
            
            data.forEach(installation => {
                const timelineItem = document.createElement('div');
                timelineItem.className = 'timeline-item mb-4';
                
                const header = document.createElement('div');
                header.className = 'timeline-header d-flex justify-content-between align-items-center';
                header.innerHTML = `
                    <h5 class="mb-0">${installation.customer}</h5>
                    <small class="text-muted">#${installation.installation_id}</small>
                `;
                
                const events = document.createElement('div');
                events.className = 'timeline-events mt-2';
                
                installation.events.forEach(event => {
                    const eventDiv = document.createElement('div');
                    eventDiv.className = `timeline-event d-flex align-items-center ${event.type}`;
                    eventDiv.innerHTML = `
                        <div class="timeline-event-dot"></div>
                        <div class="timeline-event-content">
                            <div class="event-date">${event.date}</div>
                            <div class="event-description">${event.description}</div>
                        </div>
                    `;
                    events.appendChild(eventDiv);
                });
                
                timelineItem.appendChild(header);
                timelineItem.appendChild(events);
                container.appendChild(timelineItem);
            });
        });
}

// Reports functionality
function loadReports() {
    // Load and render all charts
    loadSalesPerformanceChart();
    loadInstallationTimelineChart();
    loadModelDistributionChart();
    loadStatusBreakdownChart();
}

function loadSalesPerformanceChart() {
    fetch('/api/dashboard')
        .then(response => response.json())
        .then(data => {
            const ctx = document.getElementById('salesPerformanceChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(data.salesperson_performance),
                    datasets: [{
                        label: 'Installations',
                        data: Object.values(data.salesperson_performance),
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Sales Performance by Salesperson'
                        }
                    },
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
        });
}

// Bulk actions handling
function showBulkActionsModal() {
    const selected = getSelectedInstallations();
    if (selected.length === 0) {
        showToast('error', 'Please select installations first');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('bulkActionsModal'));
    modal.show();
}

function updateBulkActionValueContent() {
    const actionType = document.getElementById('bulkActionType').value;
    const valueContainer = document.getElementById('bulkActionValue');
    
    let content = '';
    switch(actionType) {
        case 'status':
            content = `
                <label>New Status</label>
                <select class="form-select" id="bulkStatusValue">
                    <option value="Pending Salesperson">Pending Salesperson</option>
                    <option value="Pending Machine">Pending Machine</option>
                    <option value="Pending Customer">Pending Customer</option>
                    <option value="Complete">Complete</option>
                </select>
            `;
            break;
        case 'priority':
            content = `
                <label>New Priority</label>
                <select class="form-select" id="bulkPriorityValue">
                    <option value="1">1 - Highest</option>
                    <option value="2">2 - High</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - Low</option>
                    <option value="5">5 - Lowest</option>
                </select>
            `;
            break;
        case 'delete':
            content = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    Are you sure you want to delete the selected installations?
                    This action cannot be undone.
                </div>
            `;
            break;
    }
    valueContainer.innerHTML = content;
}

function executeBulkAction() {
    const actionType = document.getElementById('bulkActionType').value;
    const selected = getSelectedInstallations();
    
    let endpoint = '';
    let data = {
        installation_ids: selected
    };
    
    switch(actionType) {
        case 'status':
            endpoint = '/api/installations/bulk_status';
            data.status = document.getElementById('bulkStatusValue').value;
            break;
        case 'priority':
            endpoint = '/api/installations/bulk_priority';
            data.priority = document.getElementById('bulkPriorityValue').value;
            break;
        case 'delete':
            endpoint = '/api/installations/bulk_delete';
            break;
    }
    
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showToast('success', 'Bulk action completed successfully');
            refreshTable();
        } else {
            showToast('error', result.error || 'Failed to execute bulk action');
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('bulkActionsModal'));
        modal.hide();
    })
    .catch(error => {
        showToast('error', 'An error occurred during bulk action');
        console.error('Bulk action error:', error);
    });
}

// Custom fields handling
function showCustomFieldsModal() {
    loadCustomFields();
    const modal = new bootstrap.Modal(document.getElementById('customFieldsModal'));
    modal.show();
}

function loadCustomFields() {
    fetch('/api/custom-fields')
        .then(response => response.json())
        .then(fields => {
            const container = document.getElementById('customFieldsList');
            container.innerHTML = ''; // Clear existing content
            
            fields.forEach(field => {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'custom-field-item d-flex justify-content-between align-items-center mb-2 p-2 border rounded';
                fieldDiv.innerHTML = `
                    <div>
                        <strong>${field.name}</strong>
                        <small class="text-muted ms-2">${field.field_type}</small>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editCustomField(${field.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteCustomField(${field.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                container.appendChild(fieldDiv);
            });
        });
}

// Notifications handling
function loadNotifications() {
    fetch('/api/notifications')
        .then(response => response.json())
        .then(notifications => {
            const container = document.querySelector('.notifications-container');
            const count = notifications.filter(n => !n.is_read).length;
            
            document.querySelector('.notification-count').textContent = count;
            
            if (notifications.length === 0) {
                container.innerHTML = '<div class="text-muted text-center p-3">No notifications</div>';
                return;
            }
            
            container.innerHTML = notifications.map(notification => `
                <div class="notification-item p-2 ${notification.is_read ? 'read' : 'unread'}">
                    <div class="d-flex justify-content-between">
                        <strong>${notification.type}</strong>
                        <small class="text-muted">${formatDate(notification.created_at)}</small>
                    </div>
                    <div>${notification.message}</div>
                    ${notification.link ? `<a href="${notification.link}" class="btn btn-sm btn-link">View</a>` : ''}
                </div>
            `).join('');
        });
}

// Utility functions
function showToast(type, message) {
    const toast = new bootstrap.Toast(document.getElementById('toast'));
    const toastBody = document.querySelector('.toast-body');
    toastBody.textContent = message;
    toast.show();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Nav link click handlers
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(e.target.closest('.nav-link').dataset.view);
        });
    });
    
    // Bulk actions type change handler
    document.getElementById('bulkActionType').addEventListener('change', updateBulkActionValueContent);
    
    // Initialize notifications
    loadNotifications();
    setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Quick filter handlers
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            this.classList.toggle('active');
            applyFilters();
        });
    });
});