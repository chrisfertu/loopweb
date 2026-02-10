import { motion } from 'framer-motion';

const PlayIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const PlayButton = ({ isPlaying, onClick }) => (
  <motion.button
    onClick={onClick}
    className="play-button"
    whileTap={{ scale: 0.93 }}
    whileHover={{ scale: 1.03 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    aria-label={isPlaying ? 'Pause' : 'Play'}
  >
    {isPlaying ? <PauseIcon /> : <PlayIcon />}
  </motion.button>
);

export default PlayButton;
