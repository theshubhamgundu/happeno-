"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ShieldAlert, RefreshCw, Activity, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { notFound } from "next/navigation";
import { toast } from "sonner";

export default function AdminLogsPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/logs");
            const data = await res.json();
            
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to fetch logs");
            }
            setLogs(data.logs || []);
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchLogs();
        }
    }, [user]);

    // Fast-fail if not Shubham by rendering a 404 so the page appears to not exist
    if (user && user.name?.toLowerCase() !== 'shubham') {
        notFound();
    }

    return (
        <DashboardLayout title="Master Audit Logs" type="admin">
            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2 text-slate-900">
                            <Activity className="text-teal-600" /> Master Activity Logs
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Classified log of all admin actions. Eyes only: Shubham.</p>
                    </div>
                    <button 
                        onClick={fetchLogs}
                        disabled={isLoading}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-teal-600 hover:border-teal-300 transition-colors"
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>

                {error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
                        {error}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Timestamp</th>
                                    <th className="px-6 py-4 font-bold">Admin</th>
                                    <th className="px-6 py-4 font-bold">Action</th>
                                    <th className="px-6 py-4 font-bold">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading classified logs...</td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No admin actions logged yet.</td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                {log.admin_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded text-xs font-bold uppercase tracking-wider">
                                                    {log.action_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
