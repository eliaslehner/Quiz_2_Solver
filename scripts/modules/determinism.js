/**
 * determinism.js
 * Module for checking CNF determinism and unit propagation satisfiability
 */

class DeterminismChecker {
    constructor() {
        this.debug = true;
    }

    calculate(config) {
        try {
            const { formula, type = 'cnf' } = config;
            
            if (this.debug) {
                console.log('Checking determinism:');
                console.log('Formula:', formula);
                console.log('Type:', type);
            }

            let result;
            if (type === 'cnf') {
                result = this.checkCNFDeterminism(formula);
            } else {
                result = this.checkGeneralDeterminism(formula);
            }

            // Add statements to the result
            result.statements = this.getStatements(type);
            result.correctStatement = this.getCorrectStatementNumber(result.determinismResult, type);

            return {
                formula: formula,
                type: type,
                isDeterministic: result.isDeterministic,
                explanation: result.explanation,
                statements: result.statements,
                correctStatement: result.correctStatement,
                determinismResult: result.determinismResult
            };
        } catch (error) {
            console.error('Error in determinism check:', error);
            throw error;
        }
    }

    getStatements(type) {
        if (type === 'cnf') {
            return [
                "Unit propagation cannot be used within the formula",
                "Using only unit propagation exhaustively can determine that the formula is satisfiable",
                "Unit propagation can be used within the formula, but the satisfiability cannot be determined using only unit propagation",
                "Using only unit propagation exhaustively can determine that the formula is unsatisfiable"
            ];
        } else {
            return [
                "Satisfiability can be determined using only unit propagation",
                "Satisfiability cannot be determined using only unit propagation",
                "Unit propagation cannot be used within the formula"
            ];
        }
    }

    getCorrectStatementNumber(determinismResult, type) {
        if (type === 'cnf') {
            // CNF Formula Unit Propagation Check - 4 statements
            switch(determinismResult) {
                case 'noUnitClauses':
                    return 1; // "Unit propagation cannot be used"
                case 'satisfiable':
                    return 2; // "Unit propagation determines satisfiability"
                case 'undetermined':
                    return 3; // "Unit propagation can be used but cannot determine satisfiability"
                case 'unsatisfiable':
                    return 4; // "Unit propagation determines unsatisfiability"
                default:
                    return null;
            }
        } else {
            // Set of Formulas Satisfiability Check - 3 statements
            switch(determinismResult) {
                case 'satisfiable':
                case 'unsatisfiable':
                    return 1; // "Satisfiability can be determined using only unit propagation"
                case 'undetermined':
                    return 2; // "Satisfiability cannot be determined using only unit propagation"
                case 'noUnitClauses':
                    return 3; // "Unit propagation cannot be used within the formula"
                default:
                    return null;
            }
        }
    }

    checkCNFDeterminism(formula) {
        const clauses = this.parseCNF(formula);
        if (this.debug) console.log('Parsed clauses:', clauses);

        // Check if unit propagation can be used
        const hasUnitClauses = clauses.some(clause => clause.length === 1);
        if (!hasUnitClauses) {
            return {
                isDeterministic: false,
                determinismResult: 'noUnitClauses',
                explanation: "Unit propagation cannot be used within the formula"
            };
        }

        // Perform unit propagation
        const propagationResult = this.performUnitPropagation(clauses);
        
        if (propagationResult.isEmpty) {
            return {
                isDeterministic: true,
                determinismResult: 'satisfiable',
                explanation: "Unit propagation determines that the formula is satisfiable"
            };
        }

        if (propagationResult.isContradiction) {
            return {
                isDeterministic: true,
                determinismResult: 'unsatisfiable',
                explanation: "Unit propagation determines that the formula is unsatisfiable"
            };
        }

        // Check if all variables are assigned
        const allVars = this.getAllVariables(clauses);
        const allVarsAssigned = Array.from(allVars).every(v => propagationResult.assignments && propagationResult.assignments[v] !== undefined);

        if (allVarsAssigned) {
            return {
                isDeterministic: true,
                determinismResult: 'satisfiable',
                explanation: "Unit propagation determines that the formula is satisfiable"
            };
        }

        return {
            isDeterministic: false,
            determinismResult: 'undetermined',
            explanation: "Unit propagation can be used but cannot determine satisfiability"
        };
    }

