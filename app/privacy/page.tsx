"use client";

import FadeInView from "@/components/FadeInView";
import LayoutWrapper from "@/components/LayoutWrapper";

export default function PrivacyPage() {
    return (
        <LayoutWrapper>
            <div className="relative z-10 container mx-auto px-4 py-32 max-w-4xl">
                <FadeInView>
                    <h1 className="text-white font-kanit font-black text-4xl md:text-6xl uppercase italic mb-12 border-b-4 border-[#FFEE00] pb-4 inline-block">
                        PRIVACY <span className="text-[#FFEE00]">POLICY</span>
                    </h1>
                </FadeInView>

                <div className="space-y-12 text-white/80 font-poppins leading-relaxed bg-white/5 backdrop-blur-md p-8 md:p-12 rounded-[35px] border border-white/10 shadow-2xl">
                    <section>
                        <h2 className="text-white font-kanit font-bold text-2xl uppercase italic mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#FFEE00] text-[#62009B] flex items-center justify-center font-black not-italic text-sm">P</span>
                            DATA COLLECTION
                        </h2>
                        <p>
                            We collect personal information such as name, email address, phone number, and college details solely for the purpose of event registration and communication.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white font-kanit font-bold text-2xl uppercase italic mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#00C8FF] text-white flex items-center justify-center font-black not-italic text-sm">U</span>
                            DATA USAGE
                        </h2>
                        <p>
                            Your information will be used to generate tickets, provide entry to the venue, and send important event updates via email. We do not sell or share your personal data with third-party advertisers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white font-kanit font-bold text-2xl uppercase italic mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#BA45E8] text-white flex items-center justify-center font-black not-italic text-sm">S</span>
                            SECURITY
                        </h2>
                        <p>
                            We implement standard security measures to protect your data. Payment information is handled through secure payment gateways and is not stored on our local servers.
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
