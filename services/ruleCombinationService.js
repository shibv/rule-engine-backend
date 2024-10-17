// services/ruleCombinationService.js
import Node from '../models/astNodeModel.js';
import Rule from '../models/ruleModel.js';

const PRECEDENCE = {
    '(': -1,
    ')': -1,
    'or': 1,
    'and': 1,
    '<': 2,
    '>': 2,
    '=': 2,
    '<=': 2,
    '>=': 2
};

const ElemType = {
    LOGICAL: 1,
    COMPARISON: 2,
    STRING: 3,
    INTEGER: 4,
    VARIABLE: 5
};

// class ASTNode {
//     constructor(elemType, value, left = null, right = null) {
//         this.elemType = elemType;
//         this.value = value;
//         this.left = left;
//         this.right = right;
//     }
// }

const shuntingYard = (rule) => {
    const tokens = rule.match(/\w+|[><]=?|AND|OR|\(|\)|=/g);
    // const stacks= []
    const stack = [];
    const postfixExpr = [];
    // console.log(rule);
    for (let token of tokens) {
        if (!(token.toLowerCase() in PRECEDENCE)) {
            postfixExpr.push(token);
        } else {
            token = token.toLowerCase();
            if (stack.length === 0) {
                stack.push(token);
            } else {
                let prevoper = PRECEDENCE[stack[stack.length - 1]];
                let curroper = PRECEDENCE[token];
                if (curroper > prevoper) {
                    stack.push(token);
                } else {
                    if (token === '(') {
                        stack.push(token);
                    } else if (token === ')') {
                        while (stack[stack.length - 1] !== '(') {
                            postfixExpr.push(stack.pop());
                        }
                        stack.pop(); 
                    } else {
                        while (stack.length > 0 && curroper <= PRECEDENCE[stack[stack.length - 1]]) {
                            postfixExpr.push(stack.pop());
                        }
                        stack.push(token);
                    }
                }
            }
        }
    }

    while (stack.length > 0) {
        let popped = stack.pop();
        if (PRECEDENCE[popped] === -1) {
            return [];
        }
        postfixExpr.push(popped);
    }

    return postfixExpr;
};

const createAST = async (postfixExpr) => {
    const nodestack = [];
    for (let token of postfixExpr) {
        if (!(token in PRECEDENCE)) {
            const node = new Node({ elemType: ElemType.STRING, value: token });
            await node.save();
            nodestack.push(node);
        } else {
            const operand1 = nodestack.pop();
            const operand2 = nodestack.pop();
            const node = new Node({
                elemType: token === 'and' || token === 'or' ? ElemType.LOGICAL : ElemType.COMPARISON,
                value: token,
                left: operand2._id,
                right: operand1._id
            });
            await node.save();
            nodestack.push(node);
        }
    }
    return nodestack.length === 1 ? nodestack[0] : null;
};

const validateRule = (rule) => {
    const rulePattern = /\w+\s*(<|>|=|<=|>=)\s*('[^']*'|\w+)\s*(AND|OR)\s*\w+\s*(<|>|=|<=|>=)\s*('[^']*'|\w+)/i;
    return rulePattern.test(rule);
};

export const combineRules = async (rule_name, rules) => {
    // Validate input
    if (!rule_name || rule_name.length <= 0) {
        throw new Error("rule_name can't be null or length can't be zero");
    }
    if (!rules || !Array.isArray(rules) || rules.length === 0) {
        throw new Error("rules must be a non-empty array");
    }

 
    const existingRule = await Rule.findOne({ ruleName: rule_name });
    if (existingRule) {
        throw new Error("A rule with this name already exists");
    }

    // validate each rule
    for (let rule of rules) {
        if (!validateRule(rule)) {
            throw new Error(`Invalid rule format: ${rule}`);
        }
    }

    // combine the rules
    let combinedAST = null;
    for (let rule of rules) {
        const postfixExpr = shuntingYard(rule);
        const root = await createAST(postfixExpr);
        if (!combinedAST) {
            combinedAST = root;
        } else {
            const combinedNode = new Node({
                elemType: ElemType.LOGICAL,
                value: 'and',
                left: combinedAST._id,
                right: root._id
            });
            await combinedNode.save();
            combinedAST = combinedNode;
        }
    }

    if (combinedAST) {
        const newRule = new Rule({
            ruleName: rule_name,
            rule: rules.join(' AND '),
            root: combinedAST._id,
            postfixExpr: [] 
        });
        await newRule.save();
        return newRule;
    } else {
        throw new Error('Failed to combine rules into AST');
    }
};
