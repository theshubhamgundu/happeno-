import 'server-only';
import bcrypt from 'bcryptjs';

const COST_FACTOR = 12;

export function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, COST_FACTOR);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
}
