import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail', // or use host/port if not gmail
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // App Password for Gmail
    }
});

export const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('--- EMAIL SIMULATION ---');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body: ${html}`);
            console.log('------------------------');
            return true; // Return success for simulation
        }

        const info = await transporter.sendMail({
            from: `"Nebula Music" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
