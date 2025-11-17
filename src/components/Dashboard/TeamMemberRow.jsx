import React from 'react';
import { MoreHorizontal, Mail, UserCheck } from 'lucide-react';
import * as Avatar from '@radix-ui/react-avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Cn } from '../../utils/cn';

export const TeamMemberRow = ({ member }) => {
  return (
    <div className="team-member-row flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 mb-3 last:mb-0 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
      {/* Avatar */}
      <Avatar.Root className="flex-shrink-0">
        <Avatar.Image
          src={member.avatar}
          alt={member.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <Avatar.Fallback className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium text-sm">
          {member.initials}
        </Avatar.Fallback>
      </Avatar.Root>

      {/* Member Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-slate-900 dark:text-slate-50 truncate">
          {member.name}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
          {member.email}
        </p>
      </div>

      {/* Dropdown Menu */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            aria-label="More options"
          >
            <MoreHorizontal className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={Cn(
              "bg-white dark:bg-slate-800 rounded-lg shadow-lg z-50 min-w-[200px]",
              "border border-slate-200 dark:border-slate-700",
              "p-1"
            )}
            sideOffset={5}
            align="end"
          >
            <DropdownMenu.Item
              className={Cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer",
                "text-slate-900 dark:text-slate-50",
                "hover:bg-blue-50 dark:hover:bg-slate-700",
                "focus:outline-none focus:bg-blue-50 dark:focus:bg-slate-700"
              )}
            >
              <Mail className="w-4 h-4" />
              Send email
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={Cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer",
                "text-slate-900 dark:text-slate-50",
                "hover:bg-blue-50 dark:hover:bg-slate-700",
                "focus:outline-none focus:bg-blue-50 dark:focus:bg-slate-700"
              )}
            >
              <UserCheck className="w-4 h-4" />
              View profile
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
            <DropdownMenu.Item
              className={Cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer",
                "text-red-600 dark:text-red-400",
                "hover:bg-red-50 dark:hover:bg-red-950/20",
                "focus:outline-none focus:bg-red-50 dark:focus:bg-red-950/20"
              )}
            >
              Remove member
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};


