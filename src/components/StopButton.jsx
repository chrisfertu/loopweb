import { motion } from 'framer-motion';

const StopButton = ({ onClick }) => (
  <motion.button
    onClick={onClick}
    className="stop-button"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    aria-label="Stop"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  </motion.button>
);

export default StopButton;
