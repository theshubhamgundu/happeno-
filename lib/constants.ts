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

export const TRACKS = [
    "SaaSsum AI (IT & AI)",
    "Maceco (Analytics)",
    "Tobofu (Marketing)",
    "Promtal (HR Tech)",
    "Skill Tank (EdTech)",
    "Vriddhi (FinTech)",
    "Open Innovation"
];

export const PROBLEM_STATEMENTS: Record<string, string[]> = {
    "SaaSsum AI (IT & AI)": [
        "Build an AI-driven automated ticketing system.",
        "Develop a predictive maintenance model for IT infrastructure.",
        "Create an intelligent code review assistant."
    ],
    "Maceco (Analytics)": [
        "Design a real-time sales dashboard with anomaly detection.",
        "Build a customer churn prediction model.",
        "Develop an automated data cleaning and pre-processing pipeline."
    ],
    "Tobofu (Marketing)": [
        "Create an AI tool for generating personalized ad copy.",
        "Build a social media sentiment analysis dashboard.",
        "Develop a customer segmentation model based on browsing behavior."
    ],
    "Promtal (HR Tech)": [
        "Build an automated resume screening tool.",
        "Create an employee engagement prediction model.",
        "Develop an AI-driven interview scheduling assistant."
    ],
    "Skill Tank (EdTech)": [
        "Build a personalized learning path generator.",
        "Create an automated student essay grading tool.",
        "Develop a virtual AI tutor for technical subjects."
    ],
    "Vriddhi (FinTech)": [
        "Design a fraud detection system for online transactions.",
        "Build a personal finance assistant for budgeting.",
        "Create a predictive model for stock market trends."
    ],
    "Open Innovation": [
        "Propose and solve any problem statement of your choice.",
        "Build a tool that improves local community engagement.",
        "Create a sustainability-focused tech solution."
    ]
};
