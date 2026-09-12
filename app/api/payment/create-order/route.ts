import { NextResponse } from "next/server";
import { Cashfree, CFEnvironment } from "cashfree-pg";

// Initialize Cashfree
const cashfree = new Cashfree(
    process.env.CASHFREE_ENV === "PRODUCTION" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID!,
    process.env.CASHFREE_SECRET_KEY!
);

export async function POST(req: Request) {
    try {
        const { registrationData, amount } = await req.json();

        if (!registrationData || !amount) {
            return NextResponse.json({ message: "Missing required data" }, { status: 400 });
        }

        // Get Base URL for Vercel
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host");
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

        // Sanitize team_id (remove dots or other non-allowed chars)
        const sanitizedId = String(registrationData.team_id).replace(/[^a-zA-Z0-9_-]/g, '_');

        const request = {
            order_amount: amount,
            order_currency: "INR",
            order_id: `VH_${Date.now()}_${sanitizedId}`,
            customer_details: {
                customer_id: `CUST_${sanitizedId}`,
                customer_phone: registrationData.phone,
                customer_email: registrationData.email,
                customer_name: registrationData.captain
            },
            order_meta: {
                return_url: `${baseUrl}/register?order_id={order_id}`,
                notify_url: `${baseUrl}/api/payment/webhook`,
            },
            order_note: `TRI-CITY AI HACKATHON Registration for ${registrationData.team_name}`
        };

        const response = await cashfree.PGCreateOrder(request);

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Cashfree Order Error:", error.response?.data || error.message);
        return NextResponse.json({
            message: "Failed to create payment order",
            error: error.response?.data?.message || error.message
        }, { status: 500 });
    }
}
