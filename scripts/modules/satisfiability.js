/**
 * Satisfiability Checker Module
 */

class SatisfiabilityChecker {
    constructor() {
        this.debug = true;
    }

    calculate(config) {
        try {
            // Extract formula from config object or use directly if string was passed
            const formula = typeof config === 'object' ? config.formula : config;
            
            if (this.debug) console.log('Checking satisfiability for:', formula);

            // Parse formula
            const parsedFormula = Parser.parse(formula);
            if (this.debug) console.log('Parsed formula:', parsedFormula);

            // Get variables
            const variables = this.extractVariables(parsedFormula);
            if (this.debug) console.log('Variables found:', variables);

            // Generate all possible assignments
            const assignments = this.generateAssignments(variables);
            if (this.debug) console.log('Total assignments to check:', assignments.length);

            // Track evaluation results
            let trueCount = 0;
            let satisfyingAssignment = null;

            // Evaluate all assignments
            for (const assignment of assignments) {
                const result = this.evaluateFormula(parsedFormula, assignment);
                if (this.debug) console.log('Assignment:', assignment, 'Result:', result);

                if (result) {
                    trueCount++;
                    if (!satisfyingAssignment) {
                        satisfyingAssignment = assignment;
                    }
                }
            }

            // Determine satisfiability status
            let status;
            if (trueCount === 0) {
                status = 'unsatisfiable';
            } else if (trueCount === assignments.length) {
                status = 'valid';
            } else {
                status = 'satisfiable';
            }

            if (this.debug) {
                console.log('Satisfiability status:', status);
                console.log('True assignments:', trueCount);
                console.log('Total assignments:', assignments.length);
            }

            return {
                status,
                formula,
                model: satisfyingAssignment
            };
        } catch (error) {
            console.error('Error in satisfiability check:', error);
            throw error;
        }
    }

    extractVariables(formula) {
        const variables = new Set();
        
        const traverse = (node) => {
            if (!node) return;
            if (node.type === 'variable') {
                variables.add(node.value);
            }
            if (node.type === 'unary') traverse(node.operand);
            if (node.type === 'binary') {
                traverse(node.left);
                traverse(node.right);
            }
        };

        traverse(formula);
        return Array.from(variables).sort();
    }

    generateAssignments(variables) {
        const assignments = [];
        const n = Math.pow(2, variables.length);

        for (let i = 0; i < n; i++) {
            const assignment = {};
            for (let j = 0; j < variables.length; j++) {
                assignment[variables[j]] = Boolean((i >> j) & 1);
            }
            assignments.push(assignment);
        }

        return assignments;
    }

    evaluateFormula(formula, assignment) {
        const evaluate = (node) => {
            if (!node) return null;

            switch (node.type) {
                case 'variable':
                    return assignment[node.value];
                case 'constant':
                    return node.value === '⊤';
                case 'unary':
                    return !evaluate(node.operand);
                case 'binary':
                    const left = evaluate(node.left);
                    const right = evaluate(node.right);
                    switch (node.operator) {
                        case '∧': return left && right;
                        case '∨': return left || right;
                        case '→': return !left || right;
                        case '↔': return left === right;
                        default:
                            throw new Error(`Unknown operator: ${node.operator}`);
                    }
                default:
                    throw new Error(`Unknown node type: ${node.type}`);
            }
        };

        return evaluate(formula);
    }
}

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SatisfiabilityChecker;
} else {
    window.SatisfiabilityChecker = SatisfiabilityChecker;
}