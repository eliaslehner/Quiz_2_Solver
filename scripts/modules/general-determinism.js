/**
 * general-determinism.js
 * Module for checking general formula determinism and unit propagation satisfiability
 */

class GeneralDeterminismChecker {
    constructor() {
        this.debug = true;
    }

    calculate(config) {
        try {
            const { formula } = config;
            
            if (this.debug) {
                console.log('Checking general determinism:');
                console.log('Formula:', formula);
            }

            const result = this.checkGeneralDeterminism(formula);

            // Add statements to the result
            result.statements = this.getStatements();
            result.correctStatement = this.getCorrectStatementNumber(result.determinismResult);

            return {
                formula: formula,
                type: 'general',
                isDeterministic: result.isDeterministic,
                explanation: result.explanation,
                statements: result.statements,
                correctStatement: result.correctStatement,
                determinismResult: result.determinismResult
            };
        } catch (error) {
            console.error('Error in general determinism check:', error);
            throw error;
        }
    }

    getStatements() {
        return [
            "Satisfiability of S can be determined using only unit propagation",
            "Satifiability of S cannot be determined using only unit propagation",
            "Unit propagation cannot be used within S"
        ];
    }

    getCorrectStatementNumber(determinismResult) {
        // General formula satisfiability check - 3 statements
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

    checkGeneralDeterminism(formula) {
        const clauses = this.parseCNF(formula);
        if (this.debug) console.log('Parsed clauses:', clauses);

        // Check if unit propagation can be used
        const hasUnitClauses = clauses.some(clause => clause.length === 1);
        if (!hasUnitClauses) {
            return {
                isDeterministic: false,
                determinismResult: 'noUnitClauses',
                explanation: "Unit propagation cannot be used within the set of formulas"
            };
        }

        // Perform unit propagation
        const propagationResult = this.performUnitPropagation(clauses);
        
        if (propagationResult.isEmpty) {
            return {
                isDeterministic: true,
                determinismResult: 'satisfiable',
                explanation: "Unit propagation determines that the set of formulas is satisfiable"
            };
        }

        if (propagationResult.isContradiction) {
            return {
                isDeterministic: true,
                determinismResult: 'unsatisfiable',
                explanation: "Unit propagation determines that the set of formulas is unsatisfiable"
            };
        }

        return {
            isDeterministic: false,
            determinismResult: 'undetermined',
            explanation: "Unit propagation can be used but cannot determine satisfiability of the set of formulas"
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
        let currentClauses = [...clauses];
        const assignments = new Map();
        const steps = [];

        while (true) {
            const unitClause = currentClauses.find(c => c.length === 1);
            if (!unitClause) break;

            const literal = unitClause[0];
            const variable = literal.startsWith('¬') ? literal.slice(1) : literal;
            const value = !literal.startsWith('¬');
            
            // Record this step for explanation purposes
            steps.push({
                literal: literal,
                value: value,
                variable: variable
            });

            if (assignments.has(variable) && assignments.get(variable) !== value) {
                return { 
                    isContradiction: true,
                    steps: steps,
                    explanation: `Contradiction found: ${variable} must be both ${assignments.get(variable)} and ${value}`
                };
            }

            assignments.set(variable, value);
            currentClauses = this.propagateLiteral(currentClauses, literal);

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
        const negLiteral = literal.startsWith('¬') ? 
            literal.slice(1) : `¬${literal}`;

        return clauses
            .filter(clause => !clause.includes(literal))
            .map(clause => clause.filter(lit => lit !== negLiteral))
            .filter(clause => clause.length > 0);
    }
}

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeneralDeterminismChecker;
} else {
    window.GeneralDeterminismChecker = GeneralDeterminismChecker;
}
