/**
 * Sends a welcome email to a new user using Brevo SMTP API.
 * @param {string} email - Recipient email address.
 * @param {string} name - Recipient name.
 */
export const sendWelcomeEmail = async (email, name) => {
    const apiKey = import.meta.env.VITE_BREVO_API_KEY;

    if (!apiKey) {
        console.error('Brevo API key is not defined in environment variables.');
        return;
    }

    const data = {
        sender: {
            name: "Notemee",
            email: "lsgaming342@gmail.com" // Update with your verified sender email in Brevo
        },
        to: [
            {
                email: email,
                name: name || "Notemee User"
            }
        ],
        subject: "Welcome to Notemee!",
        htmlContent: `
            <html>
                <head></head>
                <body>
                    <h1>Welcome to Notemee, ${name || 'Friend'}!</h1>
                    <p>We're thrilled to have you join our community.</p>
                    <p>Notemee is designed to help you capture your thoughts and stay organized effortlessly.</p>
                    <p>If you have any questions, feel free to reach out to us at lsgaming342@gmail.com.</p>
                    <p>Happy Note-taking!</p>
                    <p>Best regards,<br>The Notemee Team</p>
                </body>
            </html>
        `
    };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Failed to send email: ${JSON.stringify(errorBody)}`);
        }

        console.log('Welcome email sent successfully to:', email);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};
