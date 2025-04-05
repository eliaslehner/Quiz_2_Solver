class Formatter {
    static format(formula, type = 'text') {
        switch(type) {
            case 'latex':
                return this.toLatex(formula);
            case 'text':
            default:
                return this.toText(formula);
        }
    }

    static toText(node) {
        if (!node) return '';
        
        switch(node.type) {
            case 'variable':
            case 'constant':
                return node.value;
            case 'unary':
                return `¬${this.addParenthesesIfNeeded(node.operand)}`;
            case 'binary':
                return this.formatBinaryOperation(node);
            default:
                throw new Error('Unknown node type');
        }
    }

    static formatBinaryOperation(node) {
        const left = this.addParenthesesIfNeeded(node.left);
        const right = this.addParenthesesIfNeeded(node.right);
        return `(${left}${node.operator}${right})`;
    }

    static addParenthesesIfNeeded(node) {
        const str = this.toText(node);
        return node.type === 'binary' ? `(${str})` : str;
    }

    static toLatex(node) {
        if (!node) return '';
        
        const operatorMap = {
            '¬': '\\neg',
            '∧': '\\land',
            '∨': '\\lor',
            '→': '\\rightarrow',
            '↔': '\\leftrightarrow',
            '⊤': '\\top',
            '⊥': '\\bot'
        };

        switch(node.type) {
            case 'variable':
            case 'constant':
                return node.value;
            case 'unary':
                return `${operatorMap['¬']}{${this.toLatex(node.operand)}}`;
            case 'binary':
                const left = this.toLatex(node.left);
                const right = this.toLatex(node.right);
                return `(${left} ${operatorMap[node.operator]} ${right})`;
            default:
                throw new Error('Unknown node type');
        }
    }
}