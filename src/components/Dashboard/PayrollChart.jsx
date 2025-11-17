import React from 'react';
import { DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const PayrollChart = ({ data }) => {
  return (
    <div className="chart-card bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Payroll Trend
        </h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis 
            dataKey="month" 
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
            formatter={(value) => `₱${value.toLocaleString()}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#1E88E5" 
            strokeWidth={3}
            name="Payroll Amount"
            dot={{ fill: '#1E88E5', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};


