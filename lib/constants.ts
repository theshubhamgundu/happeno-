export const STATIC_ROUNDS_CONFIG = [
    {
        id: "round1",
        title: "Round-1",
        subtitle: "Idea, Feasibility & Basic Progress",
        color: "text-teal-600",
        bg: "bg-teal-600",
        dayOffset: 0,
        hour: 14,
        minute: 30,
        criteria: [
            { id: "r1q1", label: "Problem Understanding", desc: "Does the team clearly understand the problem they are trying to solve?" },
            { id: "r1q2", label: "Problem Relevance", desc: "Is the problem actually worth solving, or is it trivial?" },
            { id: "r1q3", label: "Solution Clarity", desc: "Is their proposed solution logical and easy to understand?" },
            { id: "r1q4", label: "Target Audience", desc: "Do they have a clear idea of who would actually use their solution?" },
            { id: "r1q5", label: "Feasibility for Beginners", desc: "Is this realistic for a beginner team to build during the hackathon?" },
            { id: "r1q6", label: "Clarity of Scope", desc: "Are they focused on a core feature, or trying to do too many things at once?" },
            { id: "r1q7", label: "Execution Progress", desc: "Have they actually started building something, or is it still just an idea?" },
            { id: "r1q8", label: "Resource Utilization", desc: "Are they using appropriate basic tools and resources for their skill level?" },
            { id: "r1q9", label: "Seriousness & Attitude", desc: "Is the team serious about the hackathon and putting in genuine effort?" },
            { id: "r1q10", label: "Coachability", desc: "Do they listen to feedback and accept advice from mentors/judges?" },
        ]
    },
    {
        id: "round2",
        title: "Round-2",
        subtitle: "Technical Execution & Prototype",
        color: "text-pink-400",
        bg: "bg-pink-500",
        dayOffset: 0,
        hour: 21,
        minute: 30,
        criteria: [
            { id: "r2q1", label: "Core Functionality", desc: "Does the main feature of the prototype actually work without crashing?" },
            { id: "r2q2", label: "Effort & Coding", desc: "Did the team write original code and put in effort, or rely entirely on templates?" },
            { id: "r2q3", label: "Tech Stack Knowledge", desc: "Can the team explain what tools/languages they used and why?" },
            { id: "r2q4", label: "User Interface (UI)", desc: "Is the app/website visually presentable and decent to look at?" },
            { id: "r2q5", label: "User Experience (UX)", desc: "Is the prototype easy to navigate and understand for a normal user?" },
            { id: "r2q6", label: "Creativity & Twist", desc: "Did they add any unique or fun elements to their project?" },
            { id: "r2q7", label: "Overcoming Challenges", desc: "Could they explain the bugs they faced and how they tried to fix them?" },
            { id: "r2q8", label: "Practical Usefulness", desc: "Does this project actually solve the problem in a practical way?" },
            { id: "r2q9", label: "Teamwork & Collaboration", desc: "Did everyone contribute, or was it a one-person show?" },
            { id: "r2q10", label: "Pitch & Presentation", desc: "How confidently and clearly did they demonstrate their project?" },
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
export const MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS = 60;

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

export function isOpenInnovationTrack(track?: string | null): boolean {
    return Boolean(track && track.toLowerCase().replace(/\s*\(.*?\)/g, '').replace(/[^a-z0-9]/g, '') === 'openinnovation');
}
