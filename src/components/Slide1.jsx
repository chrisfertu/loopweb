import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaChevronDown, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import EmailSignup from './EmailSignup';

const Slide1 = ({ meditationTime, fullpageApi, isMuted, onToggleMute }) => {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const handleVideoError = (error) => {
    console.error('Video loading error:', error);
    setVideoError(true);
  };

  return (
    <div className="slide bg-black min-h-screen">
      {/* Logo */}
      <motion.div 
        className="absolute top-4 left-4 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <img 
          src="/images/logo.svg"
          alt="OPUS Loop Logo" 
          className="h-8 w-auto"
        />
      </motion.div>

      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <video
          className="video-background"
          autoPlay
          loop
          muted={isMuted}
          playsInline
          loading="lazy"
          onError={handleVideoError}
        >
          <source src="https://res.cloudinary.com/daiq2zvtv/video/upload/v1732277724/meditation-bg_gtfnrq.mp4" type="video/mp4" />
        </video>
      </div>
      
      {/* Overlay */}
      <div className="video-overlay bg-black/50" />
      
      {/* Content */}
      <div className="relative z-10 w-full h-screen flex flex-col items-center justify-center">
        {/* Debug Info */}
        {videoError && (
          <div className="absolute top-4 left-4 bg-red-500 text-white p-2 rounded">
            Video failed to load
          </div>
        )}
        
        {/* Timer */}
        <motion.div
          className="font-mono text-5xl md:text-6xl lg:text-7xl font-bold tracking-wider text-white mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {meditationTime}
        </motion.div>

        {/* Mute Button */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <button
            onClick={onToggleMute}
            className={`p-3 rounded-full ${
              isMuted ? 'bg-white/20' : 'bg-white'
            } transition-colors`}
          >
            {isMuted ? (
              <FaVolumeMute className={isMuted ? 'text-white' : 'text-black'} size={24} />
            ) : (
              <FaVolumeUp className={isMuted ? 'text-white' : 'text-black'} size={24} />
            )}
          </button>
        </motion.div>
        
        {/* Button Container */}
        <motion.div 
          className="absolute bottom-32 w-full max-w-xs mx-auto px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {/* Notify Button */}
          <motion.button
            className="animated-button w-full"
            onClick={() => setIsEmailOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="border-line"></div>
            <div className="border-line"></div>
            <div className="border-line"></div>
            <div className="border-line"></div>
            <div className="button-content">
              <FaBell className="text-xl" />
              <span className="tracking-wide">Notify me at launch</span>
            </div>
          </motion.button>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-12 md:bottom-16 flex flex-col items-center text-text-secondary cursor-pointer hover:text-white/90 transition-colors"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          onClick={() => fullpageApi.moveTo(2)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-sm mb-2">Scroll for more</span>
          <FaChevronDown />
        </motion.div>
      </div>

      {/* Email Signup Modal */}
      <EmailSignup isOpen={isEmailOpen} onClose={() => setIsEmailOpen(false)} />
    </div>
  );
};

export default Slide1;