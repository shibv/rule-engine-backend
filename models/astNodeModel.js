import mongoose from 'mongoose';
const { Schema } = mongoose;

const nodeSchema = new Schema({
    elemType: Number,
    value: String,
    left: { type: Schema.Types.ObjectId, ref: 'AstNode' },
    right: { type: Schema.Types.ObjectId, ref: 'AstNode' }
});

const AstNode = mongoose.model('AstNode', nodeSchema);
export default AstNode;
