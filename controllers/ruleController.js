import { createRule as createRuleService } from '../services/ruleService.js';


export const createRule = async (req, res) => {
    try {
        const { rule_name, rule } = req.body;
        console.log("Craete Data", rule_name, rule)
        const newRule = await createRuleService(rule_name, rule);
        res.status(201).send({ message: 'Rule created successfully', rule: newRule });
    } catch (error) {
        console.error('Error creating Rule', error);
        res.status(400).send({ error: error.message });
    }
};



