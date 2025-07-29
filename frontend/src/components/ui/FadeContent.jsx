import { motion } from 'framer-motion';

const FadeContent = ({ children, blur = false, duration = 800 }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: duration / 1000, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default FadeContent;