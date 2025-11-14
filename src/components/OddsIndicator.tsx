import React from 'react';

interface OddsIndicatorProps {
  current: number | null;
  previous: number | null;
  className?: string;
}

export const OddsIndicator: React.FC<OddsIndicatorProps> = ({ 
  current, 
  previous, 
  className = "ml-1" 
}) => {
  // Temporary debug logging
  if (current !== null && previous !== null) {
    console.log('OddsIndicator rendering:', { current, previous, difference: current - previous });
  }
  
  if (!current || !previous) {
    return null;
  }

  const difference = current - previous;
  const tolerance = 0.001; // Small tolerance for floating point comparison

  if (Math.abs(difference) < tolerance) {
    // Equal - show yellow equals sign
    return (
      <span className={`inline-flex items-center ${className}`} title="Multiplicador sin cambios">
        <span className="text-yellow-600 text-sm font-bold">=</span>
      </span>
    );
  } else if (difference > 0) {
    // Increased - show green triangle up
    return (
      <span className={`inline-flex items-center ${className}`} title="Multiplicador aumentó">
        <span className="text-green-600 text-sm font-bold">▲</span>
      </span>
    );
  } else {
    // Decreased - show red triangle down
    return (
      <span className={`inline-flex items-center ${className}`} title="Multiplicador disminuyó">
        <span className="text-red-600 text-sm font-bold">▼</span>
      </span>
    );
  }
};
