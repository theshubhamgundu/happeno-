"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { STATIC_ROUNDS_CONFIG } from "@/lib/constants";
import { DEMO_JUDGE, DEMO_PROJECT, DEMO_VOLUNTEER, isDemoSession } from "@/lib/demo-data";

interface EmergencyContact {
    name: string;
    phone: string;
}

interface WifiDetails {
    ssid: string;
    pass: string;
}

interface WifiNetwork {
    id: string;
    ssid: string;
    pass: string;
}

interface Room {
    id: string;
    name: string;
    capacity: string;
}

interface Judge {
    id: string;
    generatedId: string;
    password: string;
    name: string;
    specialization: string;
}

interface Volunteer {
    id: string;
    generatedId: string;
    password: string;
    name: string;
    phone: string;
    role: string;
}

interface HackathonContextType {
    hackathonStartDate: string;
    updateHackathonStartDate: (date: string) => void;
    emergencyContact: EmergencyContact;
    updateEmergencyContact: (details: EmergencyContact) => void;
    wifiDetails: WifiDetails;
    updateWifiDetails: (details: WifiDetails) => void;
    wifiNetworks: WifiNetwork[];
    addWifiNetwork: (network: { ssid: string, pass: string }) => void;
    removeWifiNetwork: (id: string) => void;
    rooms: Room[];
    addRoom: (room: { name: string, capacity: string }) => void;
    removeRoom: (id: string) => void;
    releasedRounds: string[];
    toggleRoundRelease: (round: string) => void;
    isSubmissionLocked: boolean;
    toggleSubmissionLock: () => void;
    isRoundLockEnabled: boolean;
    toggleRoundLock: () => void;
    isCertificatesEnabled: boolean;
    toggleCertificatesEnabled: () => void;
    roundConfigs: typeof STATIC_ROUNDS_CONFIG;
    updateRoundTime: (roundId: string, hour: number, minute: number, dayOffset: number) => void;
    projects: Project[];
    isLoading: boolean;
    updateProjectScore: (projectId: any, roundId: string, judgeId: string, score: number, comment?: string, detailedScores?: Record<string, number>) => void;
    updateTeamLogistics: (projectId: any, data: { room?: string, volunteer_name?: string, volunteer_phone?: string, roomWifiSSID?: string, roomWifiPass?: string, assigned_judge?: string, assigned_judge_2?: string }) => void;
    checkInTeam: (projectId: any) => void;
    registerTeam: (teamData: Omit<Project, 'id' | 'roundScores'>) => void;
    judges: Judge[];
    addJudge: (judge: { name: string, specialization: string }) => void;
    removeJudge: (id: string) => void;
    volunteers: Volunteer[];
    addVolunteer: (volunteer: { name: string, phone: string, role: string }) => void;
    removeVolunteer: (id: string) => void;
}

export interface Member {
    fullName: string;
    email?: string;
    phone?: string;
    college?: string;
    year?: string;
    department?: string;
}

export interface Project {
    id: any;
    teamId?: string;
    transactionId?: string; // Manual Transaction ID
    status?: string; // PENDING or COMPLETED
    password?: string;
    name: string;
    team: string;
    track: string;
    trackPreferences?: string[];
    problemStatement: string;
    proposedIdea?: string;
    techStack?: Record<string, string[]>;
    isPSLocked?: boolean;
    isPILocked?: boolean;
    isTSLocked?: boolean;
    members: (string | Member)[];
    captain: string;
    captainMobile: string;
    college: string;
    roundScores: Record<string, Record<string, number | null>>; // roundId -> judgeId -> score
    roundDetailedScores?: Record<string, Record<string, Record<string, number>>>; // roundId -> judgeId -> criterionId -> score
    roundComments?: Record<string, Record<string, string | null>>; // roundId -> judgeId -> comment
    isCheckedIn?: boolean;
    room?: string;
    roomWifiSSID?: string;
    roomWifiPass?: string;
    coordinator?: {
        name: string;
        phone: string;
        assigned_judge?: string;
        assigned_judge_2?: string;
    };
    submission?: {
        github: string;
        presentation: string;
        demo: string;
        deployment: string;
        isFinal: boolean;
    };
}

