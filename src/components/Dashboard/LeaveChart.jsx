import React from 'react';
import { FileText } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export const LeaveChart = ({ data }) => {
  return (
    <div className="chart-card bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Leave Requests Status
        </h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--tw-bg-white)',
              border: '1px solid rgb(226 232 240)',
              borderRadius: '8px',
            }}
            className="dark:bg-slate-800 dark:border-slate-700"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};


