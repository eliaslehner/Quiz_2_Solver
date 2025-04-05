/**
 * Formula Input Component
 * Handles formula input field and associated buttons for easier formula entry.
 */

const FormulaInput = (function() {
    // DOM elements
    const formulaInput = document.getElementById('formula-input');
    const clearFormulaBtn = document.getElementById('clear-formula-btn');
    const formulaButtons = document.getElementById('formula-buttons');
    
    /**
     * Initializes the formula input component.
     */
    function init() {
        // Add event listeners
        clearFormulaBtn.addEventListener('click', clearFormula);
        
        // Add event listeners for all operator and variable buttons
        const buttons = formulaButtons.querySelectorAll('.var-btn, .op-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => insertSymbol(button.getAttribute('data-value'), formulaInput));
        });
        
        // Add keyboard shortcuts for formula input (only when focused)
        formulaInput.addEventListener('keydown', handleKeyboardShortcuts);
        
        // Setup interpretation buttons if they exist
        setupInterpretationButtons();
    }
    
    /**
     * Sets up the interpretation input buttons if they exist
     */
    function setupInterpretationButtons() {
        // Setup clear buttons for interpretation fields
        const clearInterpDefBtn = document.getElementById('clear-interp-def-btn');
        const clearStatementBtn = document.getElementById('clear-statement-btn');
        
        if (clearInterpDefBtn) {
            clearInterpDefBtn.addEventListener('click', () => {
                document.getElementById('interpretation-def').value = '';
                document.getElementById('interpretation-def').focus();
            });
        }
        
        if (clearStatementBtn) {
            clearStatementBtn.addEventListener('click', () => {
                document.getElementById('statement-check').value = '';
                document.getElementById('statement-check').focus();
            });
        }
        
        // Setup interpretation buttons
        const interpButtons = document.querySelectorAll('.interp-btn');
        interpButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                if (targetInput) {
                    insertSymbol(button.getAttribute('data-value'), targetInput);
                }
            });
        });
    }
    
    /**
     * Clears the formula input field.
     */
    function clearFormula() {
        formulaInput.value = '';
        formulaInput.focus();
    }
    
    /**
     * Inserts a symbol at the current cursor position in the specified input.
     * @param {string} symbol - The symbol to insert.
     * @param {HTMLInputElement} input - The input element to insert into.
     */
    function insertSymbol(symbol, input) {
        // Get cursor position
        const startPos = input.selectionStart;
        const endPos = input.selectionEnd;
        
        // Get current input value
        const currentValue = input.value;
        
        // Insert symbol at cursor position
        input.value = currentValue.substring(0, startPos) + symbol + currentValue.substring(endPos);
        
        // Move cursor after the inserted symbol
        const newCursorPos = startPos + symbol.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
        
        // Focus on the input field
        input.focus();
    }
    
    /**
     * Handles keyboard shortcuts for formula input.
     * @param {KeyboardEvent} event - The keyboard event.
     */
    function handleKeyboardShortcuts(event) {
        // Allow shortcuts only if Ctrl/Cmd key is pressed AND we have a special key
        if (!event.ctrlKey && !event.metaKey) return;
        
        // Map keys to symbols
        const keyMap = {
            'n': '¬', // Negation
            'a': '∧', // AND
            'o': '∨', // OR
            'i': '→', // IMPLIES
            'e': '↔', // EQUIVALENCE
            't': '⊤', // TRUE
            'f': '⊥'  // FALSE
        };
        
        // Only process if it's one of our special shortcut keys
        // This allows Cmd+A, Cmd+C, etc. to work normally
        const key = event.key.toLowerCase();
        if (keyMap[key]) {
            event.preventDefault();
            insertSymbol(keyMap[key], event.target);
        }
    }
    
    /**
     * Gets the current formula value.
     * @returns {string} The current formula value.
     */
    function getFormula() {
        return formulaInput.value.trim();
    }
    
    /**
     * Sets the formula value.
     * @param {string} value - The formula value to set.
     */
    function setFormula(value) {
        formulaInput.value = value;
    }
    
    /**
     * Validates if the formula input is not empty.
     * @returns {boolean} True if the formula is not empty, false otherwise.
     */
    function validateNotEmpty() {
        const formula = getFormula();
        return formula.length > 0;
    }
    
    /**
     * Updates formula input interface to be appropriate for a specific module.
     * @param {string} moduleType - The type of module being used.
     */
    function updateForModule(moduleType) {
        // Check if certain buttons should be enabled/disabled based on module
        const buttons = formulaButtons.querySelectorAll('button');
        
        switch(moduleType) {
            case 'unit-propagation':
            case 'cnf-determinism':
                // For CNF modules, disable some operators that aren't in CNF
                buttons.forEach(button => {
                    const value = button.getAttribute('data-value');
                    if (value === '→' || value === '↔') {
                        button.disabled = true;
                    } else {
                        button.disabled = false;
                    }
                });
                break;
            default:
                // Enable all buttons for other modules
                buttons.forEach(button => {
                    button.disabled = false;
                });
                break;
        }
    }
    
    // Public API
    return {
        init,
        getFormula,
        setFormula,
        validateNotEmpty,
        updateForModule,
        clearFormula
    };
})();

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', FormulaInput.init);