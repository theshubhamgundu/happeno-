"use client";

import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

const timeline = [
    {
        date: "October 10, 2026",
        time: "8:00 AM – 11:00 AM",
        title: "Gate entry and check-in",
        description: "Bring your event pass and check in at the venue entrance.",
    },
    {
        date: "October 10, 2026",
        time: "11:00 AM",
        title: "Inauguration ceremony",
        description: "Join the opening ceremony and event briefing.",
    },
    {
        date: "October 10, 2026",
        time: "12:00 PM",
        title: "Hackathon begins",
        description: "The 24-hour project-building period starts.",
    },
    {
        date: "October 11, 2026",
        time: "12:00 PM",
        title: "Submission deadline",
        description: "Submit your project deliverables before the deadline.",
    },
];

export default function TeamTimelinePage() {
    return (
        <DashboardLayout type="team" title="Hackathon timeline" subtitle="Key event dates and milestones">
            <div className="mx-auto w-full max-w-4xl">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
                    <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5 sm:mb-8 sm:gap-4 sm:pb-6">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 sm:h-12 sm:w-12">
                            <CalendarDays size={20} className="sm:h-[22px] sm:w-[22px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 sm:text-xs">Student dashboard</p>
                            <h2 className="mt-1 text-lg font-bold leading-tight text-slate-900 sm:text-2xl">Event schedule</h2>
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:mt-2 sm:text-sm">Key event milestones · All times in India Standard Time (IST)</p>
                        </div>
                    </div>

                    <ol className="relative ml-2 space-y-4 border-l-2 border-slate-100 pl-5 sm:ml-3 sm:space-y-6 sm:pl-8">
                        {timeline.map((event) => (
                            <li key={`${event.date}-${event.title}`} className="relative min-w-0">
                                <span
                                    aria-hidden="true"
                                    className="absolute -left-[27px] top-[18px] h-3 w-3 rounded-full border-2 border-white bg-teal-600 shadow-[0_0_0_2px_rgba(20,184,166,0.18)] sm:-left-[39px] sm:top-[22px] sm:h-3.5 sm:w-3.5"
                                />
                                <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-5">
                                    <div className="flex flex-col gap-1.5 text-xs font-semibold leading-5 text-teal-700 min-[380px]:flex-row min-[380px]:flex-wrap min-[380px]:gap-x-4 sm:text-sm">
                                        <span className="inline-flex min-w-0 items-start gap-1.5"><CalendarDays size={14} className="mt-0.5 shrink-0" /><span>{event.date}</span></span>
                                        <span className="inline-flex min-w-0 items-start gap-1.5"><Clock3 size={14} className="mt-0.5 shrink-0" /><span>{event.time}</span></span>
                                    </div>
                                    <h3 className="mt-2.5 break-words text-sm font-bold leading-snug text-slate-900 sm:mt-3 sm:text-lg">{event.title}</h3>
                                    <p className="mt-1 break-words text-xs leading-relaxed text-slate-600 sm:text-sm">{event.description}</p>
                                </article>
                            </li>
                        ))}
                    </ol>

                    <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 sm:mt-8 sm:p-4 sm:text-sm">
                        <MapPin size={16} className="mt-0.5 shrink-0" />
                        Check your event pass or contact the organizers for your assigned venue and room.
                    </p>
                </section>
            </div>
        </DashboardLayout>
    );
}
