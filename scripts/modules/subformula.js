/**
 * subformula.js
 * Module for extracting subformulas at specified positions
 */

class SubformulaExtractor {
    constructor() {
        this.debug = false;
    }

    /**
     * Initialize the UI for the subformula module
     */
    initUI() {
        // Configure the UI for subformula extraction
        document.getElementById('form-title').textContent = 'Subformula Extraction';
        document.getElementById('position-section').classList.remove('d-none');
        
        // Rename the calculate button to "Get Subformula"
        const calculateBtn = document.getElementById('calculate-btn');
        calculateBtn.textContent = 'Get Subformula';
        
        // Show the position-related buttons
        document.getElementById('generate-positions-btn').classList.remove('d-none');
        document.getElementById('show-tree-btn').classList.remove('d-none');
        
        // Create a single button row by moving the action buttons into the position section
        const positionSection = document.getElementById('position-section');
        const actionBtns = document.getElementById('calculate-btn').parentElement;
        
        // Style the position buttons container to display all buttons in a row
        const positionBtnsContainer = positionSection.querySelector('.mt-2');
        positionBtnsContainer.className = 'd-flex flex-wrap gap-2 mt-2';
        
        // Move the action buttons to the position buttons container
        if (actionBtns && positionBtnsContainer) {
            // Remove existing margin classes from calculate button
            calculateBtn.classList.remove('me-2');
            
            // Add gap styling to buttons for consistent spacing
            calculateBtn.classList.add('ms-auto');
            document.getElementById('reset-btn').classList.add('ms-2');
            
            // Move the action buttons
            positionBtnsContainer.appendChild(calculateBtn);
            positionBtnsContainer.appendChild(document.getElementById('reset-btn'));
            
            // Hide the original action buttons container
            actionBtns.classList.add('d-none');
        }
        
        // Add event listener for enter key on position input
        const positionInput = document.getElementById('position-input');
        positionInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                calculateBtn.click();
            }
        });
    }

    /**
     * Calculates the subformula at the given position
     * @param {Object} config - The configuration object
     * @param {string} config.formula - The formula string
     * @param {string} config.position - The position string
     * @returns {Object} The result object with the subformula
     */
    calculate(config) {
        try {
            const { formula, position } = config;
            
            /*if (this.debug) {
                console.log('Extracting subformula:');
                console.log('Formula:', formula);
                console.log('Position:', position);
            }*/

            // Parse the formula
            const parsedFormula = Parser.parse(formula);
            //if (this.debug) console.log('Parsed formula:', parsedFormula);

            // Get subformula at position
            const subformula = Tree.getSubformulaAtPosition(parsedFormula, position);
            //if (this.debug) console.log('Extracted subformula:', subformula);

            if (!subformula) {
                throw new Error(`Invalid position: "${position}"`);
            }

            // Format the subformula
            const formattedSubformula = Formatter.format(subformula);
            //if (this.debug) console.log('Formatted subformula:', formattedSubformula);

            return {
                formula: formula,
                position: position || 'ε', // Use epsilon for empty position (root)
                subformula: formattedSubformula,
                tree: parsedFormula // For tree visualization
            };
        } catch (error) {
            console.error('Error in subformula extraction:', error);
            throw error;
        }
    }
}

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubformulaExtractor;
} else {
    window.SubformulaExtractor = SubformulaExtractor;
}