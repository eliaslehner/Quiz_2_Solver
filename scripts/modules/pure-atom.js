/**
 * pure-atom.js
 * Module for identifying and simplifying pure atoms
 */

class PureAtomSimplifier {
    constructor() {
        this.debug = true;
    }

    calculate(config) {
        try {
            const { formula } = config;
            
            if (this.debug) {
                console.log('Simplifying pure atoms:');
                console.log('Initial formula:', formula);
            }

            // Find pure atoms and simplify the formula
            const result = this.simplifyPureAtoms(formula);
            
            if (this.debug) {
                console.log('Pure atoms found:', result.pureAtoms);
                console.log('Simplified formula:', result.simplifiedFormula);
            }

            return {
                formula: formula,
                pureAtoms: result.pureAtoms,
                simplifiedFormula: result.simplifiedFormula,
                steps: result.steps || []
            };
        } catch (error) {
            console.error('Error in pure atom simplification:', error);
            throw error;
        }
    }

    simplifyPureAtoms(formula) {
        try {
            const ast = Parser.parse(formula);
            
            // Step 1: Collect all variables and their polarities
            const variablePolarities = this.collectVariablePolarities(ast);
            if (this.debug) console.log('Variable polarities:', variablePolarities);
            
            // Step 2: Find pure atoms (variables appearing with only one polarity)
            const pureAtoms = this.findPureAtoms(variablePolarities);
            if (this.debug) console.log('Pure atoms:', pureAtoms);
            
            // Step 3: Simplify the formula by replacing pure atoms with T or F
            const simplifiedAst = this.substituteAndSimplify(ast, pureAtoms);
            
            // Format the result
            let simplifiedFormula = Formatter.format(simplifiedAst);
            
            // If the formula reduces to a simple constant, use the appropriate symbol
            if (simplifiedAst.type === 'constant') {
                simplifiedFormula = simplifiedAst.value;
            }
            
            return {
                pureAtoms: Array.from(pureAtoms.entries()).map(([variable, polarity]) => variable),
                simplifiedFormula: simplifiedFormula,
                steps: [] // Additional steps could be recorded here
            };
        } catch (error) {
            console.error('Error in pure atom simplification:', error);
            return {
                pureAtoms: [],
                simplifiedFormula: formula,
                error: error.message
            };
        }
    }

    collectVariablePolarities(ast) {
        const variablePolarities = new Map();

        const traverse = (node, polarity = true) => {
            if (!node) return;

            switch (node.type) {
                case 'variable':
                    if (!variablePolarities.has(node.value)) {
                        variablePolarities.set(node.value, new Set());
                    }
                    variablePolarities.get(node.value).add(polarity);
                    break;
                
                case 'constant':
                    // Constants don't contain variables
                    break;
                
                case 'unary':
                    if (node.operator === '¬') {
                        // Negation flips the polarity
                        traverse(node.operand, !polarity);
                    }
                    break;
                
                case 'binary':
                    switch (node.operator) {
                        case '∧': // Conjunction 
                            traverse(node.left, polarity);
                            traverse(node.right, polarity);
                            break;
                        
                        case '∨': // Disjunction
                            traverse(node.left, polarity);
                            traverse(node.right, polarity);
                            break;
                        
                        case '→': // Implication
                            traverse(node.left, !polarity);  // Antecedent flips polarity
                            traverse(node.right, polarity);  // Consequent maintains polarity
                            break;
                        
                        case '↔': // Equivalence
                            // For equivalence, variables can appear with both polarities
                            traverse(node.left, true);
                            traverse(node.left, false);
                            traverse(node.right, true);
                            traverse(node.right, false);
                            break;
                    }
                    break;
            }
        };

        traverse(ast);
        return variablePolarities;
    }

    findPureAtoms(variablePolarities) {
        const pureAtoms = new Map();

        for (const [variable, polarities] of variablePolarities.entries()) {
            if (polarities.size === 1) {
                // This variable appears with only one polarity
                pureAtoms.set(variable, polarities.has(true));
            }
        }

        return pureAtoms;
    }

