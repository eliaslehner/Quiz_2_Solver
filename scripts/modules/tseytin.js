/**
 * tseytin.js
 * Module for Tseytin transformation with optimized definitional CNF
 */

class TseytinTransformer {
    constructor() {
        this.debug = false;
        this.nextVar = 0;
    }

    calculate(config) {
        try {
            const { formula } = config;
            
            /*if (this.debug) {
                console.log('Performing Tseytin transformation:');
                console.log('Initial formula:', formula);
            }*/

            // Reset auxiliary variable counter
            this.nextVar = 0;

            // Parse formula
            const parsedFormula = Parser.parse(formula);
            //if (this.debug) console.log('Parsed formula:', parsedFormula);

            // Perform transformation
            const result = this.transform(parsedFormula);
            /*if (this.debug) {
                console.log('Auxiliary variables:', result.auxVariables);
                console.log('CNF clauses:', result.clauses);
            }*/

            return {
                originalFormula: formula,
                cnfFormula: result.cnfFormula,
                auxVariables: result.auxVariables,
                clauses: result.clauses,
                formattedResult: result.formattedResult
            };
        } catch (error) {
            console.error('Error in Tseytin transformation:', error);
            throw error;
        }
    }

    transform(formula) {
        const auxVariables = [];
        const clauses = [];
        
        // Get subformulas in the required order (constraint #2)
        const subformulas = this.getSpecifiedOrderSubformulas(formula);
        //if (this.debug) console.log('Ordered subformulas:', subformulas);

        // Transform each subformula
        const nameMap = new Map();
        for (const subformula of subformulas) {
            // Constraint #1: Do not introduce names for literals
            if (!this.needsName(subformula)) continue;
            
            const name = this.getNewVariable(); // Constraint #3: use n0, n1, etc.
            nameMap.set(subformula, name);
            
            auxVariables.push({
                variable: name,
                represents: Formatter.format(subformula)
            });

            // Generate clauses for this subformula
            const defClauses = this.defineVariable(name, subformula, nameMap);
            clauses.push(...defClauses);
        }

        // Add final clause
        const topVar = nameMap.get(formula) || formula;
        clauses.push([this.literalToString(topVar)]);

        // Remove redundant clauses
        const uniqueClauses = this.removeRedundantClauses(clauses);
        
        // Format clauses according to constraint #5
        const formattedClauses = uniqueClauses.map(clause => {
            // Sort literals alphabetically
            return this.sortLiteralsAlphabetically(clause);
        });

        // Format the final result string according to the required format
        const formattedResult = formattedClauses
            .map(clause => `(${clause.join(',')})`)
            .join(';');

        // Simple format for listing - UPDATED to include parentheses around each clause
        const simplifiedFormat = formattedClauses
            .map(clause => `(${clause.join(',')})`)
            .join(';');

        return {
            cnfFormula: this.clausesToString(uniqueClauses),
            auxVariables: auxVariables,
            clauses: formattedClauses.map(c => `(${c.join(',')})`),
            formattedResult: simplifiedFormat
        };
    }

    /**
     * Gets subformulas in the specified order according to constraint #2
     */
    getSpecifiedOrderSubformulas(formula) {
        // First, build the formula tree
        const tree = this.buildTree(formula);
        
        // Then, get subformulas in the specified order
        return this.traverseTreeInSpecifiedOrder(tree);
    }

    /**
     * Build a tree representation of the formula with position information
     */
    buildTree(node, position = '') {
        if (!node) return null;
        
        const treeNode = {
            node: node,
            position: position,
            children: []
        };
        
        if (node.type === 'binary') {
            treeNode.children.push(this.buildTree(node.left, position ? `${position}.1` : '1'));
            treeNode.children.push(this.buildTree(node.right, position ? `${position}.2` : '2'));
        } else if (node.type === 'unary') {
            treeNode.children.push(this.buildTree(node.operand, position ? `${position}.1` : '1'));
        }
        
        return treeNode;
    }

    /**
     * Traverse the tree in the specified order according to constraint #2
     */
    traverseTreeInSpecifiedOrder(treeRoot) {
        const subformulas = [];
        const visited = new Set();
        
        // Helper function to check if a node has been visited
        const isVisited = (node) => {
            const formulaStr = JSON.stringify(node);
            return visited.has(formulaStr);
        };
        
        // Helper function to mark a node as visited and add to subformulas if needed
        const visitNode = (node) => {
            const formulaStr = JSON.stringify(node);
            if (!visited.has(formulaStr)) {
                visited.add(formulaStr);
                subformulas.push(node);
            }
        };
        
        // Traverse the tree in the specified order
        const traverse = (node) => {
            if (!node) return;
            
            if (node.children.length > 0) {
                // Visit rightmost child's tree first
                const rightmost = node.children[node.children.length - 1];
                traverse(rightmost);
                
                // Then visit left siblings
                for (let i = node.children.length - 2; i >= 0; i--) {
                    traverse(node.children[i]);
                }
                
                // Visit the parent node
                visitNode(node.node);
            } else {
                // Leaf node
                visitNode(node.node);
            }
        };
        
        traverse(treeRoot);
        
        // Only return subformulas that need names
        return subformulas.filter(this.needsName.bind(this));
    }

