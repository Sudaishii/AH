import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { TeamMemberRow } from './TeamMemberRow';

export const TeamManagement = ({ teamMembers = [], onInvite }) => {
  const [email, setEmail] = useState('');

  const handleInvite = (e) => {
    e.preventDefault();
    if (email.trim()) {
      onInvite?.(email);
      setEmail('');
    }
  };

  return (
    <div className="team-management-card bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700 mb-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Your team
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Invite and manage your team members.
        </p>
      </div>

      {/* Invite Form */}
      <form onSubmit={handleInvite} className="flex gap-3 mb-6">
        <div className="flex-1">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="h-10 px-6 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        </div>
      </form>

      {/* Team Members List */}
      <div className="team-members-list">
        {teamMembers.map((member) => (
          <TeamMemberRow key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
};