    substituteAndSimplify(ast, pureAtoms) {
        const substituteNode = (node) => {
            if (!node) return null;

            // Handle variable nodes
            if (node.type === 'variable') {
                if (pureAtoms.has(node.value)) {
                    const polarity = pureAtoms.get(node.value);
                    // Replace with ⊤ if pure atom appears positively, ⊥ if negatively
                    return { type: 'constant', value: polarity ? '⊤' : '⊥' };
                }
                return node;
            }

            // Handle constant nodes (no substitution needed)
            if (node.type === 'constant') {
                return node;
            }

            // Handle unary nodes (negation)
            if (node.type === 'unary') {
                const simplifiedOperand = substituteNode(node.operand);

                // Simplify negation of constants
                if (simplifiedOperand.type === 'constant') {
                    return {
                        type: 'constant',
                        value: simplifiedOperand.value === '⊤' ? '⊥' : '⊤'
                    };
                }

                return {
                    type: 'unary',
                    operator: node.operator,
                    operand: simplifiedOperand
                };
            }

            // Handle binary nodes
            if (node.type === 'binary') {
                const simplifiedLeft = substituteNode(node.left);
                const simplifiedRight = substituteNode(node.right);

                // Simplify based on operator and constant values
                if (simplifiedLeft.type === 'constant' && simplifiedRight.type === 'constant') {
                    return this.evaluateBinaryOperation(node.operator, simplifiedLeft.value, simplifiedRight.value);
                }

                // Apply other simplification rules
                switch (node.operator) {
                    case '∧': // AND
                        if (simplifiedLeft.type === 'constant') {
                            if (simplifiedLeft.value === '⊥') return { type: 'constant', value: '⊥' };
                            if (simplifiedLeft.value === '⊤') return simplifiedRight;
                        }
                        if (simplifiedRight.type === 'constant') {
                            if (simplifiedRight.value === '⊥') return { type: 'constant', value: '⊥' };
                            if (simplifiedRight.value === '⊤') return simplifiedLeft;
                        }
                        break;
                    
                    case '∨': // OR
                        if (simplifiedLeft.type === 'constant') {
                            if (simplifiedLeft.value === '⊤') return { type: 'constant', value: '⊤' };
                            if (simplifiedLeft.value === '⊥') return simplifiedRight;
                        }
                        if (simplifiedRight.type === 'constant') {
                            if (simplifiedRight.value === '⊤') return { type: 'constant', value: '⊤' };
                            if (simplifiedRight.value === '⊥') return simplifiedLeft;
                        }
                        break;
                    
                    case '→': // IMPLIES
                        if (simplifiedLeft.type === 'constant') {
                            if (simplifiedLeft.value === '⊥') return { type: 'constant', value: '⊤' };
                            if (simplifiedLeft.value === '⊤') return simplifiedRight;
                        }
                        if (simplifiedRight.type === 'constant') {
                            if (simplifiedRight.value === '⊤') return { type: 'constant', value: '⊤' };
                            if (simplifiedRight.value === '⊥') {
                                // P → ⊥ is equivalent to ¬P
                                return {
                                    type: 'unary',
                                    operator: '¬',
                                    operand: simplifiedLeft
                                };
                            }
                        }
                        break;
                    
                    case '↔': // EQUIVALENCE
                        if (simplifiedLeft.type === 'constant') {
                            if (simplifiedLeft.value === '⊤') return simplifiedRight;
                            if (simplifiedLeft.value === '⊥') {
                                // ⊥ ↔ P is equivalent to ¬P
                                return {
                                    type: 'unary',
                                    operator: '¬',
                                    operand: simplifiedRight
                                };
                            }
                        }
                        if (simplifiedRight.type === 'constant') {
                            if (simplifiedRight.value === '⊤') return simplifiedLeft;
                            if (simplifiedRight.value === '⊥') {
                                // P ↔ ⊥ is equivalent to ¬P
                                return {
                                    type: 'unary',
                                    operator: '¬',
                                    operand: simplifiedLeft
                                };
                            }
                        }
                        break;
                }

                return {
                    type: 'binary',
                    operator: node.operator,
                    left: simplifiedLeft,
                    right: simplifiedRight
                };
            }

            return node;
        };

        const result = substituteNode(ast);
        return this.recursivelySimplify(result);
    }

