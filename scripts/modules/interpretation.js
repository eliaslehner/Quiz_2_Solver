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
            
            if (this.debug) {
                console.log('Testing interpretation:');
                console.log('Formula:', formula);
                console.log('Interpretation:', interpretation);
                console.log('Statement:', statement);
            }

            // Parse the interpretation
            const assignment = this.parseInterpretation(interpretation);
            if (this.debug) console.log('Parsed assignment:', assignment);

            // Parse the original formula
            const parsedFormula = Parser.parse(formula);

            // Apply interpretation to formula and simplify
            const substitutedFormula = this.substituteVariables(parsedFormula, assignment);
            const simplifiedFormula = this.simplifyFormula(substitutedFormula);
            
            if (this.debug) console.log('Simplified formula:', this.astToString(simplifiedFormula));

            // Parse and evaluate the statement
            const isValid = this.evaluateStatement(statement, simplifiedFormula, assignment);
            if (this.debug) console.log('Statement evaluation:', isValid);

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
        // Parse I⊨literal or I⊭literal format
        const assignment = {};
        
        // Check for I⊨var format (including negated variables)
        const interpMatch = interpretation.match(/^I\s*⊨\s*(¬?)([a-zA-Z][a-zA-Z0-9]*)$/);
        // Check for I⊭var format (including negated variables) 
        const interpNegMatch = interpretation.match(/^I\s*⊭\s*(¬?)([a-zA-Z][a-zA-Z0-9]*)$/);
        
        if (interpMatch) {
            const isNegated = interpMatch[1] === '¬';
            const variable = interpMatch[2];
            assignment[variable] = !isNegated; // If negated, set to false
        } else if (interpNegMatch) {
            const isNegated = interpNegMatch[1] === '¬';
            const variable = interpNegMatch[2];
            assignment[variable] = isNegated; // If negated with ⊭, set to true (double negative)
        } else {
            throw new Error('Invalid interpretation format. Use: I⊨var, I⊨¬var, I⊭var, or I⊭¬var');
        }
        
        return assignment;
    }

    substituteVariables(ast, assignment) {
        if (!ast) return null;
        
        switch (ast.type) {
            case 'variable':
                // Only substitute if the variable exists in the assignment
                if (ast.value in assignment) {
                    return {
                        type: 'constant',
                        value: assignment[ast.value] ? '⊤' : '⊥'
                    };
                }
                // Keep variables that aren't in the assignment
                return ast;
            case 'constant':
                return ast;
            case 'unary':
                return {
                    type: 'unary',
                    operand: this.substituteVariables(ast.operand, assignment)
                };
            case 'binary':
                return {
                    type: 'binary',
                    operator: ast.operator,
                    left: this.substituteVariables(ast.left, assignment),
                    right: this.substituteVariables(ast.right, assignment)
                };
            default:
                throw new Error(`Unknown node type: ${ast.type}`);
        }
    }

    simplifyFormula(ast) {
        let currentAst = ast;
        let changed = true;
        const maxSimplificationIterations = 20; // Prevent infinite loops
        let iterations = 0;
        
        while (changed && iterations < maxSimplificationIterations) {
            changed = false;
            iterations++;
            let simplified = this.simplifyFormulaStep(currentAst);
            
            // Check if the formula has changed
            if (!this.areAstsEqual(simplified, currentAst)) {
                changed = true;
                currentAst = simplified;
            }
        }
        
        if (iterations >= maxSimplificationIterations) {
            console.warn("Max simplification iterations reached.");
        }
        
        return currentAst;
    }

    simplifyFormulaStep(ast) {
        if (!ast) return null;
        let simplifiedAst = { ...ast }; // Shallow copy
    
        // Simplify children first
        if (simplifiedAst.type === 'unary') {
            simplifiedAst.operand = this.simplifyFormulaStep(simplifiedAst.operand);
        } else if (simplifiedAst.type === 'binary') {
            simplifiedAst.left = this.simplifyFormulaStep(simplifiedAst.left);
            simplifiedAst.right = this.simplifyFormulaStep(simplifiedAst.right);
        }
    
        // Apply rules at current node
        if (simplifiedAst.type === 'unary') {
            // Negation rules
            if (simplifiedAst.operand.type === 'constant') {
                return {
                    type: 'constant',
                    value: simplifiedAst.operand.value === '⊤' ? '⊥' : '⊤'
                };
            }
            // Double negation
            if (simplifiedAst.operand.type === 'unary') {
                return simplifiedAst.operand.operand;
            }
            // Handle negation of binary operators using De Morgan's laws
            if (simplifiedAst.operand.type === 'binary') {
                const opNode = simplifiedAst.operand;
                if (opNode.operator === '∧') {
                    // ¬(P ∧ Q) = ¬P ∨ ¬Q
                    return this.simplifyFormulaStep({
                        type: 'binary',
                        operator: '∨',
                        left: { type: 'unary', operand: opNode.left },
                        right: { type: 'unary', operand: opNode.right }
                    });
                } else if (opNode.operator === '∨') {
                    // ¬(P ∨ Q) = ¬P ∧ ¬Q
                    return this.simplifyFormulaStep({
                        type: 'binary',
                        operator: '∧',
                        left: { type: 'unary', operand: opNode.left },
                        right: { type: 'unary', operand: opNode.right }
                    });
                } else if (opNode.operator === '→') {
                    // ¬(P → Q) = P ∧ ¬Q
                    return this.simplifyFormulaStep({
                        type: 'binary',
                        operator: '∧',
                        left: opNode.left,
                        right: { type: 'unary', operand: opNode.right }
                    });
                } else if (opNode.operator === '↔') {
                    // ¬(P ↔ Q) = (P ∧ ¬Q) ∨ (¬P ∧ Q)
                    return this.simplifyFormulaStep({
                        type: 'binary',
                        operator: '∨',
                        left: {
                            type: 'binary',
                            operator: '∧',
                            left: opNode.left,
                            right: { type: 'unary', operand: opNode.right }
                        },
                        right: {
                            type: 'binary',
                            operator: '∧',
                            left: { type: 'unary', operand: opNode.left },
                            right: opNode.right
                        }
                    });
                }
            }
        } else if (simplifiedAst.type === 'binary') {
            const left = simplifiedAst.left;
            const right = simplifiedAst.right;
            const op = simplifiedAst.operator;
    
            // Simplify based on operator and operands
            if (op === '∧') { // AND
                if (left.type === 'constant' && left.value === '⊥' || right.type === 'constant' && right.value === '⊥') {
                    return { type: 'constant', value: '⊥' };
                }
                if (left.type === 'constant' && left.value === '⊤') return right;
                if (right.type === 'constant' && right.value === '⊤') return left;
                // P ∧ P = P
                if (this.areAstsEqual(left, right)) return left;
            } else if (op === '∨') { // OR
                if (left.type === 'constant' && left.value === '⊤' || right.type === 'constant' && right.value === '⊤') {
                    return { type: 'constant', value: '⊤' };
                }
                if (left.type === 'constant' && left.value === '⊥') return right;
                if (right.type === 'constant' && right.value === '⊥') return left;
                // P ∨ P = P
                if (this.areAstsEqual(left, right)) return left;
                // P ∨ ¬P = ⊤
                if (right.type === 'unary' && this.areAstsEqual(left, right.operand) ||
                    left.type === 'unary' && this.areAstsEqual(right, left.operand)) {
                    return { type: 'constant', value: '⊤' };
                }
            } else if (op === '→') { // IMPLIES
                if (left.type === 'constant' && left.value === '⊥' || right.type === 'constant' && right.value === '⊤') {
                    return { type: 'constant', value: '⊤' };
                }
                if (left.type === 'constant' && left.value === '⊤') return right;
                if (right.type === 'constant' && right.value === '⊥') {
                    return this.simplifyFormulaStep({ type: 'unary', operand: left });
                }
                // P → P = ⊤
                if (this.areAstsEqual(left, right)) return { type: 'constant', value: '⊤' };
                // Rewrite P → Q as ¬P ∨ Q
                return this.simplifyFormulaStep({
                    type: 'binary',
                    operator: '∨',
                    left: { type: 'unary', operand: left },
                    right: right
                });
            } else if (op === '↔') { // IFF
                if (left.type === 'constant') {
                    if (left.value === '⊤') return right;
                    return this.simplifyFormulaStep({ type: 'unary', operand: right });
                }
                if (right.type === 'constant') {
                    if (right.value === '⊤') return left;
                    return this.simplifyFormulaStep({ type: 'unary', operand: left });
                }
                if (this.areAstsEqual(left, right)) return { type: 'constant', value: '⊤' };
                // Rewrite P ↔ Q as (P → Q) ∧ (Q → P) or (P ∧ Q) ∨ (¬P ∧ ¬Q)
                return this.simplifyFormulaStep({
                    type: 'binary',
                    operator: '∨',
                    left: {
                        type: 'binary',
                        operator: '∧',
                        left: left,
                        right: right
                    },
                    right: {
                        type: 'binary',
                        operator: '∧',
                        left: { type: 'unary', operand: left },
                        right: { type: 'unary', operand: right }
                    }
                });
            }
        }
        
        return simplifiedAst;
    }

    // Helper function to check if two ASTs are equal
    areAstsEqual(ast1, ast2) {
        if (!ast1 && !ast2) return true;
        if (!ast1 || !ast2) return false;
        if (ast1.type !== ast2.type) return false;
        
        switch (ast1.type) {
            case 'variable':
                return ast1.value === ast2.value;
            case 'constant':
                return ast1.value === ast2.value;
            case 'unary':
                return this.areAstsEqual(ast1.operand, ast2.operand);
            case 'binary':
                return ast1.operator === ast2.operator && 
                       this.areAstsEqual(ast1.left, ast2.left) && 
                       this.areAstsEqual(ast1.right, ast2.right);
            default:
                return false;
        }
    }

    // Add astToString helper method
    astToString(ast) {
        if (!ast) return '';
        switch (ast.type) {
            case 'variable':
                return ast.name || ast.value;
            case 'constant':
                return ast.value;
            case 'unary':
                if (['binary', 'unary'].includes(ast.operand.type)) {
                    return `¬(${this.astToString(ast.operand)})`;
                }
                return `¬${this.astToString(ast.operand)}`;
            case 'binary':
                const opMap = {
                    '∧': ' ∧ ',
                    '∨': ' ∨ ',
                    '→': ' → ',
                    '↔': ' ↔ '
                };
                return `(${this.astToString(ast.left)}${opMap[ast.operator]}${this.astToString(ast.right)})`;
            default:
                console.error("Unknown AST node type:", ast.type);
                return '?';
        }
    }

    evaluateStatement(statement, simplifiedFormula, assignment) {
        // Clean up whitespace in statement
        statement = statement.replace(/\s+/g, '');
        
        const statementMatch = statement.match(/^I([⊨⊭])(.+)$/);
        
        if (!statementMatch) {
            throw new Error("Invalid statement format. Should start with I⊨ or I⊭");
        }
        
        const isPositiveStatement = statementMatch[1] === '⊨';
        const logicalPart = statementMatch[2];
        
        // First, substitute A with the simplified formula
        let substitutedFormula = logicalPart;
        const simplifiedFormulaString = this.astToString(simplifiedFormula);
        
        // Replace A with the simplified formula before parsing
        substitutedFormula = substitutedFormula.replace(/A/g, `(${simplifiedFormulaString})`);
        
        try {
            // Parse and evaluate the substituted formula
            const parsedSubstituted = Parser.parse(substitutedFormula);
            
            // Substitute variables with their assignments and simplify
            const substitutedWithVars = this.substituteVariables(parsedSubstituted, assignment);
            const finalResult = this.simplifyFormula(substitutedWithVars);
            
            // Check if the result matches the statement type
            const isTrue = finalResult.type === 'constant' && finalResult.value === '⊤';
            return isPositiveStatement ? isTrue : !isTrue;
        } catch (error) {
            throw new Error(`Error evaluating statement: ${error.message}`);
        }
    }

    // Add this helper method to collect all variables from an AST
    collectVariables(ast, variables = new Set()) {
        if (!ast) return variables;
        
        if (ast.type === 'variable') {
            variables.add(ast.value);
        } else if (ast.type === 'unary') {
            this.collectVariables(ast.operand, variables);
        } else if (ast.type === 'binary') {
            this.collectVariables(ast.left, variables);
            this.collectVariables(ast.right, variables);
        }
        
        return variables;
    }
}

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InterpretationTester;
} else {
    window.InterpretationTester = InterpretationTester;
}
