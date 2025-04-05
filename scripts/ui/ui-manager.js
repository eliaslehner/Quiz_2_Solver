/**
 * UIManager class handles the visibility and behavior of different UI components
 * based on the selected calculation module.
 */
class UIManager {
    /**
     * Constructor initializes references to DOM elements and sets up event listeners
     */
    constructor() {
        // Store references to component cards
        this.componentCards = {
            formulaInput: document.getElementById('formula-input-card'),
            positionInput: document.getElementById('position-input-card'),
            interpretationInput: document.getElementById('interpretation-input-card'),
            actions: document.getElementById('actions-card'),
            results: document.getElementById('results-card'),
            treeVisualization: document.getElementById('tree-visualization-card')
        };

        // Store references to specific UI elements
        this.elements = {
            formulaInput: document.getElementById('formula-input'),
            positionInput: document.getElementById('position-input'),
            interpretationDef: document.getElementById('interpretation-def'),
            statementCheck: document.getElementById('statement-check'),
            calculateBtn: document.getElementById('calculate-btn'),
            resetBtn: document.getElementById('reset-btn'),
            formulaInputTitle: document.getElementById('formula-input-title'),
            clearFormulaBtn: document.getElementById('clear-formula-btn'),
            generatePositionsBtn: document.getElementById('generate-positions-btn'),
            showTreeBtn: document.getElementById('show-tree-btn'),
            formulaButtons: document.getElementById('formula-buttons')
        };

        // Initialize event listeners
        this.initEventListeners();
        
        // Set initial layout based on window size
        this.handleWindowResize();
    }

    /**
     * Initialize event listeners for various UI components
     */
    initEventListeners() {
        // Window resize listener for responsive layout
        window.addEventListener('resize', this.handleWindowResize.bind(this));
        
        // Note: Formula input buttons are handled by FormulaInput.js
        
        // Clear formula button
        this.elements.clearFormulaBtn.addEventListener('click', () => {
            this.elements.formulaInput.value = '';
            this.elements.formulaInput.focus();
        });
    }

    /**
     * Handle window resize event for responsive layout
     */
    handleWindowResize() {
        const width = window.innerWidth;
        if (width < 768) {
            this.applyMobileLayout();
        } else {
            this.applyDesktopLayout();
        }
    }

    /**
     * Apply mobile-friendly layout for smaller screens
     */
    applyMobileLayout() {
        // Reorganize formula buttons for mobile
        const buttonGroups = this.elements.formulaButtons.querySelectorAll('.btn-group');
        buttonGroups.forEach(group => {
            group.classList.add('d-flex');
            group.classList.add('flex-wrap');
            group.style.width = '100%';
        });
    }

    /**
     * Apply desktop layout for larger screens
     */
    applyDesktopLayout() {
        // Reorganize formula buttons for desktop
        const buttonGroups = this.elements.formulaButtons.querySelectorAll('.btn-group');
        buttonGroups.forEach(group => {
            group.classList.remove('d-flex');
            group.classList.remove('flex-wrap');
            group.style.width = '';
        });
    }

    /**
     * Set up formula input buttons with insertion functionality
     * Note: The actual click handlers are already set up in formula-input.js
     * This method is kept for potential future customizations but doesn't add duplicate handlers
     */
    setupFormulaInputButtons() {
        // FormulaInput module already handles click events for buttons
        // No need to add duplicate event listeners here
    }

    /**
     * Insert text at cursor position in an input element
     * @param {HTMLElement} input - The input element
     * @param {string} text - Text to insert
     */
    insertAtCursor(input, text) {
        const startPos = input.selectionStart;
        const endPos = input.selectionEnd;
        const scrollTop = input.scrollTop;
        
        input.value = input.value.substring(0, startPos) + text + input.value.substring(endPos, input.value.length);
        
        // Move cursor position after the inserted text
        input.selectionStart = startPos + text.length;
        input.selectionEnd = startPos + text.length;
        
        // Restore scroll position
        input.scrollTop = scrollTop;
    }

    /**
     * Configure UI for a specific module
     * @param {string} moduleName - The name of the module
     * @param {Object} config - Configuration object with components list
     */
    configureForModule(moduleName, config) {
        if (!moduleName || !config) {
            console.error('Invalid module configuration');
            return;
        }
        
        // Hide all component cards first
        Object.values(this.componentCards).forEach(card => {
            if (card) {
                card.classList.add('d-none');
            }
        });
        
        // Show only the components needed for this module
        config.components.forEach(componentName => {
            const componentKey = this.getComponentKey(componentName);
            if (this.componentCards[componentKey]) {
                this.componentCards[componentKey].classList.remove('d-none');
            }
        });
        
        // Reset form
        this.resetForm();
        
        // Update specific UI elements for this module
        this.updateSpecificUIForModule(moduleName);
    }

    /**
     * Map component name to componentCards object key
     * @param {string} componentName - The component name from config
     * @returns {string} The corresponding key in componentCards
     */
    getComponentKey(componentName) {
        const mapping = {
            'formula-input': 'formulaInput',
            'position-input': 'positionInput',
            'interpretation-input': 'interpretationInput',
            'actions': 'actions',
            'results': 'results',
            'tree-visualization': 'treeVisualization'
        };
        
        return mapping[componentName] || componentName;
    }

    /**
     * Reset all form inputs
     */
    resetForm() {
        if (this.elements.formulaInput) this.elements.formulaInput.value = '';
        if (this.elements.positionInput) this.elements.positionInput.value = '';
        if (this.elements.interpretationDef) this.elements.interpretationDef.value = '';
        if (this.elements.statementCheck) this.elements.statementCheck.value = '';
        
        // Reset results if they exist
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) resultsContainer.innerHTML = '';
        
