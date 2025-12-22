import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  date?: string;
}

interface LineChartProps {
  data: DataPoint[];
  selectedMetrics: Array<{ label: string; color: string; data: DataPoint[] }>;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  selectedMetrics, 
  height = 200 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-tertiary text-sm">
        No data available
      </div>
    );
  }

  const padding = 40;
  const chartWidth = 100;
  const chartHeight = height - padding * 2;
  
  // Calculate min/max values across all metrics
  const allValues = selectedMetrics.flatMap(m => m.data.map(d => d.value));
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue || 1;

  // Calculate positions for each data point
  const getPointPosition = (index: number, value: number) => {
    const x = (index / (data.length - 1 || 1)) * chartWidth;
    const normalizedValue = (value - minValue) / valueRange;
    const y = chartHeight - (normalizedValue * chartHeight);
    return { x: x + padding, y: y + padding };
  };

  // Generate path for a line
  const generatePath = (metricData: DataPoint[]) => {
    if (metricData.length === 0) return '';
    
    const points = metricData.map((point, index) => {
      const pos = getPointPosition(index, point.value);
      return `${index === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`;
    });
    
    return points.join(' ');
  };

  return (
    <div className="w-full">
      <svg 
        viewBox={`0 0 100 ${height}`} 
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + (chartHeight * (1 - ratio));
          const value = minValue + (valueRange * ratio);
          return (
            <g key={ratio}>
              <line
                x1={padding}
                y1={y}
                x2={100 - padding}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="0.5"
                strokeDasharray="1,1"
              />
              <text
                x={padding - 5}
                y={y + 3}
                fontSize="8"
                fill="#9CA3AF"
                textAnchor="end"
              >
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        {/* Data lines */}
        {selectedMetrics.map((metric, metricIndex) => {
          const path = generatePath(metric.data);
          if (!path) return null;
          
          return (
            <g key={metricIndex}>
              <path
                d={path}
                fill="none"
                stroke={metric.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {metric.data.map((point, index) => {
                const pos = getPointPosition(index, point.value);
                return (
                  <circle
                    key={index}
                    cx={pos.x}
                    cy={pos.y}
                    r="1.5"
                    fill={metric.color}
                    stroke="white"
                    strokeWidth="0.5"
                  />
                );
              })}
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((point, index) => {
          if (data.length > 10 && index % Math.ceil(data.length / 5) !== 0) return null;
          const x = (index / (data.length - 1 || 1)) * chartWidth + padding;
          return (
            <text
              key={index}
              x={x}
              y={height - padding + 12}
              fontSize="7"
              fill="#9CA3AF"
              textAnchor="middle"
            >
              {point.label.length > 6 ? point.label.substring(0, 6) : point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

