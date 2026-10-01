import tls from 'tls';

const host = '148.113.0.192';
const servername = 'cloud-xent.crazzydns.com';
const port = 993;
const user = 'business@centle.in';
const pass = 'Business2026';

console.log(`Connecting to IMAP at ${host}:${port} (TLS servername: ${servername})...`);

const socket = tls.connect({
    host,
    port,
    servername,
    rejectUnauthorized: false
}, () => {
    console.log('TLS connected to IMAP server successfully!');
});

socket.setEncoding('utf8');

socket.on('data', (data) => {
    console.log('<< IMAP Server response:\n', data.trim());
    if (data.includes('* OK')) {
        console.log('Sending LOGIN command...');
        socket.write(`A01 LOGIN "${user}" "${pass}"\r\n`);
    } else if (data.includes('A01 OK')) {
        console.log('>>> LOGIN SUCCESSFUL! Authenticated to cPanel mailbox.');
        console.log('Listing INBOX status...');
        socket.write(`A02 STATUS INBOX (MESSAGES UNSEEN RECENT)\r\n`);
    } else if (data.includes('A02 OK')) {
        console.log('Closing session...');
        socket.write(`A03 LOGOUT\r\n`);
    } else if (data.includes('A03 OK') || data.includes('* BYE')) {
        socket.end();
        process.exit(0);
    } else if (data.includes('A01 NO') || data.includes('A01 BAD')) {
        console.error('Login failed:', data);
        socket.end();
        process.exit(1);
    }
});

socket.on('error', (err) => {
    console.error('Socket error:', err);
    process.exit(1);
});

setTimeout(() => {
    console.log('Timeout after 10s');
    socket.destroy();
    process.exit(1);
}, 10000);
