import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

import SecurityLog from '../models/SecurityLog.js';
import SystemSettings from '../models/SystemSettings.js';
import Otp from '../models/Otp.js';
import { sendEmail } from '../utils/email.js';

// Helper to get IP
const getIp = (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;


// Register new user (Direct, no OTP)
router.post('/register', async (req, res) => {
    try {
        // limit registration
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({});
        }
        if (!settings.publicRegistration) {
            return res.status(403).json({ message: 'Public registration is currently disabled.' });
        }

        const { name, email, password, image } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            image // Save avatar
        });

        await newUser.save();

        // Generate Token
        const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET || 'super_secret_key_nebula_123', { expiresIn: '1d' });

        res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, image: newUser.image } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const ip = getIp(req);
    const { email, password } = req.body;
    let location = "Unknown";
    // Mock location based on IP for now
    if (ip === "::1" || ip === "127.0.0.1") location = "Localhost";

    try {
        // Check user
        const user = await User.findOne({ email });

        const logAttempt = async (status, risk) => {
            await SecurityLog.create({
                user: email || "Unknown",
                ip,
                status,
                location,
                riskScore: risk
            });
        };

        if (!user) {
            await logAttempt('failed', 'Medium');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logAttempt('failed', 'High'); // Wrong password for existing user is higher risk
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Success
        await logAttempt('success', 'Low');

        // Generate Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'super_secret_key_nebula_123', { expiresIn: '1d' });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        await SecurityLog.create({ user: email, ip, status: 'failed', location, riskScore: 'Medium' });
        res.status(500).json({ error: err.message });
    }
});

// Removed fix-admin route to allow super-admin role to persist

export default router;
