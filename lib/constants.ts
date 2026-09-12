export const STATIC_ROUNDS_CONFIG = [
    {
        id: "round1",
        title: "Round-1",
        subtitle: "Problem Analysis & Solution feasibility",
        color: "text-blue-400",
        bg: "bg-blue-500",
        dayOffset: 0,
        hour: 14,
        minute: 30,
        criteria: [
            { id: "r1q1", label: "Problem Understanding", desc: "Clarity in defining the problem and understanding its root cause." },
            { id: "r1q2", label: "Solution Feasibility", desc: "Solutions for problem is appropriate or not." },
            { id: "r1q3", label: "Societal Relevance & Impact", desc: "Addresses a real societal / public issue." },
            { id: "r1q5", label: "Feasibility in 24 Hours", desc: "Can a working prototype be built within the hackathon time" },
            { id: "r1q6", label: "Team Contribution & Presentation", desc: "Team Members Contribution and Presentation" },
        ]
    },
    {
        id: "round2",
        title: "Round-2",
        subtitle: "Technical Design - Detailed",
        color: "text-pink-400",
        bg: "bg-pink-500",
        dayOffset: 0,
        hour: 21,
        minute: 30,
        criteria: [
            { id: "r2q1", label: "Model Design", desc: "Detailed architecture including data flow/control flow, and module interaction" },
            { id: "r2q3", label: "Methodology", desc: "Detailed implementation steps" },
            { id: "r2q4", label: "Team Contribution & Presentation", desc: "Team Members Contribution and Presentation" },
        ]
    },
];
