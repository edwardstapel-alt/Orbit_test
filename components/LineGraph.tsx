import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface LineGraphDataPoint {
  date: string;
  value: number;
}

interface LineGraphProps {
  data: LineGraphDataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
  height?: number;
}

export const LineGraph: React.FC<LineGraphProps> = ({
  data,
  title,
  xAxisLabel = 'Datum',
  yAxisLabel = 'Waarde',
  color = '#6366F1',
  height = 300
}) => {
  // Format date for display (DD MMM format)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  // Format date for X-axis (shorter format)
  const formatXAxisDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      {title && (
        <h3 className="text-lg font-bold text-text-main mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisDate}
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #E5E7EB', 
              borderRadius: '8px',
              padding: '8px 12px'
            }}
            labelFormatter={(value) => formatDate(value)}
            formatter={(value: number) => [value, yAxisLabel]}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-between mt-2 text-xs text-text-tertiary">
        <span>{xAxisLabel}</span>
        <span>{yAxisLabel}</span>
      </div>
    </div>
  );
};

