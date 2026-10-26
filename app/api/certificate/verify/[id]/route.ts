import { NextResponse } from 'next/server';
import { verifyCertificateById, getCertificateConfig } from '@/lib/certificate';

export const dynamic = 'force-dynamic';

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        if (!id) {
            return NextResponse.json({ success: false, error: 'Certificate ID is required' }, { status: 400 });
        }

        const record = await verifyCertificateById(id);
        const config = await getCertificateConfig();

        if (!record) {
            return NextResponse.json({
                success: false,
                verified: false,
                error: 'Certificate not found. This ID does not match any valid Happeno credential.'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            verified: true,
            certificate: {
                certificate_id: record.certificate_id,
                recipient_name: record.member_name,
                team_name: record.team_name,
                team_id: record.team_id,
                role: record.role,
                issued_at: record.issued_at,
                verification_hash: record.verification_hash,
                event_title: config.event_title,
                issuer: config.issuer_name,
                status: 'Authentic & Verified'
            }
        });
    } catch (err: unknown) {
        console.error('Certificate Verify GET Error:', err);
        const message = err instanceof Error ? err.message : 'Error verifying certificate';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
