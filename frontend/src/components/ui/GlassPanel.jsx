const GlassPanel = ({ children, className = "", darker = false, style = {} }) => (
  <div 
    className={className}
    style={{
      backgroundColor: darker ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.02)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '1rem',
      ...style
    }}
  >
    {children}
  </div>
);

export default GlassPanel;