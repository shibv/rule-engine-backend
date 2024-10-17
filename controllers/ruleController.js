import { createRule as createRuleService } from '../services/ruleService.js';
import { evaluateRule as evaluateRuleService } from '../services/ruleEvaluationService.js';
import { combineRules as combineRulesService } from '../services/ruleCombinationService.js';


export const createRule = async (req, res) => {
    try {
        const { rule_name, rule } = req.body;
        const newRule = await createRuleService(rule_name, rule);
        res.status(201).send({ message: 'Rule created successfully', rule: newRule });
    } catch (error) {
        console.error('Error creating Rule', error);
        res.status(400).send({ error: error.message });
    }
};

export const evaluateRule = async (req, res) => {
    try {
        const { rule_name, conditions } = req.body;
        const evaluationResult = await evaluateRuleService(rule_name, conditions);
        res.status(200).send({ message: 'Rule evaluated successfully', evaluationResult });
    } catch (error) {
        console.error('Error evaluating Rule:', error);
        res.status(404).send({ error: error.message });
    }
};





export const combineRules = async (req, res) => {
    try {
        const { rule_name, rules } = req.body;
        const newRule = await combineRulesService(rule_name, rules);
        res.status(201).send({ message: 'Rules combined successfully', rule: newRule });
    } catch (error) {
        console.error('Error combining Rules:', error);
        res.status(400).send({ error: error.message });
    }
};



