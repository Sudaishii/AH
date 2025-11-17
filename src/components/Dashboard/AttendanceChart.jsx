import React from 'react';
import { Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const AttendanceChart = ({ data }) => {
  return (
    <div className="chart-card bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Weekly Attendance
        </h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis 
            dataKey="name" 
            className="text-slate-600 dark:text-slate-400"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            className="text-slate-600 dark:text-slate-400"
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--tw-bg-white)',
              border: '1px solid rgb(226 232 240)',
              borderRadius: '8px',
            }}
            className="dark:bg-slate-800 dark:border-slate-700"
          />
          <Legend />
          <Bar dataKey="present" fill="#1E88E5" name="Present" radius={[8, 8, 0, 0]} />
          <Bar dataKey="absent" fill="#EF4444" name="Absent" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


