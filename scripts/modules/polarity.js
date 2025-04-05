/**
 * polarity.js
 * Module for calculating polarity of subformulas
 */

class PolarityCalculator {
    constructor() {
        this.debug = true;
    }

    calculate(config) {
        try {
            const { formula, position } = config;
            
            /*if (this.debug) {
                console.log('Calculating polarity:');
                console.log('Formula:', formula);
                console.log('Position:', position);
            }

            // Parse the formula
            const parsedFormula = Parser.parse(formula);
            if (this.debug) console.log('Parsed formula:', parsedFormula);

            // Calculate polarity
            const polarityValue = this.calculatePolarity(parsedFormula, position);
            if (this.debug) console.log('Calculated polarity value:', polarityValue);*/

            // Convert numeric polarity to string representation
            let polarity;
            if (polarityValue === 1) {
                polarity = 'positive';
            } else if (polarityValue === -1) {
                polarity = 'negative';
            } else {
                polarity = 'mixed';
            }

            // Get the subformula at the position
            const subformula = Tree.getSubformulaAtPosition(parsedFormula, position);
            const subformulaStr = Formatter.format(subformula);

            // Create tree with polarity annotations
            const annotatedTree = this.annotateTreeWithPolarity(parsedFormula);
            const formattedTree = this.formatTreeWithPolarity(annotatedTree);

            return {
                formula: formula,
                position: position,
                polarity: polarity,
                polarityValue: polarityValue,
                subformula: subformulaStr,
                tree: annotatedTree,
                formattedTree: formattedTree
            };
        } catch (error) {
            console.error('Error in polarity calculation:', error);
            throw error;
        }
    }

    calculatePolarity(formula, position) {
        if (!position || position === '') {
            return 1; // Root has positive polarity
        }

        const positionArray = position.split('.').map(Number);
        let currentNode = formula;
        let currentPolarity = 1; // Start with positive polarity
        let tempPosition = '';

        // Traverse the formula tree according to the position
        for (let i = 0; i < positionArray.length; i++) {
            const step = positionArray[i];
            
            // Update tempPosition for the current step
            tempPosition = tempPosition ? `${tempPosition}.${step}` : `${step}`;
            
            // Handle negation and implication which can affect polarity
            if (currentNode.type === 'binary' && currentNode.operator === '→' && step === 1) {
                // Left side of implication has negative polarity
                currentPolarity *= -1;
            } else if (currentNode.type === 'unary' && currentNode.operator === '¬') {
                // Negation flips polarity
                currentPolarity *= -1;
            }
            
            // Move to the next node in the path
            if (currentNode.type === 'unary') {
                currentNode = currentNode.operand;
            } else if (currentNode.type === 'binary') {
                currentNode = step === 1 ? currentNode.left : currentNode.right;
            } else {
                // We've reached a leaf node (variable or constant)
                break;
            }
            
            // If we've reached the end of our path but still have position steps,
            // the position is invalid
            if (!currentNode && i < positionArray.length - 1) {
                throw new Error(`Invalid position ${position}`);
            }
        }

        return currentPolarity;
    }

    annotateTreeWithPolarity(formula, currentPolarity = 1, position = '') {
        if (!formula) return null;

        const node = { ...formula, polarity: currentPolarity, position: position };

        if (node.type === 'unary') {
            const newPosition = position ? `${position}.1` : '1';
            // For negation, flip the polarity for the operand
            const childPolarity = node.operator === '¬' ? -currentPolarity : currentPolarity;
            node.operand = this.annotateTreeWithPolarity(formula.operand, childPolarity, newPosition);
        } else if (node.type === 'binary') {
            const leftPosition = position ? `${position}.1` : '1';
            const rightPosition = position ? `${position}.2` : '2';
            
            // Handle special cases that affect polarity
            let leftPolarity = currentPolarity;
            let rightPolarity = currentPolarity;
            
            if (node.operator === '→') {
                // Left side of implication has opposite polarity
                leftPolarity = -currentPolarity;
            }
            
            node.left = this.annotateTreeWithPolarity(formula.left, leftPolarity, leftPosition);
            node.right = this.annotateTreeWithPolarity(formula.right, rightPolarity, rightPosition);
        }

        return node;
    }
    
    formatTreeWithPolarity(tree) {
        const lines = [];
        
        // Helper function to recursively format the tree
        const formatNode = (node, prefix = '', isLast = true, position = '') => {
            if (!node) return;
            
            // Get the formula string for this node
            const formulaStr = Formatter.format(node);
            
            // Get the polarity as text
            const polarityText = node.polarity === 1 ? 'positive' : 
                                (node.polarity === -1 ? 'negative' : 'mixed');
            
            // Combine formula, position, and polarity
            const nodeText = `${position ? position + ': ' : ''}${formulaStr} [${polarityText}]`;
            
            // Add this node to the output
            lines.push(`${prefix}${isLast ? '└── ' : '├── '}${nodeText}`);
            
            // Prepare for child nodes
            const childPrefix = prefix + (isLast ? '    ' : '│   ');
            
            if (node.type === 'unary') {
                const childPosition = position ? `${position}.1` : '1';
                formatNode(node.operand, childPrefix, true, childPosition);
            } else if (node.type === 'binary') {
                const leftPosition = position ? `${position}.1` : '1';
                const rightPosition = position ? `${position}.2` : '2';
                
                formatNode(node.left, childPrefix, false, leftPosition);
                formatNode(node.right, childPrefix, true, rightPosition);
            }
        };
        
        // Get the root formula string
        const rootStr = Formatter.format(tree);
        const polarityText = tree.polarity === 1 ? 'positive' : 
                           (tree.polarity === -1 ? 'negative' : 'mixed');
        
        // Add the root node
        lines.push(`${rootStr} [${polarityText}]`);
        
        // Format child nodes
        if (tree.type === 'unary') {
            formatNode(tree.operand, '', true, '1');
        } else if (tree.type === 'binary') {
            formatNode(tree.left, '', false, '1');
            formatNode(tree.right, '', true, '2');
        }
        
        return lines.join('\n');
    }
}

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PolarityCalculator;
} else {
    window.PolarityCalculator = PolarityCalculator;
}