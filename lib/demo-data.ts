import type { Project } from "@/context/HackathonContext";

export const DEMO_TEAM_ID = "DEMO-TRICITY-01";
export const DEMO_JUDGE_ID = "DEMO-JUDGE-01";
export const DEMO_VOLUNTEER_ID = "DEMO-VOL-01";

export const DEMO_PROJECT: Project = {
    id: "demo-tricity-project",
    teamId: DEMO_TEAM_ID,
    transactionId: "DEMO-2026-001",
    status: "COMPLETED",
    password: "demo-participant",
    name: "Civic Pulse",
    team: "Team Nova",
    track: "",
    trackPreferences: ["SaaSsum AI (IT & AI)", "Skill Tank (EdTech)", "Open Innovation"],
    problemStatement: "",
    members: [
        { fullName: "Aarav Sharma", phone: "+91 98765 43210", department: "CSE" },
        { fullName: "Diya Reddy", phone: "+91 98765 43211", department: "AI & DS" },
        { fullName: "Rohan Kumar", phone: "+91 98765 43212", department: "IT" },
    ],
    captain: "Aarav Sharma",
    captainMobile: "+91 98765 43210",
    college: "Tricity Institute of Technology",
    room: "Innovation Lab 02",
    roomWifiSSID: "TRICITY-DEMO",
    roomWifiPass: "Welcome@2026",
    coordinator: { name: "Priya Nair", phone: "+91 98765 43213" },
    roundScores: {},
    submission: {
        github: "https://github.com/tricity-demo/civic-pulse",
        presentation: "https://example.com/civic-pulse-pitch",
        demo: "https://example.com/civic-pulse-demo",
        deployment: "https://example.com/civic-pulse",
        isFinal: true,
    },
};

export const DEMO_JUDGE = {
    id: DEMO_JUDGE_ID,
    generatedId: DEMO_JUDGE_ID,
    password: "demo-judge",
    name: "Dr. Ananya Rao",
    specialization: "AI & Product Innovation",
};

export const DEMO_VOLUNTEER = {
    id: DEMO_VOLUNTEER_ID,
    generatedId: DEMO_VOLUNTEER_ID,
    password: "demo-volunteer",
    name: "Priya Nair",
    phone: "+91 98765 43213",
    role: "Operations Coordinator",
};

export const isDemoSession = (user?: { id?: string; teamId?: string } | null) =>
    user?.id === DEMO_JUDGE_ID ||
    user?.id === DEMO_VOLUNTEER_ID ||
    user?.id === "DEMO-ADMIN-01" ||
    user?.teamId === DEMO_TEAM_ID;
