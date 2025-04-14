document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const dataDirectionRadios = document.querySelectorAll('input[name="dataDirection"]');
    const clickhouseSourceConfig = document.getElementById('clickhouseSourceConfig');
    const flatfileSourceConfig = document.getElementById('flatfileSourceConfig');
    const tableSelectionCard = document.getElementById('tableSelectionCard');
    const multiTableJoinCard = document.getElementById('multiTableJoinCard');
    const columnSelectionCard = document.getElementById('columnSelectionCard');
    const targetConfigCard = document.getElementById('targetConfigCard');
    const clickhouseTargetConfig = document.getElementById('clickhouseTargetConfig');
    const flatfileTargetConfig = document.getElementById('flatfileTargetConfig');
    const actionsCard = document.getElementById('actionsCard');
    const previewCard = document.getElementById('previewCard');
    const statusCard = document.getElementById('statusCard');
    
    // Buttons
    const connectClickhouseBtn = document.getElementById('connectClickhouse');
    const loadFlatFileBtn = document.getElementById('loadFlatFile');
    const loadColumnsBtn = document.getElementById('loadColumns');
    const enableJoinCheckbox = document.getElementById('enableJoin');
    const joinTablesSection = document.getElementById('joinTablesSection');
    const loadJoinColumnsBtn = document.getElementById('loadJoinColumns');
    const selectAllColumnsBtn = document.getElementById('selectAllColumns');
    const deselectAllColumnsBtn = document.getElementById('deselectAllColumns');
    const previewDataBtn = document.getElementById('previewData');
    const startIngestionBtn = document.getElementById('startIngestion');
    
    // State
    let currentDataDirection = 'clickhouseToFlatfile';
    let clickhouseConfig = {};
    let flatfileConfig = {};
    let availableTables = [];
    let selectedTables = [];
    let joinCondition = '';
    let availableColumns = [];
    let selectedColumns = [];
    let previewData = null;
    
    // Handle data direction change
    dataDirectionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            currentDataDirection = this.value;
            updateUI();
        });
    });
    
    // Initialize UI
    function updateUI() {
        // Reset cards
        resetCards();
        
        // Show appropriate source config
        if (currentDataDirection === 'clickhouseToFlatfile') {
            clickhouseSourceConfig.classList.remove('hidden');
            flatfileSourceConfig.classList.add('hidden');
        } else {
            clickhouseSourceConfig.classList.add('hidden');
            flatfileSourceConfig.classList.remove('hidden');
        }
        
        // Update target config header
        const targetConfigHeader = document.getElementById('targetConfigHeader');
        if (targetConfigHeader) {
            targetConfigHeader.textContent = currentDataDirection === 'clickhouseToFlatfile' 
                ? 'Flat File Output' 
                : 'ClickHouse Target';
        }
    }
    
    function resetCards() {
        // Hide all optional cards
        tableSelectionCard.classList.add('hidden');
        multiTableJoinCard.classList.add('hidden');
        columnSelectionCard.classList.add('hidden');
        targetConfigCard.classList.add('hidden');
        actionsCard.classList.add('hidden');
        previewCard.classList.add('hidden');
        
        // Reset join checkbox
        enableJoinCheckbox.checked = false;
        joinTablesSection.classList.add('hidden');
        
        // Clear containers
        document.getElementById('columnsContainer').innerHTML = '';
        document.getElementById('joinTablesContainer').innerHTML = '';
        document.getElementById('previewTableHead').innerHTML = '';
        document.getElementById('previewTableBody').innerHTML = '';
    }
    
    // Connect to ClickHouse
    connectClickhouseBtn.addEventListener('click', async function() {
        updateStatus('Connecting to ClickHouse...');
        
        clickhouseConfig = {
            host: document.getElementById('clickhouseHost').value || 'localhost',
            port: document.getElementById('clickhousePort').value || '9000',
            database: document.getElementById('clickhouseDatabase').value || 'default',
            user: document.getElementById('clickhouseUser').value || 'default',
            jwt_token: document.getElementById('clickhouseJwtToken').value || ''
        };
        
        try {
            const response = await fetch('/api/connect-clickhouse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clickhouseConfig)
            });
            
            const data = await response.json();
            
            if (data.success) {
                updateStatus('Connected to ClickHouse successfully');
                availableTables = data.tables;
                
                // Populate table dropdown
                const tableSelect = document.getElementById('tableSelect');
                tableSelect.innerHTML = '<option value="" selected disabled>Select a table</option>';
                
                availableTables.forEach(table => {
                    const option = document.createElement('option');
                    option.value = table;
                    option.textContent = table;
                    tableSelect.appendChild(option);
                });
                
                // Show table selection
                tableSelectionCard.classList.remove('hidden');
                
                // If source is ClickHouse, show multi-table join option
                if (currentDataDirection === 'clickhouseToFlatfile') {
                    multiTableJoinCard.classList.remove('hidden');
                    
                    // Populate join tables section
                    const joinTablesContainer = document.getElementById('joinTablesContainer');
                    joinTablesContainer.innerHTML = '';
                    
                    availableTables.forEach(table => {
                        const div = document.createElement('div');
                        div.className = 'form-check';
                        
                        const input = document.createElement('input');
                        input.className = 'form-check-input join-table-checkbox';
                        input.type = 'checkbox';
                        input.id = `join-table-${table}`;
                        input.value = table;
                        
                        const label = document.createElement('label');
                        label.className = 'form-check-label';
                        label.htmlFor = `join-table-${table}`;
                        label.textContent = table;
                        
                        div.appendChild(input);
                        div.appendChild(label);
                        joinTablesContainer.appendChild(div);
                    });
                }
            } else {
                updateStatus(`Connection failed: ${data.error}`);
            }
        } catch (error) {
            updateStatus(`Error: ${error.message}`);
        }
    });
    
    // Load Flat File
    loadFlatFileBtn.addEventListener('click', async function() {
        updateStatus('Loading flat file columns...');
        
        flatfileConfig = {
            filePath: document.getElementById('flatFilePath').value,
            delimiter: document.getElementById('delimiter').value || ','
        };
        
        try {
            const response = await fetch('/api/get-flatfile-columns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(flatfileConfig)
            });
            
            const data = await response.json();
            
            if (data.success) {
                updateStatus('Loaded flat file columns successfully');
                availableColumns = data.columns;
                
                // Populate columns checkboxes
                populateColumnCheckboxes(availableColumns);
                
                // Show column selection
                columnSelectionCard.classList.remove('hidden');
                
                // Show target config
                targetConfigCard.classList.remove('hidden');
                
                // Show appropriate target config
                if (currentDataDirection === 'flatfileToClickhouse') {
                    clickhouseTargetConfig.classList.remove('hidden');
                    flatfileTargetConfig.classList.add('hidden');
                } else {
                    clickhouseTargetConfig.classList.add('hidden');
                    flatfileTargetConfig.classList.remove('hidden');
                }
                
                // Show actions
                actionsCard.classList.remove('hidden');
                
                // Show status
                statusCard.classList.remove('hidden');
            } else {
                updateStatus(`Failed to load flat file: ${data.error}`);
            }
        } catch (error) {
            updateStatus(`Error: ${error.message}`);
        }
    });
    
    // Load Columns
    loadColumnsBtn.addEventListener('click', async function() {
        const selectedTable = document.getElementById('tableSelect').value;
        
        if (!selectedTable) {
            updateStatus('Please select a table first');
            return;
        }
        
        updateStatus('Loading table columns...');
        
        try {
            const response = await fetch('/api/get-table-columns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...clickhouseConfig,
                    table: selectedTable
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                updateStatus('Loaded table columns successfully');
                availableColumns = data.columns;
                
                // Populate columns checkboxes
                populateColumnCheckboxes(availableColumns);
                
                // Show column selection
                columnSelectionCard.classList.remove('hidden');
                
                // Show target config
                targetConfigCard.classList.remove('hidden');
                
                // Show appropriate target config
                if (currentDataDirection === 'clickhouseToFlatfile') {
                    clickhouseTargetConfig.classList.add('hidden');
                    flatfileTargetConfig.classList.remove('hidden');
                } else {
                    clickhouseTargetConfig.classList.remove('hidden');
                    flatfileTargetConfig.classList.add('hidden');
                }
                
                // Show actions
                actionsCard.classList.remove('hidden');
                
                // Show status
                statusCard.classList.remove('hidden');
            } else {
                updateStatus(`Failed to load columns: ${data.error}`);
            }
        } catch (error) {
            updateStatus(`Error: ${error.message}`);
        }
    });
    
    // Toggle Join Tables
    enableJoinCheckbox.addEventListener('change', function() {
        if (this.checked) {
            joinTablesSection.classList.remove('hidden');
        } else {
            joinTablesSection.classList.add('hidden');
        }
    });
    
    // Load Join Columns
    loadJoinColumnsBtn.addEventListener('click', async function() {
        // Get selected tables
        selectedTables = Array.from(document.querySelectorAll('.join-table-checkbox:checked'))
            .map(checkbox => checkbox.value);
        
        // Get join condition
        joinCondition = document.getElementById('joinCondition').value;
        
        if (selectedTables.length < 2) {
            updateStatus('Please select at least two tables for join');
            return;
        }
        
        if (!joinCondition) {
            updateStatus('Please specify join condition');
            return;
        }
        
        updateStatus('Loading join columns...');
        
        // Get all columns from all selected tables
        try {
            const allColumns = [];
            
            for (const table of selectedTables) {
                const response = await fetch('/api/get-table-columns', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...clickhouseConfig,
                        table: table
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Add table name prefix to column names
                    data.columns.forEach(col => {
                        allColumns.push({
                            name: `${table}.${col.name}`,
                            type: col.type
                        });
                    });
                } else {
                    updateStatus(`Failed to load columns for table ${table}: ${data.error}`);
                    return;
                }
            }
            
            updateStatus('Loaded join columns successfully');
            availableColumns = allColumns;
            
            // Populate columns checkboxes
            populateColumnCheckboxes(availableColumns);
            
            // Show column selection
            columnSelectionCard.classList.remove('hidden');
            
            // Show target config
            targetConfigCard.classList.remove('hidden');
            clickhouseTargetConfig.classList.add('hidden');
            flatfileTargetConfig.classList.remove('hidden');
            
            // Show actions
            actionsCard.classList.remove('hidden');
            
            // Show status
            statusCard.classList.remove('hidden');
        } catch (error) {
            updateStatus(`Error: ${error.message}`);
        }
    });
    
    // Select/Deselect All Columns
    selectAllColumnsBtn.addEventListener('click', function() {
        document.querySelectorAll('.column-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
    });
    
    deselectAllColumnsBtn.addEventListener('click', function() {
        document.querySelectorAll('.column-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    });
    
    // Preview Data
    previewDataBtn.addEventListener('click', async function() {
        // Get selected columns
        selectedColumns = Array.from(document.querySelectorAll('.column-checkbox:checked'))
            .map(checkbox => checkbox.value);
        
        if (selectedColumns.length === 0) {
            updateStatus('Please select at least one column');
            return;
        }
        
        updateStatus('Loading data preview...');
        
        try {
            let response;
            
            if (currentDataDirection === 'clickhouseToFlatfile') {
                if (enableJoinCheckbox.checked) {
                    // Get selected tables
                    selectedTables = Array.from(document.querySelectorAll('.join-table-checkbox:checked'))
                        .map(checkbox => checkbox.value);
                    
                    // Get join condition
                    joinCondition = document.getElementById('joinCondition').value;
                    
                    if (selectedTables.length < 2) {
                        updateStatus('Please select at least two tables for join');
                        return;
                    }
                    
                    if (!joinCondition) {
                        updateStatus('Please specify join condition');
                        return;
                    }
                    
                    // This is a join preview
                    response = await fetch('/api/preview-data', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            sourceType: 'clickhouse',
                            ...clickhouseConfig,
                            isJoin: true,
                            tables: selectedTables,
                            joinCondition: joinCondition,
                            selectedColumns: selectedColumns
                        })
                    });
                } else {
                    // This is a single table preview
                    response = await fetch('/api/preview-data', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            sourceType: 'clickhouse',
                            ...clickhouseConfig,
                            table: document.getElementById('tableSelect').value,
                            selectedColumns: selectedColumns
                        })
                    });
                }
            } else {
                // This is a flat file preview
                response = await fetch('/api/preview-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sourceType: 'flatfile',
                        ...flatfileConfig,
                        selectedColumns: selectedColumns
                    })
                });
            }
            
            const data = await response.json();
            
            if (data.success) {
                updateStatus('Preview loaded successfully');
                
                // Store preview data
                previewData = data;
                
                // Populate preview table
                populatePreviewTable(data.columns, data.data);
                
                // Show preview card
                previewCard.classList.remove('hidden');
            } else {
                updateStatus(`Failed to load preview: ${data.error}`);
            }
        } catch (error) {
            updateStatus(`Error: ${error.message}`);
        }
    });
    
    // Start Ingestion
    startIngestionBtn.addEventListener('click', async function() {
        // Get selected columns
        selectedColumns = Array.from(document.querySelectorAll('.column-checkbox:checked'))
            .map(checkbox => checkbox.value);
        
        if (selectedColumns.length === 0) {
            updateStatus('Please select at least one column');
            return;
        }
        
        updateStatus('Starting data ingestion...');
        showProgressBar();
        
        try {
            let response;
            
            if (currentDataDirection === 'clickhouseToFlatfile') {
                const outputFile = document.getElementById('outputFilePath').value;
                const delimiter = document.getElementById('outputDelimiter').value || ',';
                
                if (!outputFile) {
                    updateStatus('Please specify output file path');
                    hideProgressBar();
                    return;
                }
                
                if (enableJoinCheckbox.checked) {
                    // This is a join ingestion
                    response = await fetch('/api/clickhouse-join-to-flatfile', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...clickhouseConfig,
                            tables: selectedTables,
                            joinCondition: joinCondition,
                            selectedColumns: selectedColumns,
                            outputFile: outputFile,
                            delimiter: delimiter
                        })
                    });
                } else {
                    // This is a single table ingestion
                    response = await fetch('/api/clickhouse-to-flatfile', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...clickhouseConfig,
                            table: document.getElementById('tableSelect').value,
                            selectedColumns: selectedColumns,
                            outputFile: outputFile,
                            delimiter: delimiter
                        })
                    });
                }
            } else {
                // This is a flat file to ClickHouse ingestion
                const targetTable = document.getElementById('clickhouseTargetTable').value;
                
                if (!targetTable) {
                    updateStatus('Please specify target table name');
                    hideProgressBar();
                    return;
                }
                
                response = await fetch('/api/flatfile-to-clickhouse', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...clickhouseConfig,
                        targetTable: targetTable,
                        ...flatfileConfig,
                        selectedColumns: selectedColumns
                    })
                });
            }
            
            const data = await response.json();
            
            hideProgressBar();
            
            if (data.success) {
                updateStatus('Ingestion completed successfully');
                document.getElementById('result').innerHTML = `
                    <div class="alert alert-success">
                        ${data.message}
                    </div>
                `;
            } else {
                updateStatus(`Ingestion failed: ${data.error}`);
                document.getElementById('result').innerHTML = `
                    <div class="alert alert-danger">
                        ${data.error}
                    </div>
                `;
            }
        } catch (error) {
            hideProgressBar();
            updateStatus(`Error: ${error.message}`);
            document.getElementById('result').innerHTML = `
                <div class="alert alert-danger">
                    ${error.message}
                </div>
            `;
        }
    });
    
    // Helper Functions
    function populateColumnCheckboxes(columns) {
        const columnsContainer = document.getElementById('columnsContainer');
        columnsContainer.innerHTML = '';
        
        columns.forEach(column => {
            const div = document.createElement('div');
            div.className = 'form-check';
            
            const input = document.createElement('input');
            input.className = 'form-check-input column-checkbox';
            input.type = 'checkbox';
            input.id = `column-${column.name}`;
            input.value = column.name;
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `column-${column.name}`;
            label.textContent = `${column.name} (${column.type})`;
            
            div.appendChild(input);
            div.appendChild(label);
            columnsContainer.appendChild(div);
        });
    }
    
    function populatePreviewTable(columns, data) {
        const previewTableHead = document.getElementById('previewTableHead');
        const previewTableBody = document.getElementById('previewTableBody');
        
        // Clear previous content
        previewTableHead.innerHTML = '';
        previewTableBody.innerHTML = '';
        
        // Create header row
        const headerRow = document.createElement('tr');
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            headerRow.appendChild(th);
        });
        previewTableHead.appendChild(headerRow);
        
        // Create data rows
        data.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            previewTableBody.appendChild(tr);
        });
    }
    
    function updateStatus(message) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusCard.classList.remove('hidden');
    }
    
    function showProgressBar() {
        const progressBar = document.getElementById('progressBar');
        progressBar.classList.remove('hidden');
        const progressBarInner = progressBar.querySelector('.progress-bar');
        progressBarInner.style.width = '100%';
    }
    
    function hideProgressBar() {
        const progressBar = document.getElementById('progressBar');
        progressBar.classList.add('hidden');
    }
    
    // Initialize UI
    updateUI();
}); 