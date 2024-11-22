// Help Center and Tooltips functionality

// Help content organized by feature
const helpContent = {
    general: {
        title: 'Getting Started',
        content: `
            <h5>Welcome to the Dish Machine Sales Tracker</h5>
            <p>This application helps you manage and track dish machine sales and installations efficiently. Here's a quick overview of the main features:</p>
            <ul>
                <li><strong>Dashboard:</strong> View key metrics and performance indicators</li>
                <li><strong>Installation Table:</strong> Manage and track all installations</li>
                <li><strong>Timeline View:</strong> Visualize installation progress over time</li>
                <li><strong>Bulk Actions:</strong> Update multiple installations at once</li>
                <li><strong>Advanced Filters:</strong> Find specific installations quickly</li>
            </ul>
        `
    },
    dashboard: {
        title: 'Using the Dashboard',
        content: `
            <h5>Dashboard Overview</h5>
            <p>The dashboard provides a quick overview of your installation status and performance metrics:</p>
            <ul>
                <li><strong>Total Installations:</strong> Overall count of installations</li>
                <li><strong>Completed:</strong> Number of completed installations</li>
                <li><strong>Pending:</strong> Installations awaiting completion</li>
                <li><strong>High Priority:</strong> Urgent installations (Priority 1-2)</li>
            </ul>
            <p>The charts show:</p>
            <ul>
                <li>Installation progress by status</li>
                <li>Salesperson performance metrics</li>
            </ul>
        `
    },
    installations: {
        title: 'Managing Installations',
        content: `
            <h5>Installation Management</h5>
            <p>The installation table lets you:</p>
            <ul>
                <li><strong>Add New:</strong> Click the "New Installation" button</li>
                <li><strong>Edit:</strong> Click the edit icon on any row</li>
                <li><strong>Delete:</strong> Use the delete icon (with confirmation)</li>
                <li><strong>Sort:</strong> Click column headers to sort</li>
                <li><strong>Filter:</strong> Use the filter inputs above the table</li>
            </ul>
            <p>Priority Levels:</p>
            <ul>
                <li><strong>1 - Highest:</strong> Urgent, immediate attention needed</li>
                <li><strong>2 - High:</strong> Time-sensitive</li>
                <li><strong>3 - Medium:</strong> Normal priority</li>
                <li><strong>4 - Low:</strong> Flexible timeline</li>
                <li><strong>5 - Lowest:</strong> No immediate rush</li>
            </ul>
        `
    },
    timeline: {
        title: 'Timeline View',
        content: `
            <h5>Using the Timeline View</h5>
            <p>The timeline view shows installation progress visually:</p>
            <ul>
                <li><strong>Events:</strong> Major milestones in the installation process</li>
                <li><strong>Progress:</strong> Visual indication of completion status</li>
                <li><strong>Filtering:</strong> Filter timeline by status or date range</li>
            </ul>
            <p>Event types include:</p>
            <ul>
                <li>Verbal Commitment</li>
                <li>Paperwork Complete</li>
                <li>Money Received</li>
                <li>Installation Complete</li>
            </ul>
        `
    },
    bulkActions: {
        title: 'Bulk Actions',
        content: `
            <h5>Using Bulk Actions</h5>
            <p>Perform actions on multiple installations at once:</p>
            <ul>
                <li><strong>Select Rows:</strong> Click checkboxes in the table</li>
                <li><strong>Update Status:</strong> Change status for selected installations</li>
                <li><strong>Update Priority:</strong> Change priority for selected installations</li>
                <li><strong>Delete:</strong> Remove multiple installations</li>
            </ul>
            <p>Tips:</p>
            <ul>
                <li>Use Shift+Click to select multiple consecutive rows</li>
                <li>Use Ctrl+Click to select non-consecutive rows</li>
                <li>Actions require confirmation to prevent accidents</li>
            </ul>
        `
    },
    filters: {
        title: 'Using Filters',
        content: `
            <h5>Advanced Filtering</h5>
            <p>Find installations quickly using various filters:</p>
            <ul>
                <li><strong>Quick Filters:</strong> Use filter chips for common queries</li>
                <li><strong>Status Filter:</strong> Filter by current status</li>
                <li><strong>Salesperson Filter:</strong> View specific salesperson's installations</li>
                <li><strong>Date Range:</strong> Filter by installation dates</li>
                <li><strong>Search:</strong> Search across all columns</li>
            </ul>
            <p>Active filters are displayed as chips and can be cleared individually or all at once.</p>
        `
    }
};

// Initialize help center functionality
function initializeHelpCenter() {
    // Add help button to navbar
    const navbarNav = document.getElementById('navbarNav');
    const helpButton = document.createElement('button');
    helpButton.className = 'btn btn-outline-light ms-2';
    helpButton.innerHTML = '<i class="fas fa-question-circle"></i> Help';
    helpButton.onclick = showHelpCenter;
    navbarNav.appendChild(helpButton);

    // Initialize feature-specific help buttons
    initializeFeatureHelp();

    // Initialize tooltips on help icons
    initializeHelpTooltips();
}

// Show the main help center modal
function showHelpCenter() {
    const helpLinks = Object.keys(helpContent).map(key => `
        <a href="#" class="list-group-item list-group-item-action" onclick="showHelpTopic('${key}')">
            ${helpContent[key].title}
        </a>
    `).join('');

    Swal.fire({
        title: 'Help Center',
        html: `
            <div class="row">
                <div class="col-md-4">
                    <div class="list-group">
                        ${helpLinks}
                    </div>
                </div>
                <div class="col-md-8">
                    <div id="helpContent">
                        ${helpContent.general.content}
                    </div>
                </div>
            </div>
        `,
        width: '80%',
        showCloseButton: true,
        showConfirmButton: false
    });
}

// Show specific help topic
function showHelpTopic(topic) {
    const content = helpContent[topic];
    if (content) {
        document.getElementById('helpContent').innerHTML = content.content;
    }
}

// Initialize context-sensitive help buttons
function initializeFeatureHelp() {
    // Add help icons to main feature sections
    const sections = {
        'dashboard': '.dashboard-card',
        'installations': '.table-responsive',
        'timeline': '#timelineView',
        'bulkActions': '.quick-actions',
        'filters': '.card.mb-4'
    };

    Object.entries(sections).forEach(([topic, selector]) => {
        const section = document.querySelector(selector);
        if (section) {
            const helpIcon = document.createElement('i');
            helpIcon.className = 'fas fa-info-circle text-muted help-icon';
            helpIcon.style.cursor = 'pointer';
            helpIcon.onclick = () => showHelpTopic(topic);
            section.appendChild(helpIcon);
        }
    });
}

// Initialize tooltips for help icons
function initializeHelpTooltips() {
    const tooltips = {
        'priority': 'Priority 1 is highest, 5 is lowest',
        'verbal_commit_date': 'Date when verbal commitment was received',
        'paperwork_date': 'Date when all paperwork was completed',
        'money_date': 'Date when payment was received',
        'installed_date': 'Date when installation was completed',
        'status': 'Current status of the installation'
    };

    Object.entries(tooltips).forEach(([field, text]) => {
        const element = document.getElementById(field);
        if (element) {
            element.setAttribute('data-bs-toggle', 'tooltip');
            element.setAttribute('data-bs-placement', 'top');
            element.setAttribute('title', text);
        }
    });
}

// Export functions
export {
    initializeHelpCenter,
    showHelpCenter,
    showHelpTopic
};