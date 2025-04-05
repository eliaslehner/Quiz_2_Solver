/**
 * unit-propagation.js
 * Module for performing unit propagation on CNF formulas
 */

class UnitPropagation {
    constructor() {
        this.debug = true;
    }

    calculate(config) {
        try {
            const { formula } = config;
            
            /*if (this.debug) {
                console.log('Performing unit propagation:');
                console.log('Initial formula:', formula);
            }*/

            // Parse and convert to CNF clauses
            const clauses = this.parseToClauses(formula);
            //if (this.debug) console.log('Initial clauses:', clauses);

            const steps = [];
            const literals = new Set();
            let currentClauses = [...clauses];

            // Perform unit propagation
            while (true) {
                const unitClause = this.findUnitClause(currentClauses);
                if (!unitClause) break;

                const literal = unitClause[0];
                literals.add(literal);

                /*if (this.debug) {
                    console.log('Found unit clause:', unitClause);
                    console.log('Propagating literal:', literal);
                }*/

                const beforeClauses = JSON.parse(JSON.stringify(currentClauses));
                currentClauses = this.propagateLiteral(currentClauses, literal);

                steps.push({
                    literal: literal,
                    beforeClauses: beforeClauses.map(c => c.join(',')),
                    afterClauses: currentClauses.map(c => c.join(','))
                });

                /*if (this.debug) {
                    console.log('After propagation:', currentClauses);
                }*/
            }

            // Format the result in the required format
            const formattedResult = this.formatResults(currentClauses, literals);
            //console.log("FORMATTED RESULT: " + formattedResult);
            
            return {
                formula: formula,
                steps: steps,
                finalClauses: currentClauses.map(c => c.join(',')),
                literals: Array.from(literals),
                formattedResult: formattedResult,
                result: formattedResult  // Add an additional field that's more likely to be displayed
            };
        } catch (error) {
            console.error('Error in unit propagation:', error);
            throw error;
        }
    }

    parseToClauses(formula) {
        // Split the formula into clauses
        return formula.split('∧')
            .map(clause => clause.trim())
            .map(clause => {
                // Remove outer parentheses
                let cleanClause = clause;
                if (cleanClause.startsWith('(') && cleanClause.endsWith(')')) {
                    cleanClause = cleanClause.slice(1, -1);
                }
                
                // Handle both unit clauses and regular clauses
                if (cleanClause.includes('∨')) {
                    return cleanClause.split('∨').map(literal => literal.trim());
                } else {
                    return [cleanClause.trim()];
                }
            });
    }

    findUnitClause(clauses) {
        return clauses.find(clause => clause.length === 1);
    }

    propagateLiteral(clauses, literal) {
        const negLiteral = literal.startsWith('¬') ? 
            literal.slice(1) : `¬${literal}`;

        // Filter clauses that don't contain the literal
        let filteredClauses = clauses.filter(clause => !clause.includes(literal));
        
        // Remove the negated literal from remaining clauses
        filteredClauses = filteredClauses.map(clause => 
            clause.filter(lit => lit !== negLiteral)
        );
        
        // Filter out empty clauses
        return filteredClauses.filter(clause => clause.length > 0);
    }

    formatResults(clauses, literals) {
        // Start with the propagated literals
        const result = [];
        
        // First add all the propagated literals
        for (const literal of literals) {
            if (literal.startsWith('¬')) {
                result.push(`(-${literal.slice(1)})`);
            } else {
                result.push(`(${literal})`);
            }
        }
        
        // Then add all remaining clauses
        for (const clause of clauses) {
            if (clause.length > 0) {
                // Sort literals alphabetically
                const sortedLiterals = [...clause].sort((a, b) => {
                    const aBase = a.startsWith('¬') ? a.slice(1) : a;
                    const bBase = b.startsWith('¬') ? b.slice(1) : b;
                    return aBase.localeCompare(bBase);
                });
                
                // Format literals with '-' for negation
                const formattedLiterals = sortedLiterals.map(lit => {
                    if (lit.startsWith('¬')) {
                        return `-${lit.slice(1)}`;
                    } else {
                        return lit;
                    }
                });
                
                result.push(`(${formattedLiterals.join(',')})`);
            }
        }
        
        // Join all steps with semicolons
        return result.join(';');
    }
}

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnitPropagation;
} else {
    window.UnitPropagation = UnitPropagation;
}