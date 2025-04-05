/**
 * results-display.js
 * Handles displaying calculation results in various formats based on the module type.
 */

/**
 * Displays results based on the result type and module
 * @param {HTMLElement} container - The container to display results in
 * @param {Object} result - The result object from a calculation
 * @param {string} moduleType - The type of module that generated the result
 */
function displayResults(container, result, moduleType) {
    // Clear previous results
    container.innerHTML = '';
    
    if (!result) {
        container.innerHTML = '<div class="alert alert-warning">No results to display.</div>';
        return;
    }
    
    // Handle errors
    if (result.error) {
        displayError(container, result.error);
        return;
    }
    
    // Choose display method based on module type
    switch (moduleType) {
        case 'truth-table':
            displayTruthTable(container, result);
            break;
        case 'satisfiability':
            displaySatisfiability(container, result);
            break;
        case 'subformula':
            displaySubformula(container, result);
            break;
        case 'unit-propagation':
            displayUnitPropagation(container, result);
            break;
        case 'interpretation':
            displayInterpretation(container, result);
            break;
        case 'polarity':
            displayPolarity(container, result);
            break;
        case 'cnf-determinism':
        case 'general-determinism':
            displayDeterminism(container, result);
            break;
        case 'pure-atom':
            displayPureAtom(container, result);
            break;
        case 'tseytin':
            displayTseytin(container, result);
            break;
        default:
            // Generic display for unknown module types
            displayGeneric(container, result);
    }
}

/**
 * Displays an error message
 * @param {HTMLElement} container - The container to display the error in
 * @param {string} message - The error message
 */
function displayError(container, message) {
    container.innerHTML = `
        <div class="alert alert-danger">
            <strong>Error:</strong> ${message}
        </div>
    `;
}

/**
 * Displays a truth table
 * @param {HTMLElement} container - The container to display the table in
 * @param {Object} result - The truth table result
 */
