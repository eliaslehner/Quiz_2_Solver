class Parser {
    static parse(formula) {
        const tokens = this.tokenize(formula);
        let pos = 0;

        const parseFormula = () => {
            let node = parseImplication();
            
            while (pos < tokens.length && tokens[pos].type === 'equiv') {
                const operator = tokens[pos++].value;
                const right = parseImplication();
                node = { type: 'binary', operator, left: node, right };
            }
            
            return node;
        };

        const parseImplication = () => {
            let node = parseDisjunction();
            
            while (pos < tokens.length && tokens[pos].type === 'implies') {
                const operator = tokens[pos++].value;
                const right = parseDisjunction();
                node = { type: 'binary', operator, left: node, right };
            }
            
            return node;
        };

        const parseDisjunction = () => {
            let node = parseConjunction();
            
            while (pos < tokens.length && tokens[pos].type === 'or') {
                const operator = tokens[pos++].value;
                const right = parseConjunction();
                node = { type: 'binary', operator, left: node, right };
            }
            
            return node;
        };

        const parseConjunction = () => {
            let node = parseNegation();
            
            while (pos < tokens.length && tokens[pos].type === 'and') {
                const operator = tokens[pos++].value;
                const right = parseNegation();
                node = { type: 'binary', operator, left: node, right };
            }
            
            return node;
        };

        const parseNegation = () => {
            if (pos < tokens.length && tokens[pos].type === 'not') {
                pos++;
                return { type: 'unary', operator: '¬', operand: parseNegation() };
            }
            return parseAtom();
        };

        const parseAtom = () => {
            if (pos >= tokens.length) {
                throw new Error('Unexpected end of formula');
            }

            const token = tokens[pos++];
            
            if (token.type === 'lparen') {
                const node = parseFormula();
                if (pos >= tokens.length || tokens[pos].type !== 'rparen') {
                    throw new Error('Missing closing parenthesis');
                }
                pos++;
                return node;
            }
            
            if (token.type === 'variable' || token.type === 'constant') {
                return { type: token.type, value: token.value };
            }
            
            throw new Error(`Unexpected token: ${token.value}`);
        };

        const result = parseFormula();
        
        if (pos < tokens.length) {
            throw new Error('Unexpected tokens after formula end');
        }
        
        return result;
    }

    static tokenize(formula) {
        const tokens = [];
        let pos = 0;

        while (pos < formula.length) {
            const char = formula[pos];

            switch(char) {
                case ' ':
                    pos++;
                    break;
                case '(':
                    tokens.push({ type: 'lparen', value: '(' });
                    pos++;
                    break;
                case ')':
                    tokens.push({ type: 'rparen', value: ')' });
                    pos++;
                    break;
                case '¬':
                    tokens.push({ type: 'not', value: '¬' });
                    pos++;
                    break;
                case '∧':
                    tokens.push({ type: 'and', value: '∧' });
                    pos++;
                    break;
                case '∨':
                    tokens.push({ type: 'or', value: '∨' });
                    pos++;
                    break;
                case '→':
                    tokens.push({ type: 'implies', value: '→' });
                    pos++;
                    break;
                case '↔':
                    tokens.push({ type: 'equiv', value: '↔' });
                    pos++;
                    break;
                case '⊤':
                case '⊥':
                    tokens.push({ type: 'constant', value: char });
                    pos++;
                    break;
                default:
                    if (/[a-z]/.test(char)) {
                        tokens.push({ type: 'variable', value: char });
                        pos++;
                    } else {
                        throw new Error(`Invalid character: ${char}`);
                    }
            }
        }

        return tokens;
    }
}