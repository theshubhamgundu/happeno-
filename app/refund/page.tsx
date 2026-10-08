"use client";

import FadeInView from "@/components/FadeInView";
import LayoutWrapper from "@/components/LayoutWrapper";

export default function RefundPage() {
    return (
        <LayoutWrapper>
            <div className="relative z-10 container mx-auto px-4 py-32 max-w-4xl">
                <FadeInView>
                    <h1 className="text-white font-kanit font-black text-4xl md:text-6xl uppercase italic mb-12 border-b-4 border-[#FFEE00] pb-4 inline-block">
                        REFUND <span className="text-[#FFEE00]">POLICY</span>
                    </h1>
                </FadeInView>

                <div className="space-y-12 text-white/80 font-poppins leading-relaxed bg-white/5 backdrop-blur-md p-8 md:p-12 rounded-[35px] border border-white/10 shadow-2xl">
                    <section>
                        <h2 className="text-white font-kanit font-bold text-2xl uppercase italic mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#FFEE00] text-[#62009B] flex items-center justify-center font-black not-italic text-sm">â‚¹</span>
                            REFUND ELIGIBILITY
                        </h2>
                        <p>
                            Due to the nature of hackathon planning and resource allocation, registration fees (<strong className="text-white">â‚¹600 per team</strong>) are generally non-refundable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white font-kanit font-bold text-2xl uppercase italic mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#00C8FF] text-white flex items-center justify-center font-black not-italic text-sm">!</span>
                            CANCELLATIONS
                        </h2>
                        <p>
                            If a team wishes to cancel their registration, they may do so at any time. However, the registration fee will not be refunded. In case the event is officially cancelled by the organizers for any reason beyond control, a full refund may be initiated to the original payment source within 7-10 working days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white font-kanit font-bold text-2xl uppercase italic mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#BA45E8] text-white flex items-center justify-center font-black not-italic text-sm">?</span>
                            DUPLICATE PAYMENTS
                        </h2>
                        <p>
                            If you have been charged twice for a single registration due to a technical glitch, please contact our support team at <a href="mailto:admin@tricity.centle.in" className="text-[#FFEE00] hover:underline">admin@tricity.centle.in</a> with payment proofs. Duplicate captures will be reversed after manual verification.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-white/10 text-sm text-white/40 italic">
                        Last Updated: February 2026
                    </div>
                </div>
            </div>
        </LayoutWrapper>
    );
}
