"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { STATIC_ROUNDS_CONFIG } from "@/lib/constants";
import { MAX_TEAM_MEMBERS } from "@/lib/constants";
import { normalizeJudgingRounds, type JudgingRound } from "@/lib/judging-rounds";

interface EmergencyContact {
    name: string;
    phone: string;
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

export interface MemberMealSlot {
    claimedAt: string | null;
    claimedBy?: string;
}

interface HackathonContextType {
    hackathonStartDate: string;
    updateHackathonStartDate: (date: string) => void;
    emergencyContact: EmergencyContact;
    updateEmergencyContact: (details: EmergencyContact) => void;
    releasedRounds: string[];
    toggleRoundRelease: (round: string) => void;
    isSubmissionLocked: boolean;
    toggleSubmissionLock: () => void;
    isRoundLockEnabled: boolean;
    toggleRoundLock: () => void;
    enabledMeals: string[];
    updateEnabledMeals: (meals: string[]) => Promise<void>;
    roundConfigs: JudgingRound[];
    saveRoundConfigs: (configs: JudgingRound[]) => Promise<boolean>;
    updateRoundTime: (roundId: string, hour: number, minute: number, dayOffset: number) => void;
    projects: Project[];
    isLoading: boolean;
    checkInTeam: (projectId: any) => Promise<boolean>;
    judges: Judge[];
    addJudge: (judge: { name: string, specialization: string }) => void;
    removeJudge: (id: string) => void;
    volunteers: Volunteer[];
    addVolunteer: (volunteer: { name: string, phone: string, role: string }) => void;
    removeVolunteer: (id: string) => void;
    updateMemberDetails: (projectId: any, memberIndex: number, updatedMemberData: Member) => Promise<boolean>;
    removeTeamMember: (projectId: any, memberIndex: number) => Promise<boolean>;
    addTeamMember: (projectId: any, memberData: Member) => Promise<boolean>;
    transferTeamMembers: (projectId: any, selections: { sourceTeamId: string; memberIndex: number }[]) => Promise<boolean>;
    claimMemberMeal: (projectId: any, memberId: string, mealKey: string, volunteerId?: string) => Promise<{ status: 'PERMITTED' | 'ALREADY_CLAIMED' | 'NOT_INCLUDED' | 'ALL_MEALS_CLAIMED' | 'NEEDS_CHECKIN' | 'SAVE_FAILED'; claimedAt?: string; claimedBy?: string; mealName?: string; }>;
    resetMemberMeal: (projectId: any, memberId: string, mealKey: string) => Promise<void>;
    bulkAssignMealPlan: (projectIds: any[], mealKeys: string[], included: boolean) => Promise<void>;
    toggleMealAccess: (projectId: any, mealKey: string, included: boolean) => Promise<void>;
    deleteTeams: (teamIds: string[]) => Promise<boolean>;
    bulkUpdateTeams: (teamIds: string[], updates: { track?: string; room?: string; roomWifiSSID?: string; roomWifiPass?: string; isCheckedIn?: boolean }) => Promise<boolean>;
    refreshTeams: () => Promise<void>;
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
    checkedInAt?: string | null;
    memberMealState?: Record<string, Record<string, MemberMealSlot>>; // memberId -> mealKey -> slot
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

const HackathonContext = createContext<HackathonContextType | undefined>(undefined);

export const HackathonProvider = ({ children }: { children: ReactNode }) => {
    // Default to a date in the future
    // Default constants removed to ensure DB is the only source
    const [hackathonStartDate, setHackathonStartDate] = useState("TBD");

    // Default Emergency Contact
    const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
        name: "Loading...",
        phone: "..."
    });

    // Default Released Rounds
    const [releasedRounds, setReleasedRounds] = useState<string[]>([]);

    // Submission Lock
    const [isSubmissionLocked, setIsSubmissionLocked] = useState(false);

    // Round Lock (Time Based)
    const [isRoundLockEnabled, setIsRoundLockEnabled] = useState(true);

    // Enabled Meals
    const [enabledMeals, setEnabledMeals] = useState<string[]>([]);

    // Dynamic Round Configs
    const [roundConfigs, setRoundConfigs] = useState<JudgingRound[]>(normalizeJudgingRounds(STATIC_ROUNDS_CONFIG));

