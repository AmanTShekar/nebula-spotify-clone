import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
    publicRegistration: {
        type: Boolean,
        default: true
    },
    requireEmailVerify: {
        type: Boolean,
        default: false
    },
    rootApiKey: {
        type: String,
        default: () => 'sk_live_' + Math.random().toString(36).substring(2, 15)
    }
}, { timestamps: true });

export default mongoose.model('SystemSettings', SystemSettingsSchema);
