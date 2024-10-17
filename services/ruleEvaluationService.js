// services/ruleEvaluationService.js
import Node from '../models/astNodeModel.js';
import Rule from '../models/ruleModel.js';

class ASTNode {
    constructor(elemType, value, left = null, right = null) {
        this.elemType = elemType;
        this.value = value;
        this.left = left;
        this.right = right;
    }
}

const ElemType = {
    COMPARISON: 2,
    LOGICAL: 1,
};

// Function to reconstruct the AST from MongoDB
const reconstructAST = async (nodeId) => {
    if (!nodeId) {
        return null;
    }
    const node = await Node.findById(nodeId).exec();
    if (!node) {
        return null;
    }
    const leftNode = await reconstructAST(node.left);
    const rightNode = await reconstructAST(node.right);
    return new ASTNode(node.elemType, node.value, leftNode, rightNode);
};

// Function to evaluate the AST
const evaluateAST = (node, conditions) => {
    if (!node) {
        return false;
    }

    if (node.elemType === ElemType.COMPARISON) {
        const leftValue = conditions[node.left.value]; // Get the value of the left node (e.g., 'age' or 'department')
        const rightValue = conditions[node.right.value] !== undefined ? conditions[node.right.value] : node.right.value; // Get the value of the right node (e.g., '35' or 'sales')

        // If rightValue is not a number, it means it's a variable from conditions
        const parsedRightValue = isNaN(rightValue) ? rightValue : parseInt(rightValue, 10);
        // console.log(parsedRightValue)
        switch (node.value) {
            case '>':
                return leftValue > parsedRightValue;
            case '<':
                return leftValue < parsedRightValue;
            case '=':
                return leftValue === parsedRightValue;
            case '<=':
                return leftValue <= parsedRightValue;
            case '>=':
                return leftValue >= parsedRightValue;
            default:
                return false;
        }
    }

    if (node.elemType === ElemType.LOGICAL) {
        const leftEval = evaluateAST(node.left, conditions);
        const rightEval = evaluateAST(node.right, conditions);

        if (node.value === 'and') {
            return leftEval && rightEval;
        } else if (node.value === 'or') {
            return leftEval || rightEval;
        }
    }

    return true;
};

// Controller function to find and evaluate the rule
export const evaluateRule = async (rule_name, conditions) => {
    //  rule by name
    const rule = await Rule.findOne({ ruleName: rule_name }).exec();
    if (!rule) {
        throw new Error("Rule not found");
    }

    // reconstruct the AST from rule
    const rootNode = await reconstructAST(rule.root);
    if (!rootNode) {
        throw new Error("Failed to reconstruct AST");
    }

    // evaluate the AST with conditions
    const evaluationResult = evaluateAST(rootNode, conditions);
    return evaluationResult;
};
