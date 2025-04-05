/**
 * interpretation.js
 * Module for testing interpretations against formulas
 */

class InterpretationTester {
    constructor() {
        this.debug = true;
    }

    calculate(config) {
        try {
            const { formula, interpretation, statement } = config;
            
            /*if (this.debug) {
                console.log('Testing interpretation:');
                console.log('Formula:', formula);
                console.log('Interpretation:', interpretation);
                console.log('Statement:', statement);
            }

            // Parse the interpretation
            const assignment = this.parseInterpretation(interpretation);
            if (this.debug) console.log('Parsed assignment:', assignment);

            // Parse and evaluate the statement
            const isValid = this.evaluateStatement(statement, formula, assignment);
            if (this.debug) console.log('Statement evaluation:', isValid);*/

            return {
                formula: formula,
                interpretation: interpretation,
                statement: statement,
                isValid: isValid
            };
        } catch (error) {
            console.error('Error in interpretation testing:', error);
            throw error;
        }
    }

    parseInterpretation(interpretation) {
        // Parse I⊨literal format
        const assignment = {};
        const literal = interpretation.split('⊨')[1].trim();
        
        if (literal.startsWith('¬')) {
            assignment[literal.slice(1)] = false;
        } else {
            assignment[literal] = true;
        }
        
        return assignment;
    }

    evaluateStatement(statement, formula, assignment) {
        const parsedFormula = Parser.parse(formula);
        
        // Extract the statement structure (A↔B format)
        const [left, right] = statement.split('↔').map(s => s.trim());
        
        // Evaluate both sides
        const leftResult = this.evaluateFormula(parsedFormula, assignment);
        const rightResult = this.evaluateFormula(Parser.parse(right), assignment);
        
        return leftResult === rightResult;
    }

    evaluateFormula(formula, assignment) {
        const evaluate = (node) => {
            if (!node) return null;

            switch (node.type) {
                case 'variable':
                    return assignment[node.value] ?? false;
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
    module.exports = InterpretationTester;
} else {
    window.InterpretationTester = InterpretationTester;
}