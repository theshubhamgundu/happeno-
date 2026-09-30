import nextEnv from '@next/env';
import nodemailer from 'nodemailer';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const argumentsList = process.argv.slice(2);
const verifyOnly = argumentsList.includes('--verify-only');
const recipient = argumentsList.find(argument => argument !== '--verify-only') || 'shubhamvasantgundu@gmail.com';
const host = process.env.SMTP_HOST;
const connectHost = process.env.SMTP_CONNECT_HOST || host;
const tlsServername = process.env.SMTP_TLS_SERVERNAME || host;
const username = process.env.SMTP_USER;
const password = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
const port = Number(process.env.SMTP_PORT || 465);
const secureValue = process.env.SMTP_SECURE?.toLowerCase();

if (!host || !connectHost || !tlsServername || !username || !password) {
    console.error('Missing SMTP configuration. Set SMTP_HOST, SMTP_USER, and SMTP_PASS (or SMTP_PASSWORD) in .env.local.');
    process.exit(1);
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('SMTP_PORT must be a valid port number.');
    process.exit(1);
}

if (secureValue && secureValue !== 'true' && secureValue !== 'false') {
    console.error('SMTP_SECURE must be either true or false.');
    process.exit(1);
}

const secure = secureValue ? secureValue === 'true' : port === 465;
if (port === 465 && !secure) {
    console.error('SMTP_SECURE must be true when SMTP_PORT is 465.');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: connectHost,
    port,
    secure,
    tls: { servername: tlsServername },
    auth: { user: username, pass: password }
});

try {
    await transporter.verify();
    if (verifyOnly) {
        console.log(`SMTP connection and authentication verified for ${username} at ${connectHost}:${port} (TLS server name ${tlsServername}); no email was sent.`);
    } else {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || username,
            to: recipient,
            subject: 'TRI-CITY AI HACKATHON - Sample Email',
            text: `Hello Shubham,\n\nThis is a sample email to verify TRI-CITY AI HACKATHON email delivery.\n\nParticipant registration edits are scheduled for October 5-6, 2026 (IST). The team event dashboard is scheduled for October 10-11, 2026.\n\nThis sample does not include real team credentials or a check-in QR code.\n\nTRI-CITY AI HACKATHON`,
            html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1a1a1a;line-height:1.6"><h1>Sample email</h1><p>Hello Shubham,</p><p>This is a sample email to verify TRI-CITY AI HACKATHON email delivery.</p><p>Participant registration edits are scheduled for <strong>October 5-6, 2026 (IST)</strong>. The team event dashboard is scheduled for <strong>October 10-11, 2026</strong>.</p><p>This sample does not include real team credentials or a check-in QR code.</p><p>TRI-CITY AI HACKATHON</p></div>'
        });
        console.log(`Sample email sent to ${recipient}.`);
    }
} catch (error) {
    const smtpError = error && typeof error === 'object' ? error : {};
    const code = 'code' in smtpError && typeof smtpError.code === 'string' ? smtpError.code : '';
    const responseCode = 'responseCode' in smtpError && typeof smtpError.responseCode === 'number' ? smtpError.responseCode : 0;
    const cause = 'cause' in smtpError && smtpError.cause && typeof smtpError.cause === 'object' ? smtpError.cause : {};
    const causeCode = 'code' in cause && typeof cause.code === 'string' ? cause.code : '';
    const errorText = `${error instanceof Error ? error.message : ''} ${'message' in cause && typeof cause.message === 'string' ? cause.message : ''}`;
    if (/ERR_TLS_CERT_ALTNAME_INVALID|does not match certificate's altnames|certificate name mismatch/i.test(errorText)) {
        console.error(`SMTP TLS certificate name mismatch for ${tlsServername}; the provider's certificate does not cover this server name. No SMTP credentials were sent and no email was sent.`);
    } else if (code === 'ETIMEDOUT' || causeCode === 'ETIMEDOUT' || /\bETIMEDOUT\b|timed out/i.test(errorText)) {
        console.error(`SMTP connection timed out before authentication at ${connectHost}:${port} (TLS server name ${tlsServername}); no email was sent. Check provider availability and network/firewall access.`);
    } else if (['ENOTFOUND', 'ECONNREFUSED', 'ECONNECTION'].includes(code || causeCode)) {
        console.error(`SMTP connection to ${connectHost}:${port} failed (${code || causeCode}; TLS server name ${tlsServername}); no email was sent. Check provider service availability.`);
    } else if (code === 'EAUTH' || causeCode === 'EAUTH' || responseCode === 535) {
        console.error(`SMTP authentication failed for ${username}; no email was sent. Verify the mailbox credentials with the provider.`);
    } else {
        const message = error instanceof Error
            ? error.message.replaceAll(password, '[redacted]')
            : 'Unknown SMTP error.';
        console.error(`Sample email was not sent${code ? ` (${code})` : ''}: ${message}`);
    }
    process.exitCode = 1;
} finally {
    transporter.close();
}