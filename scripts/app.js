/**
 * Main application script that coordinates the UI and functionality.
 */

// Module configurations - defines what UI components are needed for each module
const moduleConfig = {
    'truth-table': {
        title: 'Truth Table Generator',
        components: ['formula-input', 'actions', 'results'],
        scriptUrl: './scripts/modules/truth-table.js'
    },
    'satisfiability': {
        title: 'Satisfiability Checker',
        components: ['formula-input', 'actions', 'results'],
        scriptUrl: './scripts/modules/satisfiability.js'
    },
    'subformula': {
        title: 'Subformula by Position',
        components: ['formula-input', 'position-input', 'actions', 'results', 'tree-visualization'],
        scriptUrl: './scripts/modules/subformula.js'
    },
    'unit-propagation': {
        title: 'Unit Propagation (CNF)',
        components: ['formula-input', 'actions', 'results'],
        scriptUrl: './scripts/modules/unit-propagation.js'
    },
    'interpretation': {
        title: 'Interpretation Testing',
        components: ['formula-input', 'interpretation-input', 'actions', 'results'],
        scriptUrl: './scripts/modules/interpretation.js'
    },
    'polarity': {
        title: 'Polarity Calculation',
        components: ['formula-input', 'position-input', 'actions', 'results', 'tree-visualization'],
        scriptUrl: './scripts/modules/polarity.js'
    },
    'cnf-determinism': {
        title: 'Unit Propagation Determinism (CNF)',
        components: ['formula-input', 'actions', 'results'],
        scriptUrl: './scripts/modules/determinism.js' 
    },
    'pure-atom': {
        title: 'Pure Atom Simplification',
        components: ['formula-input', 'actions', 'results'],
        scriptUrl: './scripts/modules/pure-atom.js'
    },
    'general-determinism': {
        title: 'Unit Propagation Determinism (General)',
        components: ['formula-input', 'actions', 'results'],
        scriptUrl: './scripts/modules/general-determinism.js'
    },
    'tseytin': {
        title: 'Tseytin Transformation',
        components: ['formula-input', 'actions', 'results'],
        scriptUrl: './scripts/modules/tseytin.js'
    }
};

// Current active module
let currentModule = null;
let moduleInstance = null;

// DOM elements
const moduleSelector = document.getElementById('module-selector');
const loadModuleBtn = document.getElementById('load-module-btn');
const calculateBtn = document.getElementById('calculate-btn');
const resetBtn = document.getElementById('reset-btn');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // First check if core dependencies are loaded
    if (typeof Parser === 'undefined' || typeof Formatter === 'undefined' || typeof Tree === 'undefined') {
        const error = 'Core components not loaded properly. Check console for details.';
        alert(error);
        console.error(error);
        console.log('Dependencies missing:', {
            'Parser': typeof Parser === 'undefined' ? 'Missing' : 'Loaded',
            'Formatter': typeof Formatter === 'undefined' ? 'Missing' : 'Loaded',
            'Tree': typeof Tree === 'undefined' ? 'Missing' : 'Loaded'
        });
        return;
    }

    loadModuleBtn.addEventListener('click', loadSelectedModule);
    calculateBtn.addEventListener('click', performCalculation);
    resetBtn.addEventListener('click', resetForm);
    
    // Check if a module is specified in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const moduleParam = urlParams.get('module');
    if (moduleParam && moduleConfig[moduleParam]) {
        moduleSelector.value = moduleParam;
        loadSelectedModule();
    }
});

/**
 * Loads the selected module and initializes the UI.
 */
