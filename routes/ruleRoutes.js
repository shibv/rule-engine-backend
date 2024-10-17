import express from 'express';
import { createRule, combineRules , evaluateRule } from '../controllers/ruleController.js';

const router = express.Router();

// create rule routes
router.post('/', createRule);         
// combine rule routes        
router.post('/combine', combineRules);  
// evaluate rule routes        
router.post('/evaluate', evaluateRule);       

export default router;
