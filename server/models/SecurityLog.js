import mongoose from 'mongoose';

const SecurityLogSchema = new mongoose.Schema({
    user: {
        type: String, // email or "Unknown"
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['success', 'failed'],
        required: true
    },
    location: {
        type: String,
        default: 'Unknown'
    },
    riskScore: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    }
}, { timestamps: true });

export default mongoose.model('SecurityLog', SecurityLogSchema);
