import { motion } from 'framer-motion';

const AnimatedContent = ({ 
  children, 
  distance = 20, 
  direction = "up", 
  delay = 0 
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case "up": return { y: distance, opacity: 0 };
      case "down": return { y: -distance, opacity: 0 };
      case "left": return { x: distance, opacity: 0 };
      case "right": return { x: -distance, opacity: 0 };
      default: return { y: distance, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: delay / 1000, 
        ease: "easeOut" 
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContent;