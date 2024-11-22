let installationsTable;
let editing = false;

$(document).ready(function() {
    installationsTable = $('#installationsTable').DataTable({
        order: [[0, 'asc']],
        columns: [
            { data: 'priority' },
            { data: 'salesperson' },
            { data: 'customer' },
            { data: 'machine_model' },
            { data: 'verbal_commit_date' },
            { data: 'paperwork_date' },
            { data: 'money_date' },
            { data: 'installed_date' },
            { data: 'status' },
            { data: 'notes' },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-primary" onclick="editInstallation(${data.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteInstallation(${data.id})">Delete</button>
                    `;
                }
            }
        ],
        createdRow: function(row, data) {
            $(row).addClass('priority-' + data.priority);
        }
    });

    loadInstallations();
    updateSalespersonFilter();

    $('#statusFilter, #salespersonFilter').on('change', function() {
        installationsTable.draw();
    });

    $('#searchInput').on('keyup', function() {
        installationsTable.search(this.value).draw();
    });

    $.fn.dataTable.ext.search.push(function(settings, data) {
        const statusFilter = $('#statusFilter').val();
        const salespersonFilter = $('#salespersonFilter').val();
        
        if (statusFilter && data[8] !== statusFilter) return false;
        if (salespersonFilter && data[1] !== salespersonFilter) return false;
        
        return true;
    });
});

function loadInstallations() {
    fetch('/api/installations')
        .then(response => response.json())
        .then(data => {
            installationsTable.clear().rows.add(data).draw();
            updateSalespersonFilter();
        });
}

function updateSalespersonFilter() {
    const salespersons = new Set();
    installationsTable.data().each(function(data) {
        salespersons.add(data.salesperson);
    });

    const select = $('#salespersonFilter');
    select.find('option:not(:first)').remove();
    Array.from(salespersons).sort().forEach(sp => {
        select.append($('<option>').val(sp).text(sp));
    });
}

function showAddModal() {
    editing = false;
    $('#modalTitle').text('Add Installation');
    $('#installationForm')[0].reset();
    $('#installId').val('');
    $('#installationModal').modal('show');
}

function editInstallation(id) {
    editing = true;
    const data = installationsTable.rows().data().toArray().find(row => row.id === id);
    
    $('#modalTitle').text('Edit Installation');
    $('#installId').val(id);
    $('#priority').val(data.priority);
    $('#salesperson').val(data.salesperson);
    $('#customer').val(data.customer);
    $('#machine_model').val(data.machine_model);
    $('#verbal_commit_date').val(data.verbal_commit_date);
    $('#paperwork_date').val(data.paperwork_date);
    $('#money_date').val(data.money_date);
    $('#installed_date').val(data.installed_date);
    $('#status').val(data.status);
    $('#notes').val(data.notes);
    
    $('#installationModal').modal('show');
}

function saveInstallation() {
    const formData = {
        priority: parseInt($('#priority').val()),
        salesperson: $('#salesperson').val(),
        customer: $('#customer').val(),
        machine_model: $('#machine_model').val(),
        verbal_commit_date: $('#verbal_commit_date').val(),
        paperwork_date: $('#paperwork_date').val(),
        money_date: $('#money_date').val(),
        installed_date: $('#installed_date').val(),
        status: $('#status').val(),
        notes: $('#notes').val()
    };

    const url = editing ? `/api/installations/${$('#installId').val()}` : '/api/installations';
    const method = editing ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(() => {
        $('#installationModal').modal('hide');
        loadInstallations();
    });
}

function deleteInstallation(id) {
    if (confirm('Are you sure you want to delete this installation?')) {
        fetch(`/api/installations/${id}`, {
            method: 'DELETE'
        })
        .then(() => loadInstallations());
    }
}

function exportToExcel() {
    window.location.href = '/api/export';
}