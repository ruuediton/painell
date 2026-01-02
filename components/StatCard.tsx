
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-start justify-between transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-sky-300' : ''}`}
    >
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 flex items-center ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span className="mr-1">{trend.positive ? '↑' : '↓'}</span>
            {trend.value} <span className="text-slate-400 ml-1">desde ontem</span>
          </p>
        )}
      </div>
      <div className="bg-sky-50 p-3 rounded-lg text-sky-600">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