    getAllVariables(clauses) {
        const variables = new Set();
        for (const clause of clauses) {
            for (const literal of clause) {
                const variable = literal.startsWith('¬') ? literal.slice(1) : literal;
                variables.add(variable);
            }
        }
        return variables;
    }

    checkGeneralDeterminism(formula) {
        // For general formulas, we assume they're already in CNF form
        // since the module currently doesn't implement full CNF conversion
        const result = this.checkCNFDeterminism(formula);
        
        // Return result with appropriate messaging for general formulas
        return {
            ...result,
            explanation: result.explanation.replace("the formula", "this set of formulas")
        };
    }

    parseCNF(formula) {
        // Split by AND operator and handle each clause
        return formula.split('∧')
            .map(clause => clause.trim())
            .map(clause => {
                // Remove outer parentheses from the clause
                let processedClause = clause;
                if (processedClause.startsWith('(') && processedClause.endsWith(')')) {
                    processedClause = processedClause.slice(1, -1);
                }
                // Split by OR operator to get literals
                return processedClause.split('∨')
                    .map(literal => literal.trim());
            });
    }

    performUnitPropagation(clauses) {
        // Make a deep copy of clauses and convert to Sets for more efficient operations
        let currentClauses = clauses.map(clause => new Set(clause));
        const assignments = new Map();
        const steps = [];
        
        while (true) {
            // Find unit clauses
            const unitClause = currentClauses.find(clause => clause.size === 1);
            if (!unitClause) break;

            const literal = Array.from(unitClause)[0];
            const variable = literal.startsWith('¬') ? literal.slice(1) : literal;
            const value = !literal.startsWith('¬');
            
            steps.push({
                literal: literal,
                value: value,
                variable: variable
            });

            // Check for contradictions in assignments
            if (assignments.has(variable) && assignments.get(variable) !== value) {
                return { 
                    isContradiction: true,
                    steps: steps,
                    assignments: Object.fromEntries(assignments)
                };
            }

            assignments.set(variable, value);

            // Apply unit propagation
            const newClauses = [];
            for (const clause of currentClauses) {
                // Skip the unit clause itself
                if (clause === unitClause) continue;

                // If clause contains the literal, it's satisfied
                if (clause.has(literal)) continue;

                // Handle negation of the literal
                const negLiteral = literal.startsWith('¬') ? literal.slice(1) : `¬${literal}`;
                if (clause.has(negLiteral)) {
                    const newClause = new Set(clause);
                    newClause.delete(negLiteral);

                    // If clause becomes empty, we have a contradiction
                    if (newClause.size === 0) {
                        return {
                            isContradiction: true,
                            steps: steps,
                            assignments: Object.fromEntries(assignments)
                        };
                    }
                    newClauses.push(newClause);
                } else {
                    newClauses.push(clause);
                }
            }

            currentClauses = newClauses;

            // If no clauses remain, formula is satisfied
            if (currentClauses.length === 0) {
                return {
                    isEmpty: true,
                    steps: steps,
                    assignments: Object.fromEntries(assignments)
                };
            }
        }

        return {
            remainingClauses: currentClauses,
            steps: steps,
            assignments: Object.fromEntries(assignments)
        };
    }

    propagateLiteral(clauses, literal) {
        const negLiteral = literal.startsWith('¬') ? literal.slice(1) : `¬${literal}`;
        
        return clauses
            .filter(clause => !clause.includes(literal)) // Remove clauses containing the literal
            .map(clause => {
                const newClause = clause.filter(lit => lit !== negLiteral);
                return newClause;
            })
            .filter(clause => clause.length > 0); // Remove empty clauses
    }

    convertToCNF(formula) {
        // Simplified approach - assume formula is already in CNF
        return formula;
    }
}

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeterminismChecker;
} else {
    window.DeterminismChecker = DeterminismChecker;
}
