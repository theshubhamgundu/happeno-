"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Image from "next/image";

function StatusContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get("status");
    const transactionId = searchParams.get("id");

    const isSuccess = status === "success";
    const isFailed = status === "failed";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full bg-[#1A002E]/80 backdrop-blur-xl border-2 border-white/10 rounded-[40px] p-10 text-center shadow-2xl relative z-10"
        >
            <div className="absolute top-0 left-0 w-full h-2 rounded-t-[40px] overflow-hidden">
                <div className={`h-full w-full ${isSuccess ? "bg-[#FFEE00]" : isFailed ? "bg-red-500" : "bg-orange-500"}`} />
            </div>

            {isSuccess ? (
                <>
                    <div className="w-24 h-24 bg-[#FFEE00]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#FFEE00]/20">
                        <CheckCircle2 className="w-12 h-12 text-[#FFEE00]" />
                    </div>
                    <h2 className="text-white text-3xl font-kanit font-black mb-2 uppercase italic">PAYMENT RECEIVED!</h2>
                    <p className="text-[#FFEE00] font-bold text-sm tracking-widest mb-6">TRANSACTION ID: {transactionId}</p>
                    <p className="text-white/70 mb-8 leading-relaxed">
                        Your registration for TRI-CITY AI HACKATHON is confirmed! Your slot is now locked. Check your email for further instructions.
                    </p>
                    <Link
                        href="/dashboard"
                        className="w-full inline-block bg-[#FFEE00] text-[#62009B] font-kanit font-black py-4 rounded-2xl hover:bg-[#FFD620] transition-all hover:scale-[1.02] uppercase tracking-widest text-lg"
                    >
                        GO TO DASHBOARD
                    </Link>
                </>
            ) : isFailed ? (
                <>
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <XCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-white text-3xl font-kanit font-black mb-2 uppercase italic">PAYMENT FAILED</h2>
                    <p className="text-red-500 font-bold text-sm tracking-widest mb-6">TRANSACTION ID: {transactionId}</p>
                    <p className="text-white/70 mb-8 leading-relaxed">
                        Something went wrong with the payment. Don't worry, if any money was deducted, it will be refunded within 3-5 business days. Please try again.
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/register"
                            className="w-full inline-block bg-white/5 text-white font-kanit font-bold py-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all uppercase tracking-widest"
                        >
                            TRY AGAIN
                        </Link>
                        <Link href="/" className="inline-block text-white/40 hover:text-white transition-colors text-sm font-medium">
                            Back to Homepage
                        </Link>
                    </div>
                </>
            ) : (
                <>
                    <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                        <AlertCircle className="w-12 h-12 text-orange-500" />
                    </div>
                    <h2 className="text-white text-3xl font-kanit font-black mb-4 uppercase italic">SOMETHING WENT WRONG</h2>
                    <p className="text-white/70 mb-8 leading-relaxed">
                        We couldn't verify your payment status. Please contact the support team or check your transaction history.
                    </p>
                    <Link
                        href="/contact"
                        className="w-full inline-block bg-white text-[#62009B] font-kanit font-black py-4 rounded-2xl hover:bg-white/90 transition-all uppercase tracking-widest text-lg"
                    >
                        SUPPORT TICKET
                    </Link>
                </>
            )}
        </motion.div>
    );
}

function LoadingFallback() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md w-full bg-[#1A002E]/80 backdrop-blur-xl border-2 border-white/10 rounded-[40px] p-10 text-center shadow-2xl relative z-10"
        >
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20 animate-pulse" />
            <div className="h-8 w-3/4 bg-white/10 mx-auto mb-4 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-white/10 mx-auto rounded animate-pulse" />
        </motion.div>
    );
}

export default function PaymentStatusPage() {
    return (
        <div className="min-h-screen bg-[#13001F] flex items-center justify-center p-4 relative overflow-hidden font-poppins">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#62009B] opacity-20 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#A200FF] opacity-10 blur-[120px] rounded-full" />
            </div>

            <Suspense fallback={<LoadingFallback />}>
                <StatusContent />
            </Suspense>
        </div>
    );
}
