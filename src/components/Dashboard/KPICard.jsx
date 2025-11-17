import React from 'react';
import { TrendingUp } from 'lucide-react';

export const KPICard = ({ title, value, change, changeType, icon: Icon, color }) => {
  return (
    <div className="kpi-card bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          changeType === 'positive' 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          <TrendingUp className={`w-4 h-4 ${changeType === 'negative' ? 'rotate-180' : ''}`} />
          <span>{change}</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">
        {value}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {title}
      </p>
    </div>
  );
};


