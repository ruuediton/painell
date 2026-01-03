
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
      className={`bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 flex items-start justify-between transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-sky-300' : ''}`}
    >
      <div className="flex-1">
        <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest leading-none">{title}</p>
        <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-2 md:mt-3 break-words">{value}</h3>
        {trend && (
          <p className={`text-[9px] md:text-xs mt-2 md:mt-3 flex items-center font-bold ${trend.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
            <span className="mr-1">{trend.positive ? '●' : '●'}</span>
            {trend.value}
          </p>
        )}
      </div>
      <div className="bg-sky-50 p-2.5 md:p-3 rounded-xl text-sky-500 ml-3">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
