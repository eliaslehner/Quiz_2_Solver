/**
 * Position Input Component
 * Handles position input for subformula and polarity calculations.
 */

const PositionInput = (function() {
    // DOM elements
    const positionInput = document.getElementById('position-input');
    const generatePositionsBtn = document.getElementById('generate-positions-btn');
    const showTreeBtn = document.getElementById('show-tree-btn');
    const treeContainer = document.getElementById('tree-container');
    
    // Variable to store the current formula tree
    let currentTree = null;
    
    /**
     * Initializes the position input component.
     */
    function init() {
        // Add event listeners
        generatePositionsBtn.addEventListener('click', generatePositions);
        showTreeBtn.addEventListener('click', showFormulaTree);
        
        // Add validation for position input
        positionInput.addEventListener('input', validatePosition);
    }
    
    /**
     * Gets the current position value.
     * @returns {string} The current position value.
     */
    function getPosition() {
        return positionInput.value.trim();
    }
    
    /**
     * Sets the position value.
     * @param {string} value - The position value to set.
     */
    function setPosition(value) {
        positionInput.value = value;
    }
    
    /**
     * Validates the position input format.
     * Valid format: a sequence of numbers separated by dots, e.g., "1.2.1"
     */
    function validatePosition() {
        const position = getPosition();
        const isValid = position === '' || /^[1-2](\.[1-2])*$/.test(position);
        
        // Visual feedback for validation
        if (isValid) {
            positionInput.classList.remove('is-invalid');
            positionInput.classList.add('is-valid');
        } else {
            positionInput.classList.remove('is-valid');
            positionInput.classList.add('is-invalid');
        }
    }
    
    /**
     * Generates and displays all valid positions for the current formula.
     * This function depends on the tree.js implementation.
     */
    function generatePositions() {
        const formula = document.getElementById('formula-input').value.trim();
        
        if (!formula) {
            alert('Please enter a formula first.');
            return;
        }
        
        try {
            // This assumes the existence of a Parser and Tree from core modules
            if (typeof Parser === 'undefined' || typeof Tree === 'undefined') {
                throw new Error('Required core modules not loaded.');
            }
            
            // Parse the formula
            const parsedFormula = Parser.parse(formula);
            
            // Create a tree representation
            currentTree = Tree.createFromParsedFormula(parsedFormula);
            
            // Get all positions
            const positions = Tree.getAllPositions(currentTree);
            
            // Display positions in a modal or results area
            const resultsContainer = document.getElementById('results-container');
            const outputSection = document.getElementById('output-section');
            outputSection.classList.remove('d-none');
            
            // Format positions as a list with tree-like format
            const formattedTree = formatFormulaAsTree(currentTree);
            
            let positionsHtml = `
                <h6>Formula Tree with Positions:</h6>
                <pre class="formula-tree-display">${formattedTree}</pre>
                <h6 class="mt-3">All Valid Positions:</h6>
                <div class="position-list">
            `;
            
            positions.forEach(pos => {
                const subformula = Tree.getSubformulaAtPosition(currentTree, pos);
                positionsHtml += `
                    <div class="position-item">
                        <span class="position-value">${pos || "ε"}</span>
                        <span class="position-formula">${Tree.formulaToString(subformula)}</span>
                        <button class="btn btn-sm btn-outline-primary position-select-btn" data-position="${pos}">Select</button>
                    </div>
                `;
            });
            positionsHtml += '</div>';
            
            resultsContainer.innerHTML = positionsHtml;
            
            // Add event listeners to the select buttons
            const selectButtons = resultsContainer.querySelectorAll('.position-select-btn');
            selectButtons.forEach(button => {
                button.addEventListener('click', function() {
                    setPosition(this.getAttribute('data-position'));
                    validatePosition();
                });
            });
            
            // Also show the tree visualization
            treeContainer.classList.remove('d-none');
        } catch (error) {
            console.error('Error generating positions:', error);
            alert('Failed to generate positions: ' + error.message);
        }
    }
    
    /**
     * Shows the formula tree visualization.
     * This function depends on the tree.js implementation.
     */
    function showFormulaTree() {
        const formula = document.getElementById('formula-input').value.trim();
        
        if (!formula) {
            alert('Please enter a formula first.');
            return;
        }
        
        try {
            // This assumes the existence of a Parser and Tree from core modules
            if (typeof Parser === 'undefined' || typeof Tree === 'undefined') {
                throw new Error('Required core modules not loaded.');
            }
            
            // Parse the formula if not already done
            if (!currentTree) {
                const parsedFormula = Parser.parse(formula);
                currentTree = Tree.createFromParsedFormula(parsedFormula);
            }
            
            // Show the tree container
            const outputSection = document.getElementById('output-section');
            outputSection.classList.remove('d-none');
            treeContainer.classList.remove('d-none');
            
            // Generate tree visualization as text
            const treeText = formatFormulaAsTree(currentTree);
            treeContainer.innerHTML = `<pre class="formula-tree-display">${treeText}</pre>`;
            
            // Highlight the current position if set
            const position = getPosition();
            if (position) {
                highlightTreePosition(position);
            }
        } catch (error) {
            console.error('Error showing formula tree:', error);
            alert('Failed to show formula tree: ' + error.message);
        }
    }
    
    /**
     * Formats a formula tree as a text-based tree structure.
     * @param {Object} tree - The formula tree to format.
     * @returns {string} A formatted string representing the tree.
     */
    function formatFormulaAsTree(tree) {
        const formulaString = Tree.formulaToString(tree);
        
        let result = formulaString + '\n';
        
        function buildTreeLines(node, position, prefix, isLastChild) {
            if (!node) return [];
            
            const nodeFormula = Tree.formulaToString(node);
            const lines = [];
            
            // Add the current node line
            const posDisplay = position || 'ε';
            const line = `${prefix}${isLastChild ? '└── ' : '├── '}${posDisplay}: ${nodeFormula}`;
            lines.push(line);
            
            // Prepare prefix for children
            const childPrefix = prefix + (isLastChild ? '    ' : '│   ');
            
            // Handle node children based on type
            if (node.type === 'unary') {
                const childPos = position ? `${position}.1` : '1';
                const childLines = buildTreeLines(node.operand, childPos, childPrefix, true);
                lines.push(...childLines);
            } else if (node.type === 'binary') {
                const leftPos = position ? `${position}.1` : '1';
                const rightPos = position ? `${position}.2` : '2';
                
                const leftLines = buildTreeLines(node.left, leftPos, childPrefix, false);
                const rightLines = buildTreeLines(node.right, rightPos, childPrefix, true);
                
                lines.push(...leftLines);
                lines.push(...rightLines);
            }
            
            return lines;
        }
        
        // Get all tree lines starting from the root
        const treeLines = buildTreeLines(tree, '', '', true);
        result += treeLines.join('\n');
        
        return result;
    }
    
    /**
     * Highlights a specific position in the tree visualization.
     * @param {string} position - The position to highlight.
     */
    function highlightTreePosition(position) {
        const treeDisplay = treeContainer.querySelector('.formula-tree-display');
        if (!treeDisplay) return;
        
        // Convert the pre element to a highlightable format
        const text = treeDisplay.textContent;
        const lines = text.split('\n');
        
        // Look for the line containing the position
        const highlightedLines = lines.map(line => {
            // Check if this line has the position we're looking for
            const posPattern = new RegExp(`(├── |└── )(${position}|ε): `);
            if (posPattern.test(line)) {
                return `<span class="highlighted-position">${line}</span>`;
            }
            return line;
        });
        
        // Replace the content
        treeDisplay.innerHTML = highlightedLines.join('\n');
    }
    
    /**
     * Clears the current tree and position input.
     */
    function reset() {
        currentTree = null;
        setPosition('');
        positionInput.classList.remove('is-valid', 'is-invalid');
        treeContainer.innerHTML = '';
        treeContainer.classList.add('d-none');
    }
    
    // Public API
    return {
        init,
        getPosition,
        setPosition,
        validatePosition,
        generatePositions,
        showFormulaTree,
        reset
    };
})();

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', PositionInput.init);