"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle, RefreshCw, Home } from "lucide-react";

const FailedContent = () => {
    const searchParams = useSearchParams();
    const transactionId = searchParams.get('transactionId');

    return (
        <div className="min-h-screen bg-[#0B0114] flex items-center justify-center p-4 font-poppins">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-10 text-center backdrop-blur-xl shadow-2xl"
            >
                <div className="mb-8 relative inline-block">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="bg-red-500 w-24 h-24 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(239,68,68,0.4)]"
                    >
                        <XCircle size={48} className="text-white" />
                    </motion.div>
                </div>

                <h2 className="text-3xl font-black italic uppercase italic tracking-tighter text-white mb-4">Payment Failed</h2>
                <p className="text-white/60 font-medium mb-10 leading-relaxed">
                    Something went wrong with your transaction. No funds were captured.
                    {transactionId && (
                        <span className="block mt-2 text-[10px] font-mono opacity-40 uppercase tracking-widest">
                            Ref: {transactionId}
                        </span>
                    )}
                </p>

                <div className="flex flex-col gap-4">
                    <Link
                        href="/register"
                        className="flex items-center justify-center gap-3 bg-white text-black font-black uppercase italic py-4 rounded-2xl shadow-[8px_8px_0_#ef4444] hover:-translate-y-1 hover:-translate-x-1 transition-all"
                    >
                        <RefreshCw size={20} />
                        Try Again
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-3 bg-white/5 text-white/60 font-bold py-4 rounded-2xl hover:bg-white/10 transition-all"
                    >
                        <Home size={20} />
                        Back to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default function PaymentFailedPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0B0114] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <FailedContent />
        </Suspense>
    );
}
