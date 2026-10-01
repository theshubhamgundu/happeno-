import tls from 'tls';

export interface InboundEmailSummary {
    id: number;
    from: string;
    fromName: string;
    fromEmail: string;
    subject: string;
    date: string;
    snippet: string;
    isUnread: boolean;
    messageId?: string;
    matchedTeamId?: string;
    matchedTeamName?: string;
}

export interface InboxStatus {
    total: number;
    unseen: number;
    connected: boolean;
    host: string;
    user: string;
    lastChecked: string;
}

function parseHeaderField(headers: string, field: string): string {
    const regex = new RegExp(`^${field}:\\s*(.*)$`, 'im');
    const match = headers.match(regex);
    if (!match) return '';
    return match[1].replace(/[\r\n]+/g, ' ').trim();
}

function parseFromAddress(fromHeader: string): { name: string; email: string } {
    if (!fromHeader) return { name: '', email: '' };
    const emailMatch = fromHeader.match(/<([^>]+)>/);
    if (emailMatch) {
        const email = emailMatch[1].trim();
        const name = fromHeader.replace(/<[^>]+>/, '').replace(/["']/g, '').trim();
        return { name: name || email.split('@')[0], email };
    }
    const clean = fromHeader.replace(/["']/g, '').trim();
    return { name: clean.split('@')[0], email: clean };
}

/**
 * Connect to cPanel IMAP server and fetch inbox status and recent messages
 */
export async function getInboundEmails(limit = 15): Promise<{ status: InboxStatus; emails: InboundEmailSummary[] }> {
    const host = process.env.SMTP_CONNECT_HOST || process.env.SMTP_HOST || '148.113.0.192';
    const servername = process.env.SMTP_TLS_SERVERNAME || process.env.SMTP_HOST || 'cloud-xent.crazzydns.com';
    const user = process.env.SMTP_USER || 'business@centle.in';
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
    const port = 993; // Standard cPanel IMAP SSL Port

    if (!user || !pass) {
        throw new Error('Mailbox credentials missing in .env.local (SMTP_USER / SMTP_PASSWORD).');
    }

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            try { socket.destroy(); } catch { }
            reject(new Error(`IMAP connection timed out after 12s connecting to ${servername}:${port}`));
        }, 12000);

        let buffer = '';
        let tagIndex = 1;
        const nextTag = () => `A${String(tagIndex++).padStart(3, '0')}`;

        let currentTag = '';
        let step: 'greeting' | 'login' | 'select' | 'fetch' | 'logout' = 'greeting';
        let totalCount = 0;
        let unseenCount = 0;
        const rawFetchedMessages: string[] = [];

        const socket = tls.connect({
            host,
            port,
            servername,
            rejectUnauthorized: false
        }, () => {
            // Connected to TLS
        });

        socket.setEncoding('utf8');

        socket.on('error', (err) => {
            clearTimeout(timeout);
            reject(new Error(`IMAP Socket Error on ${servername}: ${err.message}`));
        });

        socket.on('data', (chunk: string) => {
            buffer += chunk;

            if (step === 'greeting') {
                if (buffer.includes('* OK')) {
                    buffer = '';
                    step = 'login';
                    currentTag = nextTag();
                    socket.write(`${currentTag} LOGIN "${user}" "${pass}"\r\n`);
                }
            } else if (step === 'login') {
                if (buffer.includes(`${currentTag} OK`)) {
                    buffer = '';
                    step = 'select';
                    currentTag = nextTag();
                    socket.write(`${currentTag} SELECT INBOX\r\n`);
                } else if (buffer.includes(`${currentTag} NO`) || buffer.includes(`${currentTag} BAD`)) {
                    clearTimeout(timeout);
                    socket.end();
                    reject(new Error(`IMAP login failed for ${user}. Please verify email password.`));
                }
            } else if (step === 'select') {
                if (buffer.includes(`${currentTag} OK`)) {
                    const existsMatch = buffer.match(/\*\s+(\d+)\s+EXISTS/i);
                    totalCount = existsMatch ? parseInt(existsMatch[1], 10) : 0;

                    const unseenMatch = buffer.match(/\[UNSEEN\s+(\d+)\]/i);
                    unseenCount = unseenMatch ? parseInt(unseenMatch[1], 10) : 0;

                    if (totalCount === 0) {
                        step = 'logout';
                        currentTag = nextTag();
                        socket.write(`${currentTag} LOGOUT\r\n`);
                        return;
                    }

                    // Fetch the latest N messages
                    const start = Math.max(1, totalCount - limit + 1);
                    const end = totalCount;
                    buffer = '';
                    step = 'fetch';
                    currentTag = nextTag();
                    // Fetch headers + first 400 bytes of text snippet + flags
                    socket.write(`${currentTag} FETCH ${start}:${end} (FLAGS BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)] BODY.PEEK[TEXT]<0.400>)\r\n`);
                }
            } else if (step === 'fetch') {
                if (buffer.includes(`${currentTag} OK`)) {
                    const fetchOutput = buffer;
                    buffer = '';

                    // Split responses by '* <id> FETCH'
                    const items = fetchOutput.split(/\*\s+(\d+)\s+FETCH/i);
                    // items will alternate: [preamble, id1, content1, id2, content2, ...]
                    const emails: InboundEmailSummary[] = [];

                    for (let i = 1; i < items.length; i += 2) {
                        const msgId = parseInt(items[i], 10);
                        const msgContent = items[i + 1] || '';

                        const isUnread = !msgContent.includes('\\Seen');

                        // Extract headers block
                        const headerMatch = msgContent.match(/BODY\[HEADER[^\]]*\]\s+\{\d+\}\r?\n([\s\S]*?)(?=\r?\n\r?\n|\)\r?\n|\r?\nBODY\[TEXT)/i);
                        const headers = headerMatch ? headerMatch[1] : msgContent;

                        const rawFrom = parseHeaderField(headers, 'From');
                        const subject = parseHeaderField(headers, 'Subject') || '(No Subject)';
                        const date = parseHeaderField(headers, 'Date') || new Date().toISOString();
                        const messageId = parseHeaderField(headers, 'Message-ID');

                        const { name: fromName, email: fromEmail } = parseFromAddress(rawFrom);

                        // Extract body text snippet
                        let snippet = '';
                        const textMatch = msgContent.match(/BODY\[TEXT[^\]]*\]\s+\{\d+\}\r?\n([\s\S]*?)(?=\r?\n\s*\)|\r?\n\*\s+\d+\s+FETCH|\r?\n[A-Z0-9]+\s+OK)/i);
                        if (textMatch && textMatch[1]) {
                            snippet = textMatch[1]
                                .replace(/<[^>]+>/g, ' ') // Strip HTML tags
                                .replace(/=\r?\n/g, '')     // Clean quoted-printable line breaks
                                .replace(/\s+/g, ' ')
                                .trim()
                                .slice(0, 200);
                        }

                        emails.push({
                            id: msgId,
                            from: rawFrom,
                            fromName,
                            fromEmail,
                            subject,
                            date,
                            snippet,
                            isUnread,
                            messageId
                        });
                    }

                    // Reverse to show latest first
                    emails.reverse();

                    step = 'logout';
                    currentTag = nextTag();
                    socket.write(`${currentTag} LOGOUT\r\n`);

                    clearTimeout(timeout);
                    socket.end();

                    resolve({
                        status: {
                            total: totalCount,
                            unseen: unseenCount,
                            connected: true,
                            host: servername,
                            user,
                            lastChecked: new Date().toISOString()
                        },
                        emails
                    });
                }
            } else if (step === 'logout') {
                clearTimeout(timeout);
                socket.end();
            }
        });
    });
}
