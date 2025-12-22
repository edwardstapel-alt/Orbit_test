import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  date?: string;
}

interface MetricData {
  data: DataPoint[];
  color: string;
  label: string;
}

interface SimpleLineChartProps {
  metrics: MetricData[];
  height?: number;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ 
  metrics, 
  height = 180 
}) => {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-text-tertiary text-xs">
        No data available
      </div>
    );
  }

  // Get all data points from all metrics
  const allDataPoints = metrics.flatMap(m => m.data);
  const allValues = allDataPoints.map(d => d.value).filter(v => !isNaN(v) && isFinite(v));
  
  if (allValues.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-text-tertiary text-xs">
        No valid data
      </div>
    );
  }
  
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue || 1;
  
  // If all values are the same, add some padding to make the line visible
  const adjustedMin = valueRange === 0 ? Math.max(0, minValue - 1) : minValue;
  const adjustedMax = valueRange === 0 ? minValue + 2 : maxValue;
  const adjustedRange = adjustedMax - adjustedMin || 1;
  
  // Use the first metric's data for x-axis (assuming all metrics have same dates)
  const xAxisData = metrics[0]?.data || [];
  if (xAxisData.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-text-tertiary text-xs">
        No data points
      </div>
    );
  }

  const padding = { top: 15, bottom: 35, left: 8, right: 8 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = 100 - padding.left - padding.right;

  // Generate path for a line
  const generatePath = (data: DataPoint[]) => {
    if (data.length === 0) return '';
    
    const points = data.map((point, index) => {
      const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
      const normalizedValue = adjustedRange > 0 
        ? (point.value - adjustedMin) / adjustedRange 
        : 0.5;
      // Invert Y so higher values are at top
      const y = padding.top + (chartHeight - (normalizedValue * chartHeight));
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    });
    
    return points.join(' ');
  };

  return (
    <div className="w-full relative" style={{ height: `${height}px` }}>
      <svg 
        viewBox={`0 0 100 ${height}`} 
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        {/* Draw lines for each metric */}
        {metrics.map((metric, metricIndex) => {
          if (!metric.data || metric.data.length === 0) return null;
          
          const path = generatePath(metric.data);
          if (!path) return null;
          
          return (
            <path
              key={metricIndex}
              d={path}
              fill="none"
              stroke={metric.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={metricIndex > 0 ? "4,3" : "0"} // Dashed for second metric
              opacity={0.9}
            />
          );
        })}

        {/* X-axis labels (dates) - show every ~5 days */}
        {xAxisData.map((point, index) => {
          const showLabel = xAxisData.length <= 7 
            ? true 
            : index % Math.ceil(xAxisData.length / 6) === 0 || index === xAxisData.length - 1;
          
          if (showLabel) {
            const x = padding.left + (index / (xAxisData.length - 1 || 1)) * chartWidth;
            const date = point.date ? new Date(point.date + 'T00:00:00') : null;
            const label = date 
              ? `${date.getDate()}/${date.getMonth() + 1}`
              : point.label.length > 5 
                ? point.label.substring(0, 5) 
                : point.label;
            
            return (
              <text
                key={index}
                x={x}
                y={height - 10}
                fontSize="10"
                fill="#6B7280"
                textAnchor="middle"
                fontWeight="500"
              >
                {label}
              </text>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};
