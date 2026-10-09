import React from 'react';
import ghostsData from './data.json';
import { ShieldAlert } from 'lucide-react';

export default function GhostMembersPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resolved Ghost Members</h1>
          <p className="text-gray-500">
            A permanent record of the duplicate seats that were cleaned out. These members merged into active teams but left their old registrations behind.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Duplicate Seats Removed</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{ghostsData.length}</div>
            <p className="text-xs text-gray-500">Total duplicate entries cleared</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Unique People Handled</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">40</div>
            <p className="text-xs text-gray-500">Unique participants processed</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Database Status</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-green-500">Clean</div>
            <p className="text-xs text-gray-500">Ready for seat mapping</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Cleanup History Log</h3>
          <p className="text-sm text-gray-500">Details of every duplicate registration that was safely removed.</p>
        </div>
        <div className="p-6 pt-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-10 px-2 text-left align-middle font-medium text-gray-500">Participant</th>
                  <th className="h-10 px-2 text-left align-middle font-medium text-gray-500">Contact Info</th>
                  <th className="h-10 px-2 text-left align-middle font-medium text-gray-500">Removed From (Ghost)</th>
                  <th className="h-10 px-2 text-left align-middle font-medium text-gray-500">Safely Kept In (Active)</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {ghostsData.map((person, i) => (
                  <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-2 align-middle font-medium">{person.name}</td>
                    <td className="p-2 align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm">{person.phone}</span>
                        <span className="text-xs text-gray-500">{person.email}</span>
                      </div>
                    </td>
                    <td className="p-2 align-middle">
                      <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-red-500/10 text-red-500 hover:bg-red-500/20">
                        {person.deletedFrom}
                      </span>
                    </td>
                    <td className="p-2 align-middle">
                      <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        {person.keptIn}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
