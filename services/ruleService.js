// services/ruleService.js
import Node from '../models/astNodeModel.js';
import Rule from '../models/ruleModel.js';

// precendence of operators 
const PRECEDENCE = {
    '(': -1,')': -1,
    'or': 1,'and': 1,
    '<': 2,'>': 2,'=': 2,'<=': 2,'>=': 2
};

// number wise element types
const ElemType = {
    LOGICAL: 1,COMPARISON: 2,STRING: 3,INTEGER: 4,VARIABLE: 5
};

// Ast node class
// class ASTNode {
//     constructor(elemType, value, left = null, right = null) {
//         this.elemType = elemType;
//         this.value = value;
//         this.left = left;
//         this.right = right;
//     }
// }

//  for validating 
const validateRule = (rule) => {
    const rulePattern = /\w+\s*(<|>|=|<=|>=)\s*('[^']*'|\w+)\s*(AND|OR)\s*\w+\s*(<|>|=|<=|>=)\s*('[^']*'|\w+)/i;
    return rulePattern.test(rule);
};

const shuntingYard = (rule) => {
    const tokens = rule.match(/\w+|[><]=?|AND|OR|\(|\)|=/g);
    const stack = [];
    const postfixExpr = [];

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

export const createRule = async (rule_name, rule) => {
    
    if (!rule_name || rule_name.length <= 0) {
        throw new Error("rule_name can't be null or length can't be zero");
    }
    if (!rule || typeof rule !== 'string') {
        throw new Error("rule can't be null");
    }

    const isValidRule = validateRule(rule);
    if (!isValidRule) {
        throw new Error("Invalid rule format. Ensure it contains logical and comparison operators.");
    }

    const existingRule = await Rule.findOne({ ruleName: rule_name });
    if (existingRule) {
        throw new Error("Rule with the same name already exists.");
    }

    const postfixExpr = shuntingYard(rule);
    console.log(postfixExpr)
    const root = await createAST(postfixExpr);
    if (!root) {
        throw new Error('Failed to create AST');
    }

    const newRule = new Rule({
        ruleName: rule_name,
        rule: rule,
        root: root._id,
        postfixExpr
    });
    await newRule.save();
    return newRule;
};
