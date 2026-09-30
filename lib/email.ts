import nodemailer from 'nodemailer';

type OutboundEmail = {
    to: string;
    subject: string;
    text?: string;
    html: string;
    attachments?: Array<{ filename: string; content: Buffer }>;
};

export async function sendEmail(message: OutboundEmail) {
    const host = process.env.SMTP_HOST;
    const connectHost = process.env.SMTP_CONNECT_HOST || host;
    const tlsServername = process.env.SMTP_TLS_SERVERNAME || host;
    const username = process.env.SMTP_USER;
    const password = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    if (!host || !connectHost || !tlsServername || !username || !password) {
        throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS (or SMTP_PASSWORD).');
    }

    const port = Number(process.env.SMTP_PORT || 465);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('SMTP_PORT must be a valid port number.');
    }

    const secureValue = process.env.SMTP_SECURE?.toLowerCase();
    if (secureValue && secureValue !== 'true' && secureValue !== 'false') {
        throw new Error('SMTP_SECURE must be either true or false.');
    }
    const secure = secureValue ? secureValue === 'true' : port === 465;
    if (port === 465 && !secure) {
        throw new Error('SMTP_SECURE must be true when SMTP_PORT is 465.');
    }

    const transporter = nodemailer.createTransport({
        host: connectHost,
        port,
        secure,
        tls: { servername: tlsServername },
        auth: { user: username, pass: password }
    });

    try {
        return await transporter.sendMail({
            from: process.env.EMAIL_FROM || username,
            ...message
        });
    } catch (error: unknown) {
        const smtpError = error as NodeJS.ErrnoException & { responseCode?: number };
        const cause = smtpError.cause as NodeJS.ErrnoException | undefined;
        const errorText = `${smtpError.message || ''} ${cause?.message || ''}`;
        const errorCode = smtpError.code || cause?.code;
        if (/ERR_TLS_CERT_ALTNAME_INVALID|does not match certificate's altnames|certificate name mismatch/i.test(errorText)) {
            throw new Error(`SMTP TLS certificate name mismatch for ${tlsServername}; the provider's certificate does not cover the configured server name. No SMTP credentials were sent.`);
        }
        if (errorCode === 'ETIMEDOUT' || /\bETIMEDOUT\b|timed out/i.test(errorText)) {
            throw new Error(`SMTP connection timed out before a server response at ${connectHost}:${port} (TLS server name ${tlsServername}); check the provider's SMTP service and network/firewall access.`);
        }
        if (errorCode === 'ENOTFOUND' || errorCode === 'ECONNREFUSED' || errorCode === 'ECONNECTION') {
            throw new Error(`SMTP connection to ${connectHost}:${port} failed (${errorCode}; TLS server name ${tlsServername}); check the provider's SMTP service availability.`);
        }
        if (errorCode === 'EAUTH' || smtpError.responseCode === 535) {
            throw new Error(`SMTP authentication failed for ${username}; verify the mailbox username and password with the provider.`);
        }

        const errorMessage = error instanceof Error ? error.message.replaceAll(password, '[redacted]') : 'Unknown SMTP error.';
        throw new Error(`SMTP delivery failed${errorCode ? ` (${errorCode})` : ''}: ${errorMessage}`);
    } finally {
        transporter.close();
    }
}