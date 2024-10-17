import mongoose from 'mongoose';
const { Schema } = mongoose;

const ruleSchema = new Schema({
    ruleName: String,
    rule: String,
    root: { type: Schema.Types.ObjectId, ref: 'AstNode' },
    postfixExpr: [String]
});

const Rule = mongoose.model('Rule', ruleSchema);
export default Rule;
