import { NextResponse } from "next/server";
import { Cashfree, CFEnvironment } from "cashfree-pg";

const cashfree = new Cashfree(
    process.env.CASHFREE_ENV === "PRODUCTION" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID!,
    process.env.CASHFREE_SECRET_KEY!
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get("order_id");

        if (!orderId) {
            return NextResponse.json({ message: "Order ID is required" }, { status: 400 });
        }

        const response = await cashfree.PGFetchOrder(orderId);

        return NextResponse.json({
            order_id: response.data.order_id,
            order_status: response.data.order_status,
            payment_session_id: response.data.payment_session_id
        });
    } catch (error: any) {
        console.error("Cashfree Status Error:", error.response?.data || error.message);
        return NextResponse.json({ message: "Failed to fetch order status" }, { status: 500 });
    }
}
