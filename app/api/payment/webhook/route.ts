import { NextResponse } from "next/server";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import { verifyAndSendTicket } from "@/lib/email-service";
import { teamSupabase as supabase } from "@/lib/supabase";

// Initialize Cashfree
const cashfree = new Cashfree(
    process.env.CASHFREE_ENV === "PRODUCTION" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID!,
    process.env.CASHFREE_SECRET_KEY!
);

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const payload = JSON.parse(rawBody);

        const timestamp = req.headers.get("x-webhook-timestamp");
        const signature = req.headers.get("x-webhook-signature");

        console.log(`🔔 Webhook received for Order: ${payload.data.order.order_id}`);

        // Verify Signature
        try {
            if (signature && timestamp) {
                cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
            } else {
                return NextResponse.json({ message: "Missing signature headers" }, { status: 401 });
            }
        } catch (err) {
            console.error("❌ Invalid Webhook Signature", err);
            return NextResponse.json({ message: "Invalid Signature" }, { status: 401 });
        }

        const paymentStatus = payload.data.payment.payment_status;
        const orderId = payload.data.order.order_id;

        if (paymentStatus === "SUCCESS") {
            console.log(`✅ Payment Successful for Order ${orderId}. Processing...`);

            // Link Order ID to registration
            const { data: registration, error: sbError } = await supabase
                .from("registrations")
                .select("*")
                .eq("transaction_id", orderId)
                .single();

            if (registration) {
                const result = await verifyAndSendTicket(registration.transaction_id);
                if (result.success) {
                    console.log(`🎟️ Ticket sent successfully to ${registration.team_name} (${registration.email})`);
                } else {
                    console.error(`❌ Ticket Service Failed: ${result.message}`, result.error || "");
                }
            } else {
                console.error(`❌ No registration found in Supabase for Order ID: ${orderId}`, sbError || "Not found");
            }
        }

        return NextResponse.json({ status: "received" });
    } catch (error: any) {
        console.error("❌ Webhook Error:", error.message);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