    // Projects Global State - Start empty and sync from server/local
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Judges and Volunteers state
    const [judges, setJudges] = useState<Judge[]>([]);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const { user } = useAuth();
    const pathname = usePathname();
    const needsHackathonData = pathname.startsWith('/dashboard') ||
        pathname === '/livescore' ||
        pathname === '/registrations-count';

    const mountedRef = React.useRef(true);

    const fetchServerTeams = async (isBackground = false) => {
        if (user?.role === 'judge' || user?.role === 'volunteer') {
            setProjects([]);
            return;
        }
        try {
            let url = '/api/teams';
            if (user?.role === 'team' && user?.teamId) {
                url += `?teamId=${user.teamId}`;
            }

            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok && mountedRef.current) {
                const serverTeams = await response.json();
                setProjects(serverTeams || []);
            } else if (mountedRef.current && user?.role === 'team' && [401, 403].includes(response.status)) {
                setProjects([]);
            }
        } catch (err) {
            if (!isBackground) console.error("Failed to sync teams from server:", err);
        }
    };

    useEffect(() => {
        if (user?.role === 'team' && user.portalMode !== 'event') {
            setProjects([]);
        }
    }, [user?.role, user?.portalMode]);

    // Load application data from Supabase-backed APIs.
    useEffect(() => {
        mountedRef.current = true;
        if (!needsHackathonData || !user) {
            setIsLoading(false);
            return () => {
                mountedRef.current = false;
            };
        }

        setIsLoading(true);

        // 1. Fetch Global Settings from DB
        const fetchSettings = async (isBackground = false) => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok && mountedRef.current) {
                    const dbSettings = await response.json();
                    if (dbSettings.start_date) setHackathonStartDate(dbSettings.start_date);
                    if (dbSettings.emergency_contact) setEmergencyContact(dbSettings.emergency_contact);
                    if (dbSettings.is_submission_locked !== undefined) setIsSubmissionLocked(dbSettings.is_submission_locked);
                    if (dbSettings.is_round_lock_enabled !== undefined) setIsRoundLockEnabled(dbSettings.is_round_lock_enabled);
                    if (dbSettings.enabled_meals !== undefined) setEnabledMeals(dbSettings.enabled_meals);
                    if (dbSettings.released_rounds) setReleasedRounds(dbSettings.released_rounds);
                    if (Array.isArray(dbSettings.round_configs)) {
                        setRoundConfigs(normalizeJudgingRounds(dbSettings.round_configs));
                    }
                }
            } catch (err) {
                if (!isBackground) console.error("Failed to fetch settings:", err);
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
                    user?.role === 'admin' ? fetch('/api/judges') : Promise.resolve(null),
                    user?.role === 'admin' ? fetch('/api/volunteers') : Promise.resolve(null)
                ]);

                if (judgesRes?.ok) currentJudges = await judgesRes.json();
                if (volunteersRes?.ok) currentVolunteers = await volunteersRes.json();

                // Normalize database fields to the client model.
                const normalize = (list: any[]) => list.map(item => ({
                    ...item,
                    generatedId: item.generated_id || item.generatedId,
                    id: item.id?.toString()
                }));

                if (Array.isArray(currentJudges)) {
                    setJudges(normalize(currentJudges));
                }
                if (Array.isArray(currentVolunteers)) {
                    setVolunteers(normalize(currentVolunteers));
                }

            } catch (error) {
                console.error("Failed to fetch judges/volunteers:", error);

                setJudges([]);
                setVolunteers([]);
            }

            setIsLoading(false);
        };
        initFetch();

        // Dynamic polling interval based on user role
        // Admins/Judges need faster updates (60s), Teams/Guests can be slower (3 minutes) to reduce DB load
        const pollingInterval = user?.role === 'admin' || user?.role === 'judge' ? 300000 : 300000;

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
    }, [user, needsHackathonData]);

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

    const updateEnabledMeals = async (meals: string[]) => {
        setEnabledMeals(meals);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'enabled_meals', value: meals })
            });
            toast.success("Meal settings updated");
        } catch (err) {
            console.error("Failed to update enabled meals:", err);
            toast.error("Settings sync failed");
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
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'round_configs', value: updated })
            });
            toast.success("Round time updated");
        } catch (err) {
            console.error("Failed to update round time:", err);
            toast.error("Cloud sync failed");
        }
    };

    const saveRoundConfigs = async (configs: JudgingRound[]): Promise<boolean> => {
        const normalized = normalizeJudgingRounds(configs);
        if (!normalized.length || normalized.length !== configs.length) {
            toast.error('At least one valid judging round is required.');
            return false;
        }

        const previous = roundConfigs;
        setRoundConfigs(normalized);
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'round_configs', value: normalized })
            });
            if (!response.ok) throw new Error('Round settings could not be saved.');
            toast.success('Judging rounds saved');
            return true;
        } catch (error) {
            setRoundConfigs(previous);
            toast.error(error instanceof Error ? error.message : 'Round settings could not be saved.');
            return false;
        }
    };

    const checkInTeam = async (projectId: any): Promise<boolean> => {
        const now = new Date().toISOString();
        const project = projects.find(item => item.id === projectId);
        if (!project) return false;
        try {
            const response = await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectId, isCheckedIn: true, checkedInAt: now })
            });
            if (!response.ok) throw new Error('Check-in was rejected by the server.');
            setProjects(prev => prev.map(item => item.id === projectId ? { ...item, isCheckedIn: true, checkedInAt: now } : item));
            toast.success("Team Checked In!");
            return true;
        } catch (err) {
            console.error(err);
            toast.error("Check-in sync failed");
            return false;
        }
    };

    const addJudge = async (judgeData: { name: string, specialization: string }) => {
        try {
            const response = await fetch('/api/judges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(judgeData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Judge save failed');
            const newJudge: Judge = {
                ...judgeData,
                id: result.data.id,
                generatedId: result.data.generated_id,
                password: result.data.password
            };
            setJudges(current => [...current, newJudge]);
            toast.success(`Judge added. ID: ${newJudge.generatedId}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to save judge to server");
        }
    };

    const removeJudge = async (id: string) => {
        try {
            const judge = judges.find(j => j.id === id);
            // Try deleting by generatedId if available (for server logic), otherwise use id
            const deleteId = judge?.generatedId || id;

            const response = await fetch(`/api/judges?id=${deleteId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Judge deletion failed');
            setJudges(current => current.filter(judge => judge.id !== id));
            toast.success("Judge removed");
        } catch (err) {
            console.error(err);
            toast.error("Failed to remove judge from server");
        }
    };

    const addVolunteer = async (volunteerData: { name: string, phone: string, role: string }) => {
        try {
            const response = await fetch('/api/volunteers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(volunteerData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Volunteer save failed');
            const newVol: Volunteer = {
                ...volunteerData,
                id: result.data.id,
                generatedId: result.data.generated_id,
                password: result.data.password
            };
            setVolunteers(current => [...current, newVol]);
            toast.success(`Volunteer added. ID: ${newVol.generatedId}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to save volunteer to server");
        }
    };

    const removeVolunteer = async (id: string) => {
        try {
            const vol = volunteers.find(v => v.id === id);
            const deleteId = vol?.generatedId || id;

            const response = await fetch(`/api/volunteers?id=${deleteId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Volunteer deletion failed');
            setVolunteers(current => current.filter(volunteer => volunteer.id !== id));
            toast.success("Volunteer removed");
        } catch (err) {
            console.error(err);
            toast.error("Failed to remove volunteer from server");
        }
    };

    const updateMemberDetails = async (projectId: any, memberIndex: number, updatedMemberData: Member): Promise<boolean> => {
        const project = projects.find(p => p.id === projectId);
        if (!project || !project.members[memberIndex]) return false;

        const oldMember = project.members[memberIndex];
        const oldEmail = typeof oldMember === 'string' ? '' : oldMember.email || '';
        const newMembers = project.members.map((member, index) => {
            if (index !== memberIndex) return member;
            const memberObj = typeof member === 'string' ? { fullName: member } : member;
            return { ...memberObj, ...updatedMemberData };
        });
        const memberMealState = { ...project.memberMealState };
        const newEmail = updatedMemberData.email || '';
        if (oldEmail && oldEmail !== newEmail) {
            if (newEmail && memberMealState[oldEmail]) memberMealState[newEmail] = memberMealState[oldEmail];
            delete memberMealState[oldEmail];
        }
        const firstMember = newMembers[0];
        const firstMemberDetails = typeof firstMember === 'string' ? null : firstMember;

        try {
            const response = await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectId, members: newMembers, memberMealState })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update member');
            }
            setProjects(prev => prev.map(p => p.id === projectId ? {
                ...p,
                members: newMembers,
                memberMealState,
                captain: firstMemberDetails?.fullName || (typeof firstMember === 'string' ? firstMember : p.captain),
                captainMobile: firstMemberDetails?.phone || p.captainMobile,
                college: firstMemberDetails?.college || p.college
            } : p));
            toast.success("Participant details updated!");
            return true;
        } catch (err: any) {
            console.error("Failed to update participant details:", err);
            toast.error(`Sync failed: ${err.message}`);
            return false;
        }
    };

    const removeTeamMember = async (projectId: any, memberIndex: number): Promise<boolean> => {
        const project = projects.find(p => p.id === projectId);
        if (!project || !project.members[memberIndex]) return false;
        if (project.members.length <= 1) {
            toast.error("A team must keep at least one participant.");
            return false;
        }

        const removedMember = project.members[memberIndex];
        const removedEmail = typeof removedMember === 'string' ? '' : removedMember.email || '';
        const members = project.members.filter((_, index) => index !== memberIndex);
        const memberMealState = { ...project.memberMealState };
        if (removedEmail) delete memberMealState[removedEmail];
        const firstMember = members[0];
        const firstMemberDetails = typeof firstMember === 'string' ? null : firstMember;

        try {
            const response = await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectId, members, memberMealState })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove participant');
            }
            setProjects(prev => prev.map(p => p.id === projectId ? {
                ...p,
                members,
                memberMealState,
                captain: firstMemberDetails?.fullName || (typeof firstMember === 'string' ? firstMember : p.captain),
                captainMobile: firstMemberDetails?.phone || p.captainMobile,
                college: firstMemberDetails?.college || p.college
            } : p));
            toast.success("Participant removed from team.");
            return true;
        } catch (err: any) {
            console.error("Failed to remove participant:", err);
            toast.error(`Sync failed: ${err.message}`);
            return false;
        }
    };

    const addTeamMember = async (projectId: any, memberData: Member): Promise<boolean> => {
        const project = projects.find(p => p.id === projectId);
        const fullName = memberData.fullName.trim();
        if (!project || !fullName) {
            toast.error('Participant name is required.');
            return false;
        }
        if (project.members.length >= MAX_TEAM_MEMBERS) {
            toast.error(`Teams are limited to ${MAX_TEAM_MEMBERS} participants.`);
            return false;
        }

        const newMember: Member = {
            fullName,
            email: memberData.email?.trim() || '',
            phone: memberData.phone?.trim() || '',
            college: memberData.college?.trim() || '',
            year: memberData.year?.trim() || '',
            department: memberData.department?.trim() || ''
        };
        const members = [...project.members, newMember];

        try {
            const response = await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectId, members })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add participant');
            }
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, members } : p));
            toast.success('Participant added to team.');
            return true;
        } catch (err: any) {
            console.error('Failed to add participant:', err);
            toast.error(`Sync failed: ${err.message}`);
            return false;
        }
    };

    const transferTeamMembers = async (
        projectId: any,
        selections: { sourceTeamId: string; memberIndex: number }[]
    ): Promise<boolean> => {
        const target = projects.find(project => project.id === projectId);
        if (!target || !selections.length) return false;
        if (target.members.length + selections.length > MAX_TEAM_MEMBERS) {
            toast.error(`Teams are limited to ${MAX_TEAM_MEMBERS} participants.`);
            return false;
        }

        try {
            const response = await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectId, transferMembers: selections })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to move participants');

            const changedTeams = [result.targetTeam, ...result.updatedSourceTeams];
            const changedById = new Map(changedTeams.map(team => [String(team.teamId || team.id), team]));
            const removedIds = new Set(result.removedTeamIds as string[]);
            setProjects(previous => previous.flatMap(project => {
                const teamId = String(project.teamId || project.id);
                if (removedIds.has(teamId)) return [];
                const changed = changedById.get(teamId);
                return changed ? [changed] : [project];
            }));
            toast.success(`Moved ${selections.length} participant${selections.length === 1 ? '' : 's'} to ${target.team}.`);
            return true;
        } catch (error) {
            console.error('Failed to move existing participants:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to move participants.');
            return false;
        }
    };

    const claimMemberMeal = async (projectId: any, memberId: string, mealKey: string, volunteerId?: string): Promise<{ status: 'PERMITTED' | 'ALREADY_CLAIMED' | 'NOT_INCLUDED' | 'ALL_MEALS_CLAIMED' | 'NEEDS_CHECKIN' | 'SAVE_FAILED'; claimedAt?: string; claimedBy?: string; mealName?: string; }> => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return { status: 'NOT_INCLUDED' };

        if (!project.checkedInAt) {
            return { status: 'NEEDS_CHECKIN' };
        }

        const memberMealState = project.memberMealState || {};
        const memberSlots = memberMealState[memberId] || {};
        const slot = memberSlots[mealKey];

        if (slot?.claimedAt) {
            return { status: 'ALREADY_CLAIMED', claimedAt: slot.claimedAt, claimedBy: slot.claimedBy, mealName: mealKey };
        }

        const now = new Date().toISOString();
        const updatedSlot: MemberMealSlot = {
            claimedAt: now,
            claimedBy: volunteerId || "Volunteer"
        };

        const updatedMemberMealState = {
            ...memberMealState,
            [memberId]: {
                ...memberSlots,
                [mealKey]: updatedSlot
            }
        };

        try {
            const response = await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectId, memberMealState: updatedMemberMealState })
            });
            if (!response.ok) throw new Error('Meal claim was rejected by the server.');
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, memberMealState: updatedMemberMealState } : p));
        } catch (err) {
            console.error("Failed to sync member meal claim:", err);
            return { status: 'SAVE_FAILED' };
        }

        return { status: 'PERMITTED', claimedAt: now, claimedBy: volunteerId || "Volunteer", mealName: mealKey };
    };

    const resetMemberMeal = async (projectId: any, memberId: string, mealKey: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        
        const memberMealState = project.memberMealState || {};
        const memberSlots = memberMealState[memberId] || {};
        
        const updatedMemberSlots = { ...memberSlots };
        delete updatedMemberSlots[mealKey];

        const updatedMemberMealState = {
            ...memberMealState,
            [memberId]: updatedMemberSlots
        };

        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, memberMealState: updatedMemberMealState } : p));

        try {
            await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectId, memberMealState: updatedMemberMealState })
            });
            toast.success("Meal claim reset!");
        } catch (err) {
            console.error("Failed to reset member meal:", err);
            toast.error("Failed to sync meal reset");
        }
    };

    const bulkAssignMealPlan = async (projectIds: any[], mealKeys: string[], included: boolean) => {
        try {
            // Call the bulk-meals API endpoint
            const response = await fetch('/api/admin/bulk-meals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    projectIds, 
                    mealKeys, 
                    included,
                    operation: 'bulk_assign'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to assign meal plan');
            }

            // Update local state to reflect changes
            setProjects(prev => prev.map(project => {
                if (projectIds.includes(project.id)) {
                    const updatedMemberMealState = project.memberMealState || {};
                    
                    // Ensure all members have meal slots for the selected meals
                    project.members.forEach((member, index) => {
                        const memberId = typeof member === 'string' 
                            ? `member_${index}` 
                            : member.email || `member_${index}`;
                        
                        if (!updatedMemberMealState[memberId]) {
                            updatedMemberMealState[memberId] = {};
                        }

                        mealKeys.forEach(mealKey => {
                            if (included) {
                                // Initialize meal slot if it doesn't exist
                                if (!updatedMemberMealState[memberId][mealKey]) {
                                    updatedMemberMealState[memberId][mealKey] = {
                                        claimedAt: null
                                    };
                                }
                            } else {
                                // Remove meal access
                                delete updatedMemberMealState[memberId][mealKey];
                            }
                        });
                    });

                    return { ...project, memberMealState: updatedMemberMealState };
                }
                return project;
            }));

            toast.success(`Meal plan ${included ? 'assigned to' : 'removed from'} ${projectIds.length} teams`);
        } catch (err: any) {
            console.error("Bulk meal assign failed:", err);
            toast.error(`Bulk assign failed: ${err.message}`);
            throw err;
        }
    };

    const toggleMealAccess = async (projectId: any, mealKey: string, included: boolean) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const updatedMemberMealState = { ...project.memberMealState || {} };

        // Apply to all members of the team
        project.members.forEach((member, index) => {
            const memberId = typeof member === 'string' 
                ? `member_${index}` 
                : member.email || `member_${index}`;
            
            if (!updatedMemberMealState[memberId]) {
                updatedMemberMealState[memberId] = {};
            }

            if (included) {
                // Add meal access if not exists
                if (!updatedMemberMealState[memberId][mealKey]) {
                    updatedMemberMealState[memberId][mealKey] = { claimedAt: null };
                }
            } else {
                // Remove meal access
                delete updatedMemberMealState[memberId][mealKey];
            }
        });

        // Update local state
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, memberMealState: updatedMemberMealState } : p));

        try {
            await fetch('/api/teams', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectId, memberMealState: updatedMemberMealState })
            });
            toast.success(`Meal access ${included ? 'granted' : 'removed'} for ${project.name}`);
        } catch (err) {
            console.error("Failed to toggle meal access:", err);
            toast.error("Failed to update meal access");
        }
    };

    const deleteTeams = async (teamIds: string[]): Promise<boolean> => {
        try {
            const res = await fetch('/api/admin/bulk-teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', teamIds })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to delete teams');
            }
            const idSet = new Set(teamIds.map(id => String(id).toUpperCase()));
            setProjects(prev => prev.filter(p => !idSet.has(String(p.teamId || '').toUpperCase()) && !idSet.has(String(p.id || '').toUpperCase())));
            toast.success(`Deleted ${teamIds.length} team${teamIds.length === 1 ? '' : 's'}.`);
            return true;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to delete teams.';
            console.error('Delete teams failed:', err);
            toast.error(msg);
            return false;
        }
    };

    const bulkUpdateTeams = async (teamIds: string[], updates: { track?: string; room?: string; roomWifiSSID?: string; roomWifiPass?: string; isCheckedIn?: boolean }): Promise<boolean> => {
        try {
            const res = await fetch('/api/admin/bulk-teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', teamIds, updates })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to update teams');
            }
            const idSet = new Set(teamIds.map(id => String(id).toUpperCase()));
            setProjects(prev => prev.map(p => {
                if (idSet.has(String(p.teamId || '').toUpperCase()) || idSet.has(String(p.id || '').toUpperCase())) {
                    return {
                        ...p,
                        ...updates,
                        ...(updates.isCheckedIn !== undefined ? {
                            isCheckedIn: updates.isCheckedIn,
                            checkedInAt: updates.isCheckedIn ? (p.checkedInAt || new Date().toISOString()) : null
                        } : {})
                    };
                }
                return p;
            }));
            toast.success(`Updated ${teamIds.length} team${teamIds.length === 1 ? '' : 's'}.`);
            return true;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to update teams.';
            console.error('Bulk update teams failed:', err);
            toast.error(msg);
            return false;
        }
    };

    return (
        <HackathonContext.Provider
            value={{
                hackathonStartDate,
                updateHackathonStartDate,
                emergencyContact,
                updateEmergencyContact,
                releasedRounds,
                toggleRoundRelease,
                isSubmissionLocked,
                toggleSubmissionLock,
                isRoundLockEnabled,
                toggleRoundLock,
                enabledMeals,
                updateEnabledMeals,
                projects,
                isLoading,
                checkInTeam,
                judges,
                addJudge,
                removeJudge,
                volunteers,
                addVolunteer,
                removeVolunteer,
                roundConfigs,
                updateRoundTime,
                saveRoundConfigs,
                updateMemberDetails,
                removeTeamMember,
                addTeamMember,
                transferTeamMembers,
                claimMemberMeal,
                resetMemberMeal,
                bulkAssignMealPlan,
                toggleMealAccess,
                deleteTeams,
                bulkUpdateTeams,
                refreshTeams: async () => {
                    await fetchServerTeams(false);
                }
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
