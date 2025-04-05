class Tree {
    static createFromParsedFormula(parsedFormula) {
        return this.clone(parsedFormula);
    }

    static clone(node) {
        if (!node) return null;
        
        switch(node.type) {
            case 'variable':
            case 'constant':
                return { ...node };
            case 'unary':
                return {
                    type: 'unary',
                    operator: node.operator,
                    operand: this.clone(node.operand)
                };
            case 'binary':
                return {
                    type: 'binary',
                    operator: node.operator,
                    left: this.clone(node.left),
                    right: this.clone(node.right)
                };
            default:
                throw new Error('Unknown node type');
        }
    }

    static getSubformulaAtPosition(tree, position) {
        if (!position) return tree;
        
        const steps = position.split('.').map(Number);
        let current = tree;

        for (const step of steps) {
            if (!current) return null;
            
            if (current.type === 'unary' && step === 1) {
                current = current.operand;
            } else if (current.type === 'binary') {
                current = step === 1 ? current.left : current.right;
            } else {
                return null;
            }
        }

        return current;
    }

    static getAllPositions(tree) {
        const positions = [''];
        
        const traverse = (node, currentPos) => {
            if (!node) return;
            
            if (node.type === 'unary') {
                const newPos = currentPos ? `${currentPos}.1` : '1';
                positions.push(newPos);
                traverse(node.operand, newPos);
            } else if (node.type === 'binary') {
                const leftPos = currentPos ? `${currentPos}.1` : '1';
                const rightPos = currentPos ? `${currentPos}.2` : '2';
                positions.push(leftPos, rightPos);
                traverse(node.left, leftPos);
                traverse(node.right, rightPos);
            }
        };

        traverse(tree, '');
        return positions.sort((a, b) => a.length - b.length || a.localeCompare(b));
    }

    static formulaToString(node) {
        return Formatter.format(node);
    }
}
