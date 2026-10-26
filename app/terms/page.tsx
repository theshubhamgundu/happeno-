"use client";

import FadeInView from "@/components/FadeInView";
import LayoutWrapper from "@/components/LayoutWrapper";

export default function TermsPage() {
    return (
        <LayoutWrapper>
            <div className="relative z-10 container mx-auto px-4 py-32 max-w-4xl">
                <FadeInView>
                    <h1 className="text-white font-kanit font-black text-4xl md:text-6xl uppercase italic mb-12 border-b-4 border-[#FFEE00] pb-4 inline-block">
                        TERMS & <span className="text-[#FFEE00]">CONDITIONS</span>
                    </h1>
                </FadeInView>

                <div className="space-y-12 text-white/80 font-poppins leading-relaxed bg-white/5 backdrop-blur-md p-8 md:p-12 rounded-[35px] border border-white/10 shadow-2xl">
                    <section>
                        <h2 className="text-white font-kanit font-bold text-2xl uppercase italic mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#FFEE00] text-[#62009B] flex items-center justify-center font-black not-italic text-sm">01</span>
                            OVERVIEW
                        </h2>
                        <p>
                            HAPPENO is a hackathon HMSplatform organized to foster innovation, structured stage evaluation, and technical excellence. By registering, teams and individuals agree to follow the rules, code of conduct, and guidelines set by the organizing committee.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white font-kanit font-bold text-2xl uppercase italic mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#00C8FF] text-white flex items-center justify-center font-black not-italic text-sm">02</span>
                            REGISTRATION
                        </h2>
                        <p>
                            Teams must register through the official website (https://happeno.in). All information provided during registration must be accurate. Duplicate registrations or providing false information may lead to disqualification.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white font-kanit font-bold text-2xl uppercase italic mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#BA45E8] text-white flex items-center justify-center font-black not-italic text-sm">03</span>
                            CODE OF CONDUCT
                        </h2>
                        <p>
                            Participants are expected to maintain professional behavior throughout the event. Plagiarism, harassment, or any form of misconduct will result in immediate disqualification and removal from the venue. All projects must be built during the 24-hour duration of the hackathon.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white font-kanit font-bold text-2xl uppercase italic mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-[#FFEE00] text-[#62009B] flex items-center justify-center font-black not-italic text-sm">04</span>
                            INTELLECTUAL PROPERTY
                        </h2>
                        <p>
                            Participants retain ownership of the intellectual property they create during the hackathon. However, by participating, you grant HAPPENO a non-exclusive, royalty-free license to showcase your project for promotional purposes.
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
