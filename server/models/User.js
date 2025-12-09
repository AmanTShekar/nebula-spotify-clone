import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    playlists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist',
    }],
    likedSongs: [{
        id: String,
        source: { type: String, default: 'spotify' },
        name: String,
        artist: String,
        image: String,
        addedAt: { type: Date, default: Date.now }
    }],
    role: {
        type: String,
        enum: ['user', 'admin', 'super-admin'],
        default: 'user'
    },
    searchHistory: [{
        query: String,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