function loadSelectedModule() {
    const selectedModule = moduleSelector.value;
    
    if (!selectedModule || !moduleConfig[selectedModule]) {
        alert('Please select a valid module.');
        return;
    }
    
    currentModule = selectedModule;
    const config = moduleConfig[currentModule];
    
    // Reset the UI before loading the new module
    resetUI();
    
    // Show calculator form
    document.getElementById('calculator-form').classList.remove('d-none');
    
    // Update the URL to include the module parameter
    const url = new URL(window.location);
    url.searchParams.set('module', currentModule);
    window.history.replaceState({}, '', url);
    
    // Set the form title
    document.getElementById('form-title').textContent = config.title;
    
    // Show relevant UI components based on the module configuration
    if (config.components.includes('position-input')) {
        document.getElementById('position-section').classList.remove('d-none');
    }
    
    if (config.components.includes('interpretation-input')) {
        document.getElementById('interpretation-section').classList.remove('d-none');
    }
    
    if (config.components.includes('results')) {
        document.getElementById('output-section').classList.remove('d-none');
    }
    
    // Load the module script dynamically
    loadScript(config.scriptUrl)
        .then(() => {
            // Different modules use different class names based on their functionality
            const moduleClassName = getModuleClassName(currentModule);
            
            // Check if the module class exists in the window object
            if (typeof window[moduleClassName] === 'function') {
                // Instantiate the module class
                try {
                    moduleInstance = new window[moduleClassName]();
                    console.log(`Module ${moduleClassName} loaded successfully`);
                } catch (e) {
                    console.error(`Error instantiating ${moduleClassName}:`, e);
                    alert(`Error initializing module: ${e.message}`);
                }
            } else {
                console.error(`Module class ${moduleClassName} not found after loading script`);
                console.log('Available global objects:', Object.keys(window).filter(key => 
                    typeof window[key] === 'function' && 
                    !['eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'decodeURI'].includes(key)
                ));
                alert(`Failed to initialize module: Class ${moduleClassName} not found. Check console for details.`);
            }
        })
        .catch(error => {
            console.error('Error loading module script:', error);
            alert(`Failed to load script for "${config.title}". Check if the path ${config.scriptUrl} is correct.`);
        });
}

/**
 * Gets the expected class name for a module based on its ID.
 * @param {string} moduleId - The ID of the module.
 * @returns {string} The expected class name for the module.
 */
function getModuleClassName(moduleId) {
    // Mapping from module IDs to class names
    const classNameMap = {
        'truth-table': 'TruthTableGenerator',
        'satisfiability': 'SatisfiabilityChecker',
        'subformula': 'SubformulaExtractor',
        'unit-propagation': 'UnitPropagation',
        'interpretation': 'InterpretationTester',
        'polarity': 'PolarityCalculator',
        'cnf-determinism': 'DeterminismChecker',
        'pure-atom': 'PureAtomSimplifier',
        'general-determinism': 'GeneralDeterminismChecker',
        'tseytin': 'TseytinTransformer'
    };
    
    return classNameMap[moduleId] || moduleId.charAt(0).toUpperCase() + moduleId.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase());
}

/**
 * Dynamically loads a script.
 * @param {string} url - The URL of the script to load.
 * @returns {Promise} A promise that resolves when the script is loaded.
 */
function loadScript(url) {
    return new Promise((resolve, reject) => {
        console.log(`Attempting to load script: ${url}`);
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            console.log(`Successfully loaded script: ${url}`);
            resolve();
        };
        script.onerror = (error) => {
            console.error(`Failed to load script: ${url}`, error);
            reject(new Error(`Failed to load ${url}. Make sure the file exists and is accessible.`));
        };
        document.body.appendChild(script);
    });
}

/**
 * Performs the calculation for the current module.
 */
function performCalculation() {
    if (!currentModule || !moduleInstance) {
        alert('Please select and load a module first.');
        return;
    }
    
    // Get the formula
    const formula = document.getElementById('formula-input').value.trim();
    if (!formula) {
        alert('Please enter a formula.');
        return;
    }
    
    // Create a configuration object with all possible inputs
    const config = {
        formula,
        position: document.getElementById('position-input')?.value || null,
        interpretation: document.getElementById('interpretation-def')?.value || null,
        statement: document.getElementById('statement-check')?.value || null
    };
    
    try {
        console.log('Config object being passed to module:', config);
        
        // Call the module's calculate method
        if (typeof moduleInstance.calculate === 'function') {
            const result = moduleInstance.calculate(config);
            renderResults(result);
        } else {
            throw new Error('Module does not implement a calculate method');
        }
    } catch (error) {
        console.error('Calculation error:', error);
        displayError(error.message);
    }
}

/**
 * Displays the calculation results.
 * @param {Object} result - The calculation result object.
 */
function renderResults(result) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';
    
    document.getElementById('output-section').classList.remove('d-none');
    
    // Use the displayResults function from results-display.js
    if (typeof window.displayResults === 'function') {
        window.displayResults(resultsContainer, result, currentModule);
    } else {
        console.warn('displayResults function not found in global scope, using fallback');
        // Basic fallback for result display
        if (typeof result === 'object') {
            resultsContainer.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
        } else {
            resultsContainer.textContent = result;
        }
    }
}

/**
 * Displays an error message.
 * @param {string} message - The error message to display.
 */
function displayError(message) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    document.getElementById('output-section').classList.remove('d-none');
}

/**
 * Resets the form inputs.
 */
function resetForm() {
    document.getElementById('formula-input').value = '';
    document.getElementById('position-input').value = '';
    document.getElementById('interpretation-def').value = '';
    document.getElementById('statement-check').value = '';
    document.getElementById('results-container').innerHTML = '';
    document.getElementById('tree-container').innerHTML = '';
}

/**
 * Resets the UI by hiding all dynamic components.
 */
function resetUI() {
    // Hide all sections that might be visible
    document.getElementById('position-section')?.classList.add('d-none');
    document.getElementById('interpretation-section')?.classList.add('d-none');
    document.getElementById('output-section')?.classList.add('d-none');
    document.getElementById('tree-container')?.classList.add('d-none');
    
    resetForm();
}
