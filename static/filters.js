// Advanced filtering functionality

// Initialize filter functionality
function initializeFilters() {
    // Quick filter chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', handleFilterChipClick);
    });

    // Status filter dropdown
    const statusFilter = document.getElementById('statusFilter');
    statusFilter.addEventListener('change', applyFilters);

    // Salesperson filter dropdown
    const salespersonFilter = document.getElementById('salespersonFilter');
    salespersonFilter.addEventListener('change', applyFilters);

    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(applyFilters, 300));

    // Date range filter initialization
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    if (dateRangeFilter) {
        $(dateRangeFilter).daterangepicker({
            autoUpdateInput: false,
            locale: {
                cancelLabel: 'Clear'
            }
        });

        $(dateRangeFilter).on('apply.daterangepicker', function(ev, picker) {
            $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
            applyFilters();
        });

        $(dateRangeFilter).on('cancel.daterangepicker', function(ev, picker) {
            $(this).val('');
            applyFilters();
        });
    }

    // Populate salesperson filter dropdown with unique values
    populateSalespersonFilter();
}

// Handle filter chip clicks
function handleFilterChipClick(event) {
    const chip = event.currentTarget;
    const filter = chip.dataset.filter;

    // Toggle active state
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    // Apply the filter
    applyQuickFilter(filter);
}

// Apply quick filters
function applyQuickFilter(filter) {
    $.fn.dataTable.ext.search.pop(); // Remove any existing quick filter

    if (filter !== 'all') {
        $.fn.dataTable.ext.search.push((settings, data) => {
            const status = data[8]; // Status column
            const priority = parseInt(data[0]); // Priority column
            const installedDate = data[7]; // Installed date column

            switch (filter) {
                case 'pending':
                    return status.includes('Pending');
                case 'in-progress':
                    return !status.includes('Complete') && !status.includes('Pending');
                case 'complete':
                    return status === 'Complete';
                case 'high-priority':
                    return priority <= 2;
                case 'today':
                    return isToday(installedDate);
                case 'week':
                    return isThisWeek(installedDate);
                default:
                    return true;
            }
        });
    }

    installationsTable.draw();
}

// Apply all filters
function applyFilters() {
    const status = document.getElementById('statusFilter').value;
    const salesperson = document.getElementById('salespersonFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    const dateRange = document.getElementById('dateRangeFilter')?.value;

    installationsTable.search('').columns().search('').draw(); // Clear existing filters

    // Apply status filter
    if (status) {
        installationsTable.column(8).search(status).draw();
    }

    // Apply salesperson filter
    if (salesperson) {
        installationsTable.column(1).search(salesperson).draw();
    }

    // Apply search filter
    if (search) {
        installationsTable.search(search).draw();
    }

    // Apply date range filter
    if (dateRange) {
        const [start, end] = dateRange.split(' - ').map(date => new Date(date));
        $.fn.dataTable.ext.search.push((settings, data) => {
            const installedDate = new Date(data[7]);
            return (!start || installedDate >= start) && (!end || installedDate <= end);
        });
        installationsTable.draw();
    }
}

// Populate salesperson filter with unique values
function populateSalespersonFilter() {
    const salespersonFilter = document.getElementById('salespersonFilter');
    const salespeople = new Set();

    installationsTable.column(1).data().each(function(value) {
        if (value) salespeople.add(value);
    });

    salespeople.forEach(person => {
        const option = document.createElement('option');
        option.value = person;
        option.textContent = person;
        salespersonFilter.appendChild(option);
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function isToday(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function isThisWeek(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(firstDay);
    lastDay.setDate(lastDay.getDate() + 6);
    return date >= firstDay && date <= lastDay;
}

// Export functions
export {
    initializeFilters,
    applyFilters,
    populateSalespersonFilter
};