        // Reset tree visualization if it exists
        const treeContainer = document.getElementById('tree-container');
        if (treeContainer) treeContainer.innerHTML = '';
    }

    /**
     * Update UI elements specific to the selected module
     * @param {string} moduleName - The name of the selected module
     */
    updateSpecificUIForModule(moduleName) {
        // Set the formula input title
        const moduleTitle = this.getModuleTitle(moduleName);
        this.elements.formulaInputTitle.textContent = `Enter Formula for ${moduleTitle}`;
        
        // Update calculate button text based on module
        this.updateCalculateButtonText(moduleName);
        
        // Configure specific UI for different modules
        switch (moduleName) {
            case 'truth-table':
                this.setupTruthTableUI();
                break;
            case 'satisfiability':
                this.setupSatisfiabilityUI();
                break;
            case 'subformula':
                this.setupSubformulaUI();
                break;
            case 'unit-propagation':
                this.setupUnitPropagationUI();
                break;
            case 'interpretation':
                this.setupInterpretationUI();
                break;
            case 'polarity':
                this.setupPolarityUI();
                break;
            case 'cnf-determinism':
            case 'general-determinism':
                this.setupDeterminismUI(moduleName);
                break;
            case 'pure-atom':
                this.setupPureAtomUI();
                break;
            case 'tseytin':
                this.setupTseytinUI();
                break;
            default:
                // Default setup
                this.enableAllOperators();
        }
    }

    /**
     * Get a user-friendly title for a module
     * @param {string} moduleName - The module name
     * @returns {string} User-friendly title
     */
    getModuleTitle(moduleName) {
        const titles = {
            'truth-table': 'Truth Table Generator',
            'satisfiability': 'Satisfiability Checker',
            'subformula': 'Subformula by Position',
            'unit-propagation': 'Unit Propagation (CNF)',
            'interpretation': 'Interpretation Testing',
            'polarity': 'Polarity Calculation',
            'cnf-determinism': 'Unit Propagation Determinism (CNF)',
            'pure-atom': 'Pure Atom Simplification',
            'general-determinism': 'Unit Propagation Determinism (General)',
            'tseytin': 'Tseytin Transformation'
        };
        
        return titles[moduleName] || 'Unknown Module';
    }

    /**
     * Update the text on the calculate button based on module
     * @param {string} moduleName - The module name
     */
    updateCalculateButtonText(moduleName) {
        const buttonTexts = {
            'truth-table': 'Generate Truth Table',
            'satisfiability': 'Check Satisfiability',
            'subformula': 'Extract Subformula',
            'unit-propagation': 'Apply Unit Propagation',
            'interpretation': 'Check Interpretation',
            'polarity': 'Calculate Polarity',
            'cnf-determinism': 'Check CNF Determinism',
            'pure-atom': 'Find Pure Atoms',
            'general-determinism': 'Check Determinism',
            'tseytin': 'Apply Tseytin Transformation'
        };
        
        this.elements.calculateBtn.textContent = buttonTexts[moduleName] || 'Calculate';
    }

    /**
     * Enable all operator buttons
     */
    enableAllOperators() {
        const buttons = this.elements.formulaButtons.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = false;
        });
    }

    /**
     * Enable only CNF operators (¬, ∧, ∨) and disable others
     */
    enableCNFOperators() {
        const buttons = this.elements.formulaButtons.querySelectorAll('button');
        buttons.forEach(button => {
            const value = button.getAttribute('data-value');
            if (value === '→' || value === '↔') {
                button.disabled = true;
            } else {
                button.disabled = false;
            }
        });
    }

    /**
     * Setup UI for Truth Table module
     */
    setupTruthTableUI() {
        this.enableAllOperators();
    }

    /**
     * Setup UI for Satisfiability module
     */
    setupSatisfiabilityUI() {
        this.enableAllOperators();
    }

    /**
     * Setup UI for Subformula module
     */
    setupSubformulaUI() {
        this.enableAllOperators();
        
        // Make sure the generate positions and show tree buttons are visible
        if (this.elements.generatePositionsBtn) {
            this.elements.generatePositionsBtn.classList.remove('d-none');
        }
        
        if (this.elements.showTreeBtn) {
            this.elements.showTreeBtn.classList.remove('d-none');
        }
    }

    /**
     * Setup UI for Unit Propagation module
     */
    setupUnitPropagationUI() {
        this.enableCNFOperators();
    }

    /**
     * Setup UI for Interpretation Testing module
     */
    setupInterpretationUI() {
        this.enableAllOperators();
    }

    /**
     * Setup UI for Polarity module
     */
    setupPolarityUI() {
        this.enableAllOperators();
        
        // Make sure the generate positions and show tree buttons are visible
        if (this.elements.generatePositionsBtn) {
            this.elements.generatePositionsBtn.classList.remove('d-none');
        }
        
        if (this.elements.showTreeBtn) {
            this.elements.showTreeBtn.classList.remove('d-none');
        }
    }

    /**
     * Setup UI for Determinism modules
     * @param {string} moduleName - Either 'cnf-determinism' or 'general-determinism'
     */
    setupDeterminismUI(moduleName) {
        if (moduleName === 'cnf-determinism') {
            this.enableCNFOperators();
        } else {
            this.enableAllOperators();
        }
    }

    /**
     * Setup UI for Pure Atom module
     */
    setupPureAtomUI() {
        this.enableCNFOperators();
    }

    /**
     * Setup UI for Tseytin Transformation module
     */
    setupTseytinUI() {
        this.enableAllOperators();
    }
}

// Create and export a global instance
window.uiManager = new UIManager();
