import React from 'react';

const SimpleGlass = ({ 
  children, 
  className = '', 
  style = {},
  blur = 12,
  opacity = 0.1,
  borderRadius = 16,
  ...props 
}) => {
  const glassStyle = {
    background: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: `${borderRadius}px`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    ...style
  };

  return (
    <div 
      className={`relative ${className}`}
      style={glassStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export default SimpleGlass;