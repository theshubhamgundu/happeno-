"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, Check, Smartphone, IndianRupee } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used based on package.json

interface UpiPaymentProps {
    payeeVpa: string;
    payeeName: string;
    defaultAmount?: number;
    fixedAmount?: boolean; // If true, amount cannot be changed
    transactionNote?: string;
    className?: string; // For additional styling
}

export const UpiPayment: React.FC<UpiPaymentProps> = ({
    payeeVpa,
    payeeName,
    defaultAmount = 0,
    fixedAmount = false,
    transactionNote = "Payment",
    className = "",
}) => {
    const [amount, setAmount] = useState<string>(defaultAmount > 0 ? defaultAmount.toString() : "");
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const [copied, setCopied] = useState(false);

    // Generate UPI URL
    const generateUpiUrl = (amt: string) => {
        // Basic UPI Deep Link format
        // pa: Payee Address (VPA)
        // pn: Payee Name
        // am: Amount
        // tn: Transaction Note
        // cu: Currency (INR)

        // Ensure amount has 2 decimal places if present
        const formattedAmount = amt ? parseFloat(amt).toFixed(2) : "0";

        return `upi://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${formattedAmount}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;
    };

    useEffect(() => {
        // Generate QR Code whenever relevant state changes
        const upiUrl = generateUpiUrl(amount);

        QRCode.toDataURL(upiUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
        })
            .then((url) => {
                setQrCodeUrl(url);
            })
            .catch((err) => {
                console.error("Error generating QR code", err);
            });
    }, [amount, payeeVpa, payeeName, transactionNote]);

    const handleCopyVpa = () => {
        navigator.clipboard.writeText(payeeVpa);
        setCopied(true);
        toast.success("UPI ID copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePayNow = () => {
        // This will try to open the UPI app on mobile devices
        window.location.href = generateUpiUrl(amount);
    };

    return (
        <div className={`w-full max-w-md mx-auto ${className} font-kanit`}>
            <div className="relative overflow-hidden rounded-[24px] bg-[#0B0114] border border-white/10 shadow-[0_0_40px_rgba(122,0,212,0.15)] flex flex-col items-center p-6 sm:p-8">

                {/* Header */}
                <div className="text-center mb-4 sm:mb-6 z-10">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">UPI Payment</h2>
                    <p className="text-white/60 text-[10px] sm:text-sm">Scan or click to pay securely</p>
                </div>

                {/* Amount Input Section */}
                <div className="w-full mb-4 sm:mb-6 z-10">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                            <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 group-focus-within:text-yellow-400 transition-colors" />
                        </div>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={fixedAmount}
                            placeholder="Enter Amount"
                            className={`block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-base sm:text-lg font-medium ${fixedAmount ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        />
                    </div>
                </div>

                {/* QR Code Section */}
                <div className="relative p-1 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 rounded-2xl shadow-xl mb-4 sm:mb-6 group cursor-pointer z-10">
                    <div className="bg-white rounded-[13px] p-1.5 sm:p-2">
                        {qrCodeUrl ? (
                            <div className="relative aspect-square w-48 sm:w-64 md:w-72">
                                <img
                                    src={qrCodeUrl}
                                    alt="UPI QR Code"
                                    className="w-full h-full object-contain mix-blend-multiply"
                                />
                                {/* Center Logo/Icon for branding */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-white p-1 rounded-full shadow-md w-10 h-10 flex items-center justify-center relative overflow-hidden">
                                        <span className="font-kanit font-black text-lg italic text-[#62009B]">T</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">
                                Generating...
                            </div>
                        )}
                    </div>
                </div>

                {/* Payee Details */}
                <div className="w-full bg-white/5 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-white/5 z-10">
                    <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                        <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider">Payee</span>
                        <span className="text-white font-medium text-[11px] sm:text-sm text-right">{payeeName}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                        <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider">UPI ID</span>
                        <button
                            onClick={handleCopyVpa}
                            className="flex items-center gap-1.5 sm:gap-2 text-purple-400 hover:text-white transition-colors text-[10px] sm:text-sm font-mono bg-purple-500/10 hover:bg-purple-500/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md overflow-hidden max-w-[150px] sm:max-w-none"
                        >
                            <span className="truncate">{payeeVpa}</span>
                            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        </button>
                    </div>
                </div>

                {/* Actions - Mobile Pay Button */}
                <button
                    onClick={handlePayNow}
                    className="w-full bg-[linear-gradient(104deg,_#FFEC1A_24.89%,_#FFE60B_56.78%,_#FFE41A_108.63%)] text-[#2B0040] font-extrabold text-lg py-4 rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.25)] hover:transform hover:translate-y-[-2px] active:translate-y-[0px] transition-all flex items-center justify-center gap-2 z-10"
                >
                    <Smartphone size={20} />
                    Pay via App
                </button>

                {/* Disclaimer */}
                <p className="mt-6 text-xs text-white/30 text-center max-w-xs z-10">
                    Make sure to verify the payee name before proceeding. Payments are direct bank transfers.
                </p>

                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-purple-600 rounded-full blur-[60px] opacity-40"></div>
                    <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-yellow-500 rounded-full blur-[60px] opacity-20"></div>
                </div>

            </div>
        </div>
    );
};

export default UpiPayment;
