// Timeline view functionality

// Initialize timeline view
function initializeTimeline() {
    // Create timeline container if it doesn't exist
    let timelineContainer = document.getElementById('timelineView');
    if (!timelineContainer) {
        timelineContainer = document.createElement('div');
        timelineContainer.id = 'timelineView';
        timelineContainer.className = 'timeline-container card';
        timelineContainer.style.display = 'none';
        document.querySelector('.container-fluid').insertBefore(timelineContainer, document.querySelector('.table-responsive'));
    }
}

// Show timeline view
function showTimelineView() {
    const timelineContainer = document.getElementById('timelineView');
    const tableContainer = document.querySelector('.table-responsive');
    const filterCard = document.querySelector('.card.mb-4');

    // Toggle visibility
    if (timelineContainer.style.display === 'none') {
        fetchTimelineData().then(() => {
            timelineContainer.style.display = 'block';
            tableContainer.style.display = 'none';
            filterCard.style.display = 'none';
        });
    } else {
        timelineContainer.style.display = 'none';
        tableContainer.style.display = 'block';
        filterCard.style.display = 'block';
    }
}

// Fetch timeline data from the server
async function fetchTimelineData() {
    try {
        const response = await fetch('/api/timeline');
        const data = await response.json();
        renderTimeline(data);
    } catch (error) {
        console.error('Error fetching timeline data:', error);
        showToast('error', 'Failed to load timeline data');
    }
}

// Render timeline visualization
function renderTimeline(data) {
    const timelineContainer = document.getElementById('timelineView');
    timelineContainer.innerHTML = `
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-clock"></i> Installation Timeline</h5>
            <button class="btn btn-outline-secondary btn-sm" onclick="showTimelineView()">
                <i class="fas fa-table"></i> Show Table View
            </button>
        </div>
        <div class="card-body">
            <div class="timeline-controls mb-3">
                <div class="btn-group">
                    <button class="btn btn-outline-primary btn-sm" onclick="filterTimelineByStatus('all')">All</button>
                    <button class="btn btn-outline-primary btn-sm" onclick="filterTimelineByStatus('pending')">Pending</button>
                    <button class="btn btn-outline-primary btn-sm" onclick="filterTimelineByStatus('in-progress')">In Progress</button>
                    <button class="btn btn-outline-primary btn-sm" onclick="filterTimelineByStatus('complete')">Complete</button>
                </div>
            </div>
            <div class="timeline-scroll">
                ${generateTimelineHTML(data)}
            </div>
        </div>
    `;

    // Initialize tooltips for the timeline
    const tooltipTriggerList = [].slice.call(timelineContainer.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Generate HTML for timeline entries
function generateTimelineHTML(data) {
    if (!data || data.length === 0) {
        return '<p class="text-center text-muted">No timeline data available</p>';
    }

    return data.map(installation => {
        const events = installation.events.sort((a, b) => new Date(a.date) - new Date(b.date));
        const progressPercentage = calculateProgress(events);
        
        return `
            <div class="timeline-item ${installation.status.toLowerCase().replace(' ', '-')}">
                <div class="timeline-header">
                    <h6 class="mb-0">${installation.customer}</h6>
                    <small class="text-muted">Salesperson: ${installation.salesperson}</small>
                </div>
                <div class="timeline-progress">
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-${getStatusColor(installation.status)}" 
                             role="progressbar" 
                             style="width: ${progressPercentage}%" 
                             aria-valuenow="${progressPercentage}" 
                             aria-valuemin="0" 
                             aria-valuemax="100"></div>
                    </div>
                </div>
                <div class="timeline-events">
                    ${generateEventPoints(events)}
                </div>
                <div class="timeline-status">
                    <span class="badge bg-${getStatusColor(installation.status)}">${installation.status}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Generate event points for timeline
function generateEventPoints(events) {
    return events.map(event => {
        const date = new Date(event.date).toLocaleDateString();
        return `
            <div class="event-point" 
                 data-bs-toggle="tooltip" 
                 data-bs-placement="top" 
                 title="${event.description} - ${date}">
                <i class="fas fa-${getEventIcon(event.type)}"></i>
            </div>
        `;
    }).join('');
}

// Calculate installation progress percentage
function calculateProgress(events) {
    const steps = ['verbal', 'paperwork', 'money', 'installed'];
    const completedSteps = events.filter(event => steps.includes(event.type)).length;
    return (completedSteps / steps.length) * 100;
}

// Get appropriate icon for event type
function getEventIcon(type) {
    const icons = {
        'verbal': 'comments',
        'paperwork': 'file-alt',
        'money': 'dollar-sign',
        'installed': 'check-circle'
    };
    return icons[type] || 'circle';
}

// Get appropriate color for status
function getStatusColor(status) {
    const colors = {
        'Pending Salesperson': 'warning',
        'Pending Machine': 'info',
        'Pending Customer': 'primary',
        'Complete': 'success'
    };
    return colors[status] || 'secondary';
}

// Filter timeline by status
function filterTimelineByStatus(status) {
    const items = document.querySelectorAll('.timeline-item');
    items.forEach(item => {
        if (status === 'all' || item.classList.contains(status)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Export functions
export {
    initializeTimeline,
    showTimelineView,
    filterTimelineByStatus
};