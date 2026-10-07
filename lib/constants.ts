export const STATIC_ROUNDS_CONFIG = [
    {
        id: "round1",
        title: "Round-1",
        subtitle: "Problem Analysis & Solution feasibility",
        color: "text-teal-600",
        bg: "bg-teal-600",
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

export const TRACKS = [
    "SaaSsum AI (IT & AI)",
    "Maceco (Analytics)",
    "Tobofu (Marketing)",
    "Promtal (HR Tech)",
    "Skill Tank (EdTech)",
    "Vriddhi (FinTech)",
    "Open Innovation"
];

export const MAX_TEAM_MEMBERS = 4;
export const MAX_PROPOSED_IDEA_CHARACTERS = 500;

export const PROBLEM_STATEMENTS: Record<string, string[]> = {
    // SaaSsum AI / SaaSum AI (IT & AI)
    "SaaSsum AI (IT & AI)": [
        "Build an AI-driven automated ticketing system.",
        "Develop a predictive maintenance model for IT infrastructure.",
        "Create an intelligent code review assistant."
    ],
    "SaaSum AI (IT & AI)": [
        "Build an AI-driven automated ticketing system.",
        "Develop a predictive maintenance model for IT infrastructure.",
        "Create an intelligent code review assistant."
    ],
    "SaaSsum AI": [
        "Build an AI-driven automated ticketing system.",
        "Develop a predictive maintenance model for IT infrastructure.",
        "Create an intelligent code review assistant."
    ],
    "SaaSum AI": [
        "Build an AI-driven automated ticketing system.",
        "Develop a predictive maintenance model for IT infrastructure.",
        "Create an intelligent code review assistant."
    ],

    // Maceco (Analytics)
    "Maceco (Analytics)": [
        "Design a real-time sales dashboard with anomaly detection.",
        "Build a customer churn prediction model.",
        "Develop an automated data cleaning and pre-processing pipeline."
    ],
    "Maceco": [
        "Design a real-time sales dashboard with anomaly detection.",
        "Build a customer churn prediction model.",
        "Develop an automated data cleaning and pre-processing pipeline."
    ],

    // Tobofu (Marketing)
    "Tobofu (Marketing)": [
        "Create an AI tool for generating personalized ad copy.",
        "Build a social media sentiment analysis dashboard.",
        "Develop a customer segmentation model based on browsing behavior."
    ],
    "Tobofu": [
        "Create an AI tool for generating personalized ad copy.",
        "Build a social media sentiment analysis dashboard.",
        "Develop a customer segmentation model based on browsing behavior."
    ],

    // Promtal (HR Tech)
    "Promtal (HR Tech)": [
        "Build an automated resume screening tool.",
        "Create an employee engagement prediction model.",
        "Develop an AI-driven interview scheduling assistant."
    ],
    "Promtal": [
        "Build an automated resume screening tool.",
        "Create an employee engagement prediction model.",
        "Develop an AI-driven interview scheduling assistant."
    ],

    // Skill Tank (EdTech)
    "Skill Tank (EdTech)": [
        "Build a personalized learning path generator.",
        "Create an automated student essay grading tool.",
        "Develop a virtual AI tutor for technical subjects."
    ],
    "Skill Tank": [
        "Build a personalized learning path generator.",
        "Create an automated student essay grading tool.",
        "Develop a virtual AI tutor for technical subjects."
    ],

    // Vriddhi (FinTech)
    "Vriddhi (FinTech)": [
        "Design a fraud detection system for online transactions.",
        "Build a personal finance assistant for budgeting.",
        "Create a predictive model for stock market trends."
    ],
    "Vriddhi": [
        "Design a fraud detection system for online transactions.",
        "Build a personal finance assistant for budgeting.",
        "Create a predictive model for stock market trends."
    ],

    // Open Innovation
    "Open Innovation": [
        "Propose and solve any problem statement of your choice.",
        "Build a tool that improves local community engagement.",
        "Create a sustainability-focused tech solution."
    ],
    "Open Innovation (Any Domain)": [
        "Propose and solve any problem statement of your choice.",
        "Build a tool that improves local community engagement.",
        "Create a sustainability-focused tech solution."
    ]
};

export function getProblemStatementsForTrack(track?: string | null): string[] {
    if (!track) return [];

    // 1. Direct match
    if (PROBLEM_STATEMENTS[track] && PROBLEM_STATEMENTS[track].length > 0) {
        return PROBLEM_STATEMENTS[track];
    }

    // 2. Normalized alphanumeric match
    const normalize = (val: string) => val.toLowerCase().replace(/\s*\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');
    const cleanTrack = normalize(track);

    for (const [key, statements] of Object.entries(PROBLEM_STATEMENTS)) {
        if (normalize(key) === cleanTrack && statements.length > 0) {
            return statements;
        }
    }

    // 3. Substring inclusion match
    for (const [key, statements] of Object.entries(PROBLEM_STATEMENTS)) {
        const cleanKey = normalize(key);
        if (cleanTrack && (cleanKey.includes(cleanTrack) || cleanTrack.includes(cleanKey)) && statements.length > 0) {
            return statements;
        }
    }

    // 4. Fallback to Open Innovation
    return PROBLEM_STATEMENTS["Open Innovation"] || [];
}
