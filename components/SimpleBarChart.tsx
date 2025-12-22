import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: DataPoint[];
  color: string;
  height?: number;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ 
  data, 
  color, 
  height = 60 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-text-tertiary text-xs">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="flex items-end gap-1 h-full">
        {data.map((point, index) => {
          const barHeight = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-end group relative"
              style={{ height: '100%' }}
            >
              <div
                className="w-full rounded-t transition-all hover:opacity-80"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: color,
                  minHeight: point.value > 0 ? '4px' : '0',
                }}
                title={`${point.label}: ${point.value}`}
              />
              {/* Optional: Show label on hover */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {point.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