    recursivelySimplify(node) {
        if (!node) return null;

        // Base cases: constants and variables don't need further simplification
        if (node.type === 'constant' || node.type === 'variable') {
            return node;
        }

        if (node.type === 'unary') {
            const simplifiedOperand = this.recursivelySimplify(node.operand);
            
            // Simplify negation of constants
            if (simplifiedOperand.type === 'constant') {
                return {
                    type: 'constant',
                    value: simplifiedOperand.value === '⊤' ? '⊥' : '⊤'
                };
            }
            
            // Double negation: ¬¬P => P
            if (node.operator === '¬' && simplifiedOperand.type === 'unary' && 
                simplifiedOperand.operator === '¬') {
                return this.recursivelySimplify(simplifiedOperand.operand);
            }
            
            return {
                type: 'unary',
                operator: node.operator,
                operand: simplifiedOperand
            };
        }

        if (node.type === 'binary') {
            const simplifiedLeft = this.recursivelySimplify(node.left);
            const simplifiedRight = this.recursivelySimplify(node.right);
            
            // Evaluate constants
            if (simplifiedLeft.type === 'constant' && simplifiedRight.type === 'constant') {
                return this.evaluateBinaryOperation(node.operator, simplifiedLeft.value, simplifiedRight.value);
            }
            
            // Apply simplification rules
            switch (node.operator) {
                case '∧': // AND
                    if (simplifiedLeft.type === 'constant') {
                        if (simplifiedLeft.value === '⊥') return { type: 'constant', value: '⊥' };
                        if (simplifiedLeft.value === '⊤') return simplifiedRight;
                    }
                    if (simplifiedRight.type === 'constant') {
                        if (simplifiedRight.value === '⊥') return { type: 'constant', value: '⊥' };
                        if (simplifiedRight.value === '⊤') return simplifiedLeft;
                    }
                    break;
                
                case '∨': // OR
                    if (simplifiedLeft.type === 'constant') {
                        if (simplifiedLeft.value === '⊤') return { type: 'constant', value: '⊤' };
                        if (simplifiedLeft.value === '⊥') return simplifiedRight;
                    }
                    if (simplifiedRight.type === 'constant') {
                        if (simplifiedRight.value === '⊤') return { type: 'constant', value: '⊤' };
                        if (simplifiedRight.value === '⊥') return simplifiedLeft;
                    }
                    break;
                
                // Add other cases for → and ↔ as needed
            }
            
            return {
                type: 'binary',
                operator: node.operator,
                left: simplifiedLeft,
                right: simplifiedRight
            };
        }
        
        return node;
    }

    evaluateBinaryOperation(operator, leftValue, rightValue) {
        switch(operator) {
            case '∧': // AND
                return { 
                    type: 'constant', 
                    value: (leftValue === '⊤' && rightValue === '⊤') ? '⊤' : '⊥' 
                };
            
            case '∨': // OR
                return { 
                    type: 'constant', 
                    value: (leftValue === '⊤' || rightValue === '⊤') ? '⊤' : '⊥' 
                };
            
            case '→': // IMPLIES
                return { 
                    type: 'constant', 
                    value: (leftValue === '⊤' && rightValue === '⊥') ? '⊥' : '⊤' 
                };
            
            case '↔': // EQUIVALENCE
                return { 
                    type: 'constant', 
                    value: (leftValue === rightValue) ? '⊤' : '⊥' 
                };
            
            default:
                return { type: 'constant', value: '⊥' };
        }
    }
}

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PureAtomSimplifier;
} else {
    window.PureAtomSimplifier = PureAtomSimplifier;
}