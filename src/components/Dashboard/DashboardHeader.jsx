import React from 'react';

export const DashboardHeader = ({ title = 'HR Dashboard', subtitle = 'Overview of your human resources and operations' }) => {
  return (
    <div className="mb-6">
      <h1 className="title text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
        {title}
      </h1>
      <p className="text-slate-600 dark:text-slate-400">
        {subtitle}
      </p>
    </div>
  );
};