const PROJECTS: Project[] = [];

const HackathonContext = createContext<HackathonContextType | undefined>(undefined);

export const HackathonProvider = ({ children }: { children: ReactNode }) => {
    // Default to a date in the future
    // Default constants removed to ensure DB is the only source
    const [hackathonStartDate, setHackathonStartDate] = useState("2026-02-27");

    // Default Emergency Contact
    const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
        name: "Loading...",
        phone: "..."
    });

    // Default WiFi Details
    const [wifiDetails, setWifiDetails] = useState<WifiDetails>({
        ssid: "Loading...",
        pass: "..."
    });

    // WiFi Networks List
    const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);

    // Rooms List
    const [rooms, setRooms] = useState<Room[]>([]);

    // Default Released Rounds
    const [releasedRounds, setReleasedRounds] = useState<string[]>([]);

    // Submission Lock
    const [isSubmissionLocked, setIsSubmissionLocked] = useState(false);

    // Round Lock (Time Based)
    const [isRoundLockEnabled, setIsRoundLockEnabled] = useState(true);

    // Certificates Enabled
    const [isCertificatesEnabled, setIsCertificatesEnabled] = useState(false);

    // Dynamic Round Configs
    const [roundConfigs, setRoundConfigs] = useState(STATIC_ROUNDS_CONFIG);

    // Projects Global State - Start empty and sync from server/local
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Judges and Volunteers state
    const [judges, setJudges] = useState<Judge[]>([]);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const { user } = useAuth();

    const mountedRef = React.useRef(true);

    // Load from LocalStorage on mount + Sync from Server
    useEffect(() => {
        mountedRef.current = true;
        // 1. Fetch Global Settings from DB
        const fetchSettings = async (isBackground = false) => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok && mountedRef.current) {
                    const dbSettings = await response.json();
                    if (dbSettings.start_date) setHackathonStartDate(dbSettings.start_date);
                    if (dbSettings.wifi_details) setWifiDetails(dbSettings.wifi_details);
                    if (dbSettings.wifi_networks) setWifiNetworks(dbSettings.wifi_networks);
                    if (dbSettings.rooms) setRooms(dbSettings.rooms);
                    if (dbSettings.emergency_contact) setEmergencyContact(dbSettings.emergency_contact);
                    if (dbSettings.is_submission_locked !== undefined) setIsSubmissionLocked(dbSettings.is_submission_locked);
                    if (dbSettings.is_round_lock_enabled !== undefined) setIsRoundLockEnabled(dbSettings.is_round_lock_enabled);
                    if (dbSettings.is_certificates_enabled !== undefined) setIsCertificatesEnabled(dbSettings.is_certificates_enabled);
                    if (dbSettings.released_rounds) setReleasedRounds(dbSettings.released_rounds);
                    if (dbSettings.round_configs) {
                        // Merge static criteria with dynamic times
                        const merged = STATIC_ROUNDS_CONFIG.map(staticRound => {
                            const dynamic = dbSettings.round_configs.find((d: any) => d.id === staticRound.id);
                            if (dynamic) {
                                return { ...staticRound, hour: dynamic.hour, minute: dynamic.minute, dayOffset: dynamic.dayOffset };
                            }
                            return staticRound;
                        });
                        setRoundConfigs(merged);
                    }
                }
            } catch (err) {
                if (!isBackground) console.error("Failed to fetch settings:", err);
            }
        };

        // 2. Sync projects strictly from server
        // OPTIMIZATION: If user is a team, only fetch THEIR team data to save Supabase resources
        const fetchServerTeams = async (isBackground = false) => {
            // Demo sessions must never depend on the registrations table. This
            // keeps the dashboards usable when development credentials are absent.
            if (isDemoSession(user)) {
                if (mountedRef.current) setProjects([DEMO_PROJECT]);
                return;
            }

            try {
                let url = '/api/teams';
                if (user?.role === 'team' && user?.teamId) {
                    url += `?teamId=${user.teamId}`;
                }

                const response = await fetch(url);
                if (response.ok && mountedRef.current) {
                    const serverTeams = await response.json();

                    // If we are a team, we might want to merge with existing if it's a partial update,
                    // but for now, replacing is fine since the state is scoped.
                    setProjects(serverTeams || []);
                }
            } catch (err) {
                if (!isBackground) console.error("Failed to sync teams from server:", err);
                if (isDemoSession(user) && mountedRef.current) setProjects([DEMO_PROJECT]);
            }
        };

        const initFetch = async () => {
            await Promise.all([fetchSettings(), fetchServerTeams()]);

            // Load judges and volunteers from API
            try {
                let currentJudges: any[] = [];
                let currentVolunteers: any[] = [];

                // 1. Fetch from Server
                const [judgesRes, volunteersRes] = await Promise.all([
                    fetch('/api/judges'),
                    fetch('/api/volunteers')
                ]);

                if (judgesRes.ok) currentJudges = await judgesRes.json();
                if (volunteersRes.ok) currentVolunteers = await volunteersRes.json();

                // 2. Migration: If server empty but local valid, push local to server
                const localJudgesStr = localStorage.getItem('hackathon_judges');
                if (Array.isArray(currentJudges) && currentJudges.length === 0 && localJudgesStr) {
                    const localJudges = JSON.parse(localJudgesStr);
                    if (Array.isArray(localJudges) && localJudges.length > 0) {
                        console.log("Migrating local judges to server...");
                        for (const j of localJudges) {
                            try {
                                await fetch('/api/judges', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        name: j.name,
                                        specialization: j.specialization,
                                        generated_id: j.generatedId || j.generated_id,
                                        password: j.password
                                    })
                                });
                            } catch (e) { console.error("Migration failed for judge", j, e); }
                        }
                        const r = await fetch('/api/judges');
                        if (r.ok) currentJudges = await r.json();
                    }
                }

                const localVolsStr = localStorage.getItem('hackathon_volunteers');
                if (Array.isArray(currentVolunteers) && currentVolunteers.length === 0 && localVolsStr) {
                    const localVols = JSON.parse(localVolsStr);
                    if (Array.isArray(localVols) && localVols.length > 0) {
                        console.log("Migrating local volunteers to server...");
                        for (const v of localVols) {
                            try {
                                await fetch('/api/volunteers', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        name: v.name,
                                        phone: v.phone,
                                        role: v.role,
                                        generated_id: v.generatedId || v.generated_id,
                                        password: v.password
                                    })
                                });
                            } catch (e) { console.error("Migration failed for vol", v, e); }
                        }
                        const r = await fetch('/api/volunteers');
                        if (r.ok) currentVolunteers = await r.json();
                    }
                }

                // 3. Normalize Data (Map snake_case DB fields to camelCase State)
                const normalize = (list: any[]) => list.map(item => ({
                    ...item,
                    generatedId: item.generated_id || item.generatedId,
                    id: item.id?.toString()
                }));

                if (Array.isArray(currentJudges)) {
                    const normalizedJudges = normalize(currentJudges);
                    setJudges(isDemoSession(user) ? [DEMO_JUDGE, ...normalizedJudges] : normalizedJudges);
                }
                if (Array.isArray(currentVolunteers)) {
                    const normalizedVolunteers = normalize(currentVolunteers);
                    setVolunteers(isDemoSession(user) ? [DEMO_VOLUNTEER, ...normalizedVolunteers] : normalizedVolunteers);
                }

            } catch (error) {
                console.error("Failed to fetch judges/volunteers:", error);

                // Fallback to local storage if API completely fails
                const savedJudges = localStorage.getItem('hackathon_judges');
                if (savedJudges) setJudges(JSON.parse(savedJudges));
                const savedVolunteers = localStorage.getItem('hackathon_volunteers');
                if (savedVolunteers) setVolunteers(JSON.parse(savedVolunteers));
                if (isDemoSession(user)) {
                    setJudges([DEMO_JUDGE]);
                    setVolunteers([DEMO_VOLUNTEER]);
                }
            }

            const savedWifiNetworks = localStorage.getItem('hackathon_wifi_networks');
            if (savedWifiNetworks && wifiNetworks.length === 0) setWifiNetworks(JSON.parse(savedWifiNetworks));
            const savedRooms = localStorage.getItem('hackathon_rooms');
            if (savedRooms && rooms.length === 0) setRooms(JSON.parse(savedRooms));

            setIsLoading(false);
        };
        initFetch();

        // Dynamic polling interval based on user role
        // Admins/Judges need faster updates (60s), Teams/Guests can be slower (3 minutes) to reduce DB load
        const pollingInterval = user?.role === 'admin' || user?.role === 'judge' ? 60000 : 180000;

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible' && mountedRef.current) {
                fetchSettings(true);
                fetchServerTeams(true);
            }
        }, pollingInterval);

        return () => {
            mountedRef.current = false;
            clearInterval(interval);
        };
    }, [user]);

    const updateHackathonStartDate = async (date: string) => {
        setHackathonStartDate(date);
        await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ key: 'start_date', value: date })
        });
    };

    const updateEmergencyContact = async (details: EmergencyContact) => {
        setEmergencyContact(details);
        await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ key: 'emergency_contact', value: details })
        });
    };

    const updateWifiDetails = async (details: WifiDetails) => {
        setWifiDetails(details);
        await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ key: 'wifi_details', value: details })
        });
    };

    const addWifiNetwork = async (network: { ssid: string, pass: string }) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNetwork = { ...network, id };
        const updated = [...wifiNetworks, newNetwork];
        setWifiNetworks(updated);

        // Save to LocalStorage
        localStorage.setItem('hackathon_wifi_networks', JSON.stringify(updated));

        // Save to DB
        // Fetch current settings first to append or just overwrite if structure is simple
        // Here we just overwrite the 'wifi_networks' key
        await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ key: 'wifi_networks', value: updated })
        });
        toast.success(`WiFi Network Added: ${network.ssid}`);
    };

    const removeWifiNetwork = async (id: string) => {
        const updated = wifiNetworks.filter(n => n.id !== id);
        setWifiNetworks(updated);

        // Save to LocalStorage
        localStorage.setItem('hackathon_wifi_networks', JSON.stringify(updated));

        // Save to DB
        await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ key: 'wifi_networks', value: updated })
        });
        toast.success("WiFi Network Removed");
    };

    const addRoom = async (room: { name: string, capacity: string }) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newRoom = { ...room, id };
        const updated = [...rooms, newRoom];
        setRooms(updated);

        // Save to LocalStorage
        localStorage.setItem('hackathon_rooms', JSON.stringify(updated));

        // Save to DB
        await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ key: 'rooms', value: updated })
        });
        toast.success(`Room Added: ${room.name}`);
    };

    const removeRoom = async (id: string) => {
        const updated = rooms.filter(r => r.id !== id);
        setRooms(updated);

        // Save to LocalStorage
        localStorage.setItem('hackathon_rooms', JSON.stringify(updated));

        // Save to DB
        await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ key: 'rooms', value: updated })
        });
        toast.success("Room Removed");
    };

    const toggleRoundRelease = async (round: string) => {
        let newRounds;
        if (releasedRounds.includes(round)) {
            newRounds = releasedRounds.filter(r => r !== round);
        } else {
            newRounds = [...releasedRounds, round];
        }
        setReleasedRounds(newRounds);
        await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ key: 'released_rounds', value: newRounds })
        });
    };

    const toggleSubmissionLock = async () => {
        const newLockState = !isSubmissionLocked;
        setIsSubmissionLocked(newLockState);
        await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ key: 'is_submission_locked', value: newLockState })
        });
    };

    const toggleCertificatesEnabled = async () => {
        const newState = !isCertificatesEnabled;
        setIsCertificatesEnabled(newState);
        await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ key: 'is_certificates_enabled', value: newState })
        });
    };

    const updateProjectScore = async (projectId: any, roundId: string, judgeId: string, score: number, comment?: string, detailedScores?: Record<string, number>) => {
        let newScores: any = {};
        let newComments: any = {};
        let newDetailed: any = {};
        const updatedProjects = projects.map(p => {
            if (p.id === projectId) {
                // Initialize if they don't exist
                const currentRoundScores = p.roundScores?.[roundId] || {};
                const currentRoundComments = p.roundComments?.[roundId] || {};
                const currentRoundDetailed = p.roundDetailedScores?.[roundId] || {};

                newScores = {
                    ...(p.roundScores || {}),
                    [roundId]: {
                        ...currentRoundScores,
                        [judgeId]: score
                    }
                };
                newComments = {
                    ...(p.roundComments || {}),
                    [roundId]: {
                        ...currentRoundComments,
                        [judgeId]: comment || ""
                    }
                };
                newDetailed = {
                    ...(p.roundDetailedScores || {}),
                    [roundId]: {
                        ...currentRoundDetailed,
                        [judgeId]: detailedScores || {}
                    }
                };
                return { ...p, roundScores: newScores, roundComments: newComments, roundDetailedScores: newDetailed };
            }
            return p;
        });
        setProjects(updatedProjects);

        // Sync to DB
        try {
            await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: projectId,
                    roundScores: newScores,
                    roundComments: newComments,
                    roundDetailedScores: newDetailed
                })
            });
        } catch (err) {
            console.error("Failed to sync score to DB:", err);
        }
    };

    const toggleRoundLock = async () => {
        const newValue = !isRoundLockEnabled;
        setIsRoundLockEnabled(newValue);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'is_round_lock_enabled', value: newValue })
            });
            toast.success(`Round time-locking ${newValue ? 'enabled' : 'disabled'}`);
        } catch (err) {
            console.error("Failed to update round lock:", err);
            setIsRoundLockEnabled(!newValue);
        }
    };

    const updateRoundTime = async (roundId: string, hour: number, minute: number, dayOffset: number) => {
        const updated = roundConfigs.map(r =>
            r.id === roundId ? { ...r, hour, minute, dayOffset } : r
        );
        setRoundConfigs(updated);

        try {
            // Save only IDs and times to settings to keep it clean
            const configToSave = updated.map(r => ({
                id: r.id,
                hour: r.hour,
                minute: r.minute,
                dayOffset: r.dayOffset
            }));

            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'round_configs', value: configToSave })
            });
            toast.success("Round time updated");
        } catch (err) {
            console.error("Failed to update round time:", err);
            toast.error("Cloud sync failed");
        }
    };

    const updateTeamLogistics = async (projectId: any, data: { room?: string, volunteer_name?: string, volunteer_phone?: string, roomWifiSSID?: string, roomWifiPass?: string, assigned_judge?: string, assigned_judge_2?: string }) => {
        setProjects(prev => prev.map(p => p.id === projectId ? {
            ...p,
            room: data.room ?? p.room,
            roomWifiSSID: data.roomWifiSSID ?? p.roomWifiSSID,
            roomWifiPass: data.roomWifiPass ?? p.roomWifiPass,
            coordinator: {
                name: data.volunteer_name ?? p.coordinator?.name ?? "",
                phone: data.volunteer_phone ?? p.coordinator?.phone ?? "",
                assigned_judge: data.assigned_judge ?? p.coordinator?.assigned_judge ?? "",
                assigned_judge_2: data.assigned_judge_2 ?? p.coordinator?.assigned_judge_2 ?? ""
            }
        } : p));

        try {
            const response = await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectId, ...data })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to update logistics:", errorData);
                throw new Error(errorData.error || 'Failed to update');
            }
            toast.success("Logistics updated!");
        } catch (err: any) {
            console.error("Failed to update logistics:", err);
            toast.error(`Sync failed: ${err.message}`);
        }
    };

    const checkInTeam = async (projectId: any) => {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, isCheckedIn: true } : p));
        try {
            await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectId, isCheckedIn: true })
            });
            toast.success("Team Checked In!");
        } catch (err) {
            console.error(err);
            toast.error("Check-in sync failed");
        }
    };

    const addJudge = async (judgeData: { name: string, specialization: string }) => {
        const id = Math.random().toString(36).substr(2, 9);
        const nextNumber = 101 + judges.length;
        const generatedId = `VHJ-${nextNumber}`;
        const password = `${nextNumber}@tricity`;

        const newJudge: Judge = {
            ...judgeData,
            id,
            generatedId,
            password
        };

        // Optimistic update
        const updated = [...judges, newJudge];
        setJudges(updated);
        localStorage.setItem('hackathon_judges', JSON.stringify(updated));

        try {
            await fetch('/api/judges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: judgeData.name,
                    specialization: judgeData.specialization,
                    generated_id: generatedId,
                    password: password
                })
            });
            toast.success(`Judge added. ID: ${generatedId}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to save judge to server");
        }
    };

    const removeJudge = async (id: string) => {
        // Optimistic
        const updated = judges.filter(j => j.id !== id);
        setJudges(updated);
        localStorage.setItem('hackathon_judges', JSON.stringify(updated));

        try {
            const judge = judges.find(j => j.id === id);
            // Try deleting by generatedId if available (for server logic), otherwise use id
            const deleteId = judge?.generatedId || id;

            await fetch(`/api/judges?id=${deleteId}`, { method: 'DELETE' });
            toast.success("Judge removed");
        } catch (err) {
            console.error(err);
            toast.error("Failed to remove judge from server");
        }
    };

    const addVolunteer = async (volunteerData: { name: string, phone: string, role: string }) => {
        const id = Math.random().toString(36).substr(2, 9);
        const nextNumber = 101 + volunteers.length;
        const generatedId = `VHV-${nextNumber}`;
        const password = `${nextNumber}@tricity`;

        const newVol: Volunteer = {
            ...volunteerData,
            id,
            generatedId,
            password
        };

        const updated = [...volunteers, newVol];
        setVolunteers(updated);
        localStorage.setItem('hackathon_volunteers', JSON.stringify(updated));

        try {
            await fetch('/api/volunteers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: volunteerData.name,
                    phone: volunteerData.phone,
                    role: volunteerData.role,
                    generated_id: generatedId,
                    password: password
                })
            });
            toast.success(`Volunteer added. ID: ${generatedId}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to save volunteer to server");
        }
    };

    const removeVolunteer = async (id: string) => {
        const updated = volunteers.filter(v => v.id !== id);
        setVolunteers(updated);
        localStorage.setItem('hackathon_volunteers', JSON.stringify(updated));

        try {
            const vol = volunteers.find(v => v.id === id);
            const deleteId = vol?.generatedId || id;

            await fetch(`/api/volunteers?id=${deleteId}`, { method: 'DELETE' });
            toast.success("Volunteer removed");
        } catch (err) {
            console.error(err);
            toast.error("Failed to remove volunteer from server");
        }
    };

    const registerTeam = (teamData: Omit<Project, 'id' | 'roundScores'>) => {
        const newTeam: Project = {
            ...teamData,
            id: projects.length + 1,
            roundScores: {}
        };
        const updatedProjects = [...projects, newTeam];
        setProjects(updatedProjects);
    };

    return (
        <HackathonContext.Provider
            value={{
                hackathonStartDate,
                updateHackathonStartDate,
                emergencyContact,
                updateEmergencyContact,
                wifiDetails,
                updateWifiDetails,
                wifiNetworks,
                addWifiNetwork,
                removeWifiNetwork,
                rooms,
                addRoom,
                removeRoom,
                releasedRounds,
                toggleRoundRelease,
                isSubmissionLocked,
                toggleSubmissionLock,
                isRoundLockEnabled,
                toggleRoundLock,
                isCertificatesEnabled,
                toggleCertificatesEnabled,
                projects,
                isLoading,
                updateProjectScore,
                updateTeamLogistics,
                checkInTeam,
                registerTeam,
                judges,
                addJudge,
                removeJudge,
                volunteers,
                addVolunteer,
                removeVolunteer,
                roundConfigs,
                updateRoundTime
            }}
        >
            {children}
        </HackathonContext.Provider>
    );
};

export const useHackathon = () => {
    const context = useContext(HackathonContext);
    if (context === undefined) {
        throw new Error("useHackathon must be used within a HackathonProvider");
    }
    return context;
};