function displayTruthTable(container, result) {
    const { variables, rows, formula } = result;
    
    // Create formula header
    const formulaHeader = document.createElement('h5');
    formulaHeader.textContent = `Truth table for: ${formula}`;
    container.appendChild(formulaHeader);
    
    // Create table
    const table = document.createElement('table');
    table.className = 'table table-bordered table-sm truth-table';
    
    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Add variable headers
    variables.forEach(variable => {
        const th = document.createElement('th');
        th.textContent = variable;
        headerRow.appendChild(th);
    });
    
    // Add formula header
    const formulaTh = document.createElement('th');
    formulaTh.textContent = formula;
    headerRow.appendChild(formulaTh);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Add rows
    rows.forEach(row => {
        const tr = document.createElement('tr');
        
        // Add variable values
        variables.forEach(variable => {
            const td = document.createElement('td');
            td.textContent = row.assignment[variable] ? 'T' : 'F';
            tr.appendChild(td);
        });
        
        // Add result value
        const resultTd = document.createElement('td');
        resultTd.textContent = row.result ? 'T' : 'F';
        resultTd.className = row.result ? 'bg-success text-white' : 'bg-danger text-white';
        tr.appendChild(resultTd);
        
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    // Add summary
    const summary = document.createElement('div');
    summary.className = 'mt-3';
    
    const trueCount = rows.filter(row => row.result).length;
    const totalCount = rows.length;
    
    let status = '';
    if (trueCount === 0) {
        status = '<span class="badge bg-danger">Contradiction (Unsatisfiable)</span>';
    } else if (trueCount === totalCount) {
        status = '<span class="badge bg-success">Tautology (Valid)</span>';
    } else {
        status = '<span class="badge bg-warning text-dark">Satisfiable but not Valid</span>';
    }
    
    summary.innerHTML = `
        <p><strong>Summary:</strong> ${trueCount} of ${totalCount} interpretations are true (${Math.round(trueCount/totalCount*100)}%)</p>
        <p><strong>Status:</strong> ${status}</p>
    `;
    
    container.appendChild(summary);
}

/**
 * Displays satisfiability result
 * @param {HTMLElement} container - The container to display the result in
 * @param {Object} result - The satisfiability result
 */
function displaySatisfiability(container, result) {
    const { status, formula, model } = result;
    
    // Create result header
    const header = document.createElement('h5');
    header.textContent = `Satisfiability check for: ${formula}`;
    container.appendChild(header);
    
    // Create status card
    const statusCard = document.createElement('div');
    
    let badgeClass = '';
    let statusText = '';
    
    switch (status) {
        case 'unsatisfiable':
            badgeClass = 'bg-danger';
            statusText = 'Unsatisfiable (Contradiction)';
            break;
        case 'valid':
            badgeClass = 'bg-success';
            statusText = 'Valid (Tautology)';
            break;
        case 'satisfiable':
            badgeClass = 'bg-warning text-dark';
            statusText = 'Satisfiable but not Valid';
            break;
    }
    
    statusCard.innerHTML = `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">Result</h5>
                <p class="card-text">
                    <span class="badge ${badgeClass}">${statusText}</span>
                </p>
            </div>
        </div>
    `;
    
    container.appendChild(statusCard);
    
    /*
    // If satisfiable, show a satisfying assignment
    if (status === 'satisfiable' || status === 'valid') {
        const modelCard = document.createElement('div');
        modelCard.className = 'card';
        
        let modelHtml = '<ul class="list-group list-group-flush">';
        for (const [variable, value] of Object.entries(model)) {
            modelHtml += `
                <li class="list-group-item">
                    ${variable} = ${value ? 'T' : 'F'}
                </li>
            `;
        }
        modelHtml += '</ul>';
        
        modelCard.innerHTML = `
            <div class="card-header">
                <h5 class="mb-0">Sample Satisfying Assignment</h5>
            </div>
            <div class="card-body">
                ${modelHtml}
            </div>
        `; 
        
        container.appendChild(modelCard);
    }*/
}

/**
 * Displays subformula result
 * @param {HTMLElement} container - The container to display the result in
 * @param {Object} result - The subformula result
 */
function displaySubformula(container, result) {
    const { formula, position, subformula } = result;
    
    const resultCard = document.createElement('div');
    resultCard.className = 'card';
    
    resultCard.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">Subformula Result</h5>
            <p class="card-text">Original formula: <strong>${formula}</strong></p>
            <p class="card-text">Position: <code>${position}</code></p>
            <p class="card-text">Subformula: <strong>${subformula}</strong></p>
        </div>
    `;
    
    container.appendChild(resultCard);
}

/**
 * Displays unit propagation steps
 * @param {HTMLElement} container - The container to display the steps in
 * @param {Object} result - The unit propagation result
 */
function displayUnitPropagation(container, result) {
    const { formula, steps, finalClauses, literals } = result;
    
    // Display original formula
    const header = document.createElement('h5');
    header.textContent = `Unit Propagation for: ${formula}`;
    container.appendChild(header);
    
    // Display propagation steps
    const stepsCard = document.createElement('div');
    stepsCard.className = 'card mb-3';
    
    let stepsHtml = '<ol class="list-group list-group-numbered">';
    steps.forEach(step => {
        stepsHtml += `
            <li class="list-group-item">
                <div class="fw-bold">Propagated: ${step.literal}</div>
                <div>Clauses before: ${step.beforeClauses.join(', ')}</div>
                <div>Clauses after: ${step.afterClauses.join(', ')}</div>
            </li>
        `;
    });
    stepsHtml += '</ol>';
    
    stepsCard.innerHTML = `
        <div class="card-header">
            <h5 class="mb-0">Propagation Steps</h5>
        </div>
        <div class="card-body">
            ${steps.length > 0 ? stepsHtml : '<p>No unit propagation steps were performed.</p>'}
        </div>
    `;
    
    container.appendChild(stepsCard);
    
    // Display final state
    const resultCard = document.createElement('div');
    resultCard.className = 'card';
    
    let literalsHtml = '';
    if (literals && literals.length > 0) {
        literalsHtml = `
            <div class="mb-3">
                <h6>Propagated Literals:</h6>
                <ul>
                    ${literals.map(lit => `<li>${lit}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    resultCard.innerHTML = `
        <div class="card-header">
            <h5 class="mb-0">Final Result</h5>
        </div>
        <div class="card-body">
            ${literalsHtml}
            <div>
                <h6>Remaining Clauses:</h6>
                ${finalClauses.length > 0 
                    ? `<ul>${finalClauses.map(clause => `<li>${clause}</li>`).join('')}</ul>`
                    : '<p>No clauses remain. Formula is satisfied!</p>'
                }
            </div>
            <div>
                <h6>Formatted Result:</h6>
                ${finalClauses.length > 0 
                    ? `<code class="d-block p-3 bg-light">${result.formattedResult}</code>`
                    : '<p>No clauses remain. Formula is satisfied!</p>'
                }
            </div>
        </div>
    `;
    
    container.appendChild(resultCard);
}

/**
 * Displays interpretation testing result
 * @param {HTMLElement} container - The container to display the result in
 * @param {Object} result - The interpretation result
 */
function displayInterpretation(container, result) {
    const { formula, interpretation, statement, isValid } = result;
    
    const resultCard = document.createElement('div');
    resultCard.className = 'card';
    
    resultCard.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">Interpretation Test Result</h5>
            <p class="card-text">Formula: <strong>${formula}</strong></p>
            <p class="card-text">Interpretation: <strong>${interpretation}</strong></p>
            <p class="card-text">Statement: <strong>${statement}</strong></p>
            <div class="mt-3">
                <p class="card-text">
                    Result: 
                    <span class="badge ${isValid ? 'bg-success' : 'bg-danger'}">
                        ${isValid ? 'Valid' : 'Invalid'}
                    </span>
                </p>
                <p class="card-text">
                    ${isValid 
                        ? 'The statement is valid under the given interpretation.' 
                        : 'The statement is not valid under the given interpretation.'}
                </p>
            </div>
        </div>
    `;
    
    container.appendChild(resultCard);
}

/**
 * Displays polarity result
 * @param {HTMLElement} container - The container to display the result in
 * @param {Object} result - The polarity result
 */
function displayPolarity(container, result) {
    const { formula, position, polarity, subformula, formattedTree } = result;
    
    // Create result header
    const header = document.createElement('h5');
    header.textContent = `Polarity calculation for: ${formula}`;
    container.appendChild(header);
    
    // Create result card
    const resultCard = document.createElement('div');
    resultCard.className = 'card mb-3';
    
    let polarityClass = '';
    if (polarity === 'positive') {
        polarityClass = 'bg-success text-white';
    } else if (polarity === 'negative') {
        polarityClass = 'bg-danger text-white';
    } else {
        polarityClass = 'bg-warning';
    }
    
    resultCard.innerHTML = `
        <div class="card-header">
            Results
        </div>
        <div class="card-body">
            <p><strong>Position:</strong> ${position || 'root'}</p>
            <p><strong>Subformula:</strong> ${subformula}</p>
            <p><strong>Polarity:</strong> <span class="badge ${polarityClass}">${polarity}</span></p>
        </div>
    `;
    
    container.appendChild(resultCard);
    
    // Create tree visualization
    const treeCard = document.createElement('div');
    treeCard.className = 'card mb-3';
    
    treeCard.innerHTML = `
        <div class="card-header">
            Formula Tree with Polarity
        </div>
        <div class="card-body">
            <pre class="formula-tree-display">${formattedTree}</pre>
        </div>
    `;
    
    container.appendChild(treeCard);
    
    // Make tree container visible to ensure tree is displayed
    const treeContainer = document.getElementById('tree-container');
    if (treeContainer) {
        treeContainer.classList.remove('d-none');
        // Also add the formatted tree to the tree container for visibility in both places
        treeContainer.innerHTML = `<pre class="formula-tree-display">${formattedTree}</pre>`;
    }
}

/**
 * Displays determinism results
 * @param {HTMLElement} container - The container to display the result in
 * @param {Object} result - The determinism result
 */
function displayDeterminism(container, result) {
    const { formula, isDeterministic, explanation, type, statements, correctStatement } = result;
    
    // Create header
    const header = document.createElement('h5');
    header.textContent = `${type === 'cnf' ? 'CNF' : 'General'} Unit Propagation Check for: ${formula}`;
    container.appendChild(header);
    
    // For CNF determinism we don't need to show the explanation card
    if (type === 'cnf') {
        // Skip explanation card for CNF determinism
    } else {
        // Create explanation card for general determinism only
        const explanationCard = document.createElement('div');
        explanationCard.className = 'card mb-3';
        
        explanationCard.innerHTML = `
            <div class="card-header">
                <h5 class="mb-0">Result Analysis</h5>
            </div>
            <div class="card-body">
                <p class="card-text">
                    <span class="badge ${isDeterministic ? 'bg-success' : 'bg-danger'}">
                        ${isDeterministic ? 'Deterministic' : 'Non-Deterministic'}
                    </span>
                </p>
                <p class="card-text">${explanation}</p>
            </div>
        `;
        
        container.appendChild(explanationCard);
    }
    
    // Create statements card
    const statementsCard = document.createElement('div');
    statementsCard.className = 'card';
    
    let statementsHtml = '<ul class="list-group list-group-flush">';
    statements.forEach((statement, index) => {
        const isCorrect = (index + 1) === correctStatement;
        statementsHtml += `
            <li class="list-group-item ${isCorrect ? 'list-group-item-success' : ''}">
                <strong>${index + 1}.</strong> ${statement}
                ${isCorrect ? '<span class="badge bg-success">Correct</span>' : ''}
            </li>
        `;
    });
    statementsHtml += '</ul>';
    
    statementsCard.innerHTML = `
        <div class="card-header">
            <h5 class="mb-0">${type === 'cnf' ? 'Which statement holds?' : 'Choose the correct statement:'}</h5>
        </div>
        ${statementsHtml}
    `;
    
    container.appendChild(statementsCard);
}

/**
 * Displays pure atom simplification results
 * @param {HTMLElement} container - The container to display the result in
 * @param {Object} result - The pure atom result
 */
function displayPureAtom(container, result) {
    const { formula, pureAtoms, simplifiedFormula, steps } = result;
    
    const header = document.createElement('h5');
    header.textContent = `Pure Atom Simplification for: ${formula}`;
    container.appendChild(header);
    
    // Display pure atoms
    const atomsCard = document.createElement('div');
    atomsCard.className = 'card mb-3';
    
    atomsCard.innerHTML = `
        <div class="card-header">
            <h5 class="mb-0">Pure Atoms</h5>
        </div>
        <div class="card-body">
            ${pureAtoms.length > 0 
                ? `<ul>${pureAtoms.map(atom => `<li>${atom}</li>`).join('')}</ul>`
                : '<p>No pure atoms found in the formula.</p>'
            }
        </div>
    `;
    
    container.appendChild(atomsCard);
    
    // Display simplification steps if available
    if (steps && steps.length > 0) {
        const stepsCard = document.createElement('div');
        stepsCard.className = 'card mb-3';
        
        let stepsHtml = '<ol class="list-group list-group-numbered">';
        steps.forEach(step => {
            stepsHtml += `
                <li class="list-group-item">
                    <div class="fw-bold">Removed: ${step.atom}</div>
                    <div>Result: ${step.formula}</div>
                </li>
            `;
        });
        stepsHtml += '</ol>';
        
        stepsCard.innerHTML = `
            <div class="card-header">
                <h5 class="mb-0">Simplification Steps</h5>
            </div>
            <div class="card-body">
                ${stepsHtml}
            </div>
        `;
        
        container.appendChild(stepsCard);
    }
    
    // Display final simplified formula
    const resultCard = document.createElement('div');
    resultCard.className = 'card';
    
    resultCard.innerHTML = `
        <div class="card-header">
            <h5 class="mb-0">Simplified Formula</h5>
        </div>
        <div class="card-body">
            <p class="card-text">${simplifiedFormula}</p>
        </div>
    `;
    
    container.appendChild(resultCard);
}

/**
 * Displays Tseytin transformation results
 * @param {HTMLElement} container - The container to display the result in
 * @param {Object} result - The Tseytin transformation result
 */
function displayTseytin(container, result) {
    const { originalFormula, cnfFormula, auxVariables, clauses, formattedResult } = result;
    
    const header = document.createElement('h5');
    header.textContent = `Tseytin Transformation for: ${originalFormula}`;
    container.appendChild(header);
    
    // Display auxiliary variables if present
    if (auxVariables && auxVariables.length > 0) {
        const auxCard = document.createElement('div');
        auxCard.className = 'card mb-3';
        
        auxCard.innerHTML = `
            <div class="card-header">
                <h5 class="mb-0">Auxiliary Variables</h5>
            </div>
            <div class="card-body">
                <ul>
                    ${auxVariables.map(aux => `<li>${aux.variable}: ${aux.represents}</li>`).join('')}
                </ul>
            </div>
        `;
        
        container.appendChild(auxCard);
    }
    
    // Display CNF clauses
    const clausesCard = document.createElement('div');
    clausesCard.className = 'card mb-3';
    
    clausesCard.innerHTML = `
        <div class="card-header">
            <h5 class="mb-0">CNF Clauses</h5>
        </div>
        <div class="card-body">
            <ol>
                ${clauses.map(clause => `<li>${clause}</li>`).join('')}
            </ol>
        </div>
    `;
    
    container.appendChild(clausesCard);
    
    // Display simplified format result
    const resultCard = document.createElement('div');
    resultCard.className = 'card';
    
    resultCard.innerHTML = `
        <div class="card-header">
            <h5 class="mb-0">Simplified Result Format</h5>
        </div>
        <div class="card-body">
            <p class="card-text"><code>${formattedResult}</code></p>
        </div>
    `;
    
    container.appendChild(resultCard);
}

/**
 * Generic display for any result type
 * @param {HTMLElement} container - The container to display the result in
 * @param {Object} result - The result object
 */
function displayGeneric(container, result) {
    const resultCard = document.createElement('div');
    resultCard.className = 'card';
    
    let resultContent = '';
    
    // If result is a simple string
    if (typeof result === 'string') {
        resultContent = `<p class="card-text">${result}</p>`;
    } 
    // If result is an object
    else if (typeof result === 'object') {
        resultContent = '<pre class="result-json">' + JSON.stringify(result, null, 2) + '</pre>';
    } 
    // For any other type
    else {
        resultContent = `<p class="card-text">${result}</p>`;
    }
    
    resultCard.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">Result</h5>
            ${resultContent}
        </div>
    `;
    
    container.appendChild(resultCard);
}

// Export functions for use in other modules
window.displayResults = displayResults;
window.displayError = displayError;