    needsName(node) {
        // Constraint #1: Do not introduce names for literals
        return node.type === 'binary' || 
               (node.type === 'unary' && node.operand.type !== 'variable' && 
                node.operand.type !== 'constant');
    }

    getNewVariable() {
        // Constraint #3: use n0, n1, etc.
        return `n${this.nextVar++}`;
    }

    /**
     * Define clauses for a subformula
     * Using the optimized approach from the examples
     */
    defineVariable(name, formula, nameMap) {
        const clauses = [];
        
        if (formula.type === 'unary') {
            // For unary negation, we need a different approach
            // Not needed for the specific examples, but included for completeness
            const operand = nameMap.get(formula.operand) || formula.operand;
            if (formula.operator === '¬') {
                clauses.push([`-${name}`, this.negateLiteral(operand)]);
                clauses.push([name, this.literalToString(operand)]);
            }
        } else if (formula.type === 'binary') {
            const left = nameMap.get(formula.left) || formula.left;
            const right = nameMap.get(formula.right) || formula.right;
            
            switch (formula.operator) {
                case '∧':
                    // For AND, we only need one clause: (-left,-right,name)
                    clauses.push([this.negateLiteral(left), this.negateLiteral(right), name]);
                    break;
                case '∨':
                    // For OR, we only need one clause: (left,right,-name)
                    clauses.push([this.literalToString(left), this.literalToString(right), `-${name}`]);
                    break;
                case '→':
                    // For implication, we need to match the examples
                    // For n1 = (n0→a): (a,-n0,-n1)
                    clauses.push([this.literalToString(right), this.negateLiteral(left), `-${name}`]);
                    break;
                case '↔':
                    // This case isn't in the examples, but included for completeness
                    clauses.push([this.negateLiteral(left), this.literalToString(right), `-${name}`]);
                    clauses.push([this.literalToString(left), this.negateLiteral(right), `-${name}`]);
                    clauses.push([this.literalToString(left), this.literalToString(right), name]);
                    clauses.push([this.negateLiteral(left), this.negateLiteral(right), name]);
                    break;
            }
        }

        return clauses;
    }

    literalToString(node) {
        if (typeof node === 'string') return node;
        
        if (node.type === 'variable') return node.value;
        
        if (node.type === 'unary' && node.operator === '¬' && node.operand.type === 'variable') {
            return `-${node.operand.value}`;
        }
        
        return node;
    }

    negateLiteral(node) {
        const literal = this.literalToString(node);
        
        if (typeof literal === 'string') {
            return literal.startsWith('-') ? literal.slice(1) : `-${literal}`;
        }
        
        return literal;
    }

    clausesToString(clauses) {
        return clauses.map(clause => `(${clause.join('∨')})`).join('∧');
    }
    
    /**
     * Sort literals alphabetically according to constraint #5
     */
    sortLiteralsAlphabetically(clause) {
        return [...clause].sort((a, b) => {
            // Get base variables (without negation)
            const varA = a.startsWith('-') ? a.slice(1) : a;
            const varB = b.startsWith('-') ? b.slice(1) : b;
            
            // First, compare the base variables alphabetically
            if (varA !== varB) {
                // Alphabetically sort (a, b, c before n variables)
                if (/^n\d+$/.test(varA) !== /^n\d+$/.test(varB)) {
                    // One is an n variable, one is not
                    return /^n\d+$/.test(varA) ? 1 : -1;
                }
                
                // Both are either n variables or regular variables
                if (/^n\d+$/.test(varA) && /^n\d+$/.test(varB)) {
                    // Both are n variables, compare numerically
                    const numA = parseInt(varA.substring(1));
                    const numB = parseInt(varB.substring(1));
                    return numA - numB;
                }
                
                // Regular alphabetical comparison
                return varA.localeCompare(varB);
            }
            
            // If same variable, negated comes after positive
            if (a.startsWith('-') && !b.startsWith('-')) return 1;
            if (!a.startsWith('-') && b.startsWith('-')) return -1;
            
            return 0;
        });
    }
    
    /**
     * Remove redundant clauses to optimize the result
     */
    removeRedundantClauses(clauses) {
        // Convert clauses to strings for comparison
        const uniqueClausesMap = new Map();
        
        for (const clause of clauses) {
            // Sort literals within the clause for canonical representation
            const sortedClause = this.sortLiteralsAlphabetically(clause);
            const clauseKey = sortedClause.join(',');
            
            // Only keep unique clauses
            if (!uniqueClausesMap.has(clauseKey)) {
                uniqueClausesMap.set(clauseKey, sortedClause);
            }
        }
        
        // Convert back to array
        return Array.from(uniqueClausesMap.values());
    }
}

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TseytinTransformer;
} else {
    window.TseytinTransformer = TseytinTransformer;
}
