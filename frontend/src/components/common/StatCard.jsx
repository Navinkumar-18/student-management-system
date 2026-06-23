import React from 'react';
import Icon from './Icon';

export default function StatCard({ title, value, subtitle, icon, trend, trendValue, color = 'primary' }) {
  const colorMap = {
    primary: {
      bg: 'bg-primary-container/10',
      icon: 'text-primary-container',
      ring: 'ring-primary-container/20',
    },
    secondary: {
      bg: 'bg-secondary/10',
      icon: 'text-secondary',
      ring: 'ring-secondary/20',
    },
    tertiary: {
      bg: 'bg-tertiary/10',
      icon: 'text-tertiary',
      ring: 'ring-tertiary/20',
    },
    error: {
      bg: 'bg-error/10',
      icon: 'text-error',
      ring: 'ring-error/20',
    },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <div className="stat-card group animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${c.bg} ring-1 ${c.ring} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
          <Icon name={icon} size={24} className={c.icon} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-label-md ${
            trend === 'up' ? 'text-emerald-600' : 'text-red-600'
          }`}>
            <Icon name={trend === 'up' ? 'trending_up' : 'trending_down'} size={16} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">{title}</p>
      <p className="text-headline-md text-on-surface">{value}</p>
      {subtitle && (
        <p className="text-body-md text-on-surface-variant mt-1">{subtitle}</p>
      )}
    </div>
  );
}
