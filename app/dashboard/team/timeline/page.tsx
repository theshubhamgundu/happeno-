"use client";

import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

const timeline = [
    {
        date: "October 10, 2026",
        time: "7:30 – 9:00 AM",
        title: "Registration & Entry",
        description: "ID check, registration desk, kit and ID card collection. Solo participants collect band at the help desk.",
    },
    {
        date: "October 10, 2026",
        time: "9:00 – 10:00 AM",
        title: "Inauguration",
        description: "Welcome address, lamp lighting by chief guest, cultural performance, and event overview.",
    },
    {
        date: "October 10, 2026",
        time: "10:00 – 11:00 AM",
        title: "Panel Discussion & Guest Speeches",
        description: "Panel discussion on 'AI and the Tier-2 Advantage' followed by guest speeches.",
    },
    {
        date: "October 10, 2026",
        time: "11:00 AM – 12:00 PM",
        title: "Briefing & Classroom Allocation",
        description: "Rules and track briefing, team formation for solo participants, and move to allocated classrooms.",
    },
    {
        date: "October 10, 2026",
        time: "12:00 – 12:30 PM",
        title: "Buffer Time",
        description: "Settle in, perform Wi-Fi and power checks.",
    },
    {
        date: "October 10, 2026",
        time: "12:30 – 1:30 PM",
        title: "Session 1: Build Begins",
        description: "Start building on assigned problem statements.",
    },
    {
        date: "October 10, 2026",
        time: "1:30 – 2:30 PM",
        title: "Lunch",
        description: "Room-wise lunch served in the dining area.",
    },
    {
        date: "October 10, 2026",
        time: "2:30 – 5:00 PM",
        title: "Session 2",
        description: "Build continues. Jury visits classrooms for a 3-min progress check.",
    },
    {
        date: "October 10, 2026",
        time: "5:00 – 8:00 PM",
        title: "Networking, Mentoring & Evaluation",
        description: "Remaining teams evaluated. Mentor help for stuck teams. Networking activities (Human Connect, Treasure Hunt, Sticker & Mentor touchpoints).",
    },
    {
        date: "October 10, 2026",
        time: "8:00 – 9:00 PM",
        title: "Dinner",
        description: "Dinner served in the dining area for food token holders.",
    },
    {
        date: "October 10, 2026",
        time: "9:00 – 11:00 PM",
        title: "Session 3",
        description: "Build continues into the night.",
    },
    {
        date: "October 10, 2026",
        time: "11:00 PM – 1:00 AM",
        title: "Late-Night Activities",
        description: "Jamming session, music, and midnight snacks in the open area.",
    },
    {
        date: "October 11, 2026",
        time: "1:00 – 7:00 AM",
        title: "Session 4 (Overnight)",
        description: "Overnight build session. Snack/tea break around 3:00 AM.",
    },
    {
        date: "October 11, 2026",
        time: "7:00 – 8:00 AM",
        title: "Freshen Up & Shortlist",
        description: "Restrooms open. Finalist shortlist announced by 7:30 AM.",
    },
    {
        date: "October 11, 2026",
        time: "8:00 – 9:00 AM",
        title: "Breakfast & Submission Deadline",
        description: "Breakfast served. Submissions close at exactly 8:30 AM sharp.",
    },
    {
        date: "October 11, 2026",
        time: "9:00 – 11:00 AM",
        title: "Evaluation Round 2 (Finals)",
        description: "Shortlisted teams demo to jury in the seminar hall (4-min demo + 2-min Q&A per team).",
    },
    {
        date: "October 11, 2026",
        time: "11:00 AM – 1:00 PM",
        title: "Closing Ceremony",
        description: "Chief guest address, top 10 results, ₹50,000 prize distribution, internship announcements, and vote of thanks.",
    },
    {
        date: "October 11, 2026",
        time: "1:00 PM onward",
        title: "Wrap-Up & Departure",
        description: "Certificates, feedback forms, group photo, collect lunch packets, and departure.",
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start">
                        {Object.entries(
                            timeline.reduce((acc, event) => {
                                if (!acc[event.date]) acc[event.date] = [];
                                acc[event.date].push(event);
                                return acc;
                            }, {} as Record<string, typeof timeline>)
                        ).map(([date, events], index) => (
                            <div key={date}>
                                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-800 sm:text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">Day {index + 1}</span>
                                    <span className="text-teal-700">{date}</span>
                                </h3>
                                <ol className="relative ml-2 space-y-4 border-l-2 border-slate-100 pl-5 sm:ml-3 sm:space-y-6 sm:pl-8">
                                    {events.map((event) => (
                                        <li key={`${event.date}-${event.title}`} className="relative min-w-0">
                                            <span
                                                aria-hidden="true"
                                                className="absolute -left-[27px] top-[18px] h-3 w-3 rounded-full border-2 border-white bg-teal-600 shadow-[0_0_0_2px_rgba(20,184,166,0.18)] sm:-left-[39px] sm:top-[22px] sm:h-3.5 sm:w-3.5"
                                            />
                                            <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-5">
                                                <div className="flex flex-col gap-1.5 text-xs font-semibold leading-5 text-teal-700 min-[380px]:flex-row min-[380px]:flex-wrap min-[380px]:gap-x-4 sm:text-sm">
                                                    <span className="inline-flex min-w-0 items-center gap-1.5"><Clock3 size={14} className="shrink-0" /><span>{event.time}</span></span>
                                                </div>
                                                <h4 className="mt-2.5 break-words text-sm font-bold leading-snug text-slate-900 sm:mt-3 sm:text-base">{event.title}</h4>
                                                <p className="mt-1 break-words text-xs leading-relaxed text-slate-600 sm:text-sm">{event.description}</p>
                                            </article>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        ))}
                    </div>

                    <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 sm:mt-8 sm:p-4 sm:text-sm">
                        <MapPin size={16} className="mt-0.5 shrink-0" />
                        Check your event pass or contact the organizers for your assigned venue and room.
                    </p>
                </section>
            </div>
        </DashboardLayout>
    );
}
