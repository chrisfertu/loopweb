import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Slide1 from './components/Slide1';
import Slide2 from './components/Slide2';
import Slide3 from './components/Slide3';
import FullscreenScroll from './components/FullscreenScroll';
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';

function App() {
  const [meditationTime, setMeditationTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Auto-play prevented:', error);
        });
      }
      audioRef.current.volume = 0.5;
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying) {
        setMeditationTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const MuteButton = () => (
    <button
      onClick={toggleMute}
      className={`p-3 rounded-full ${
        isMuted ? 'bg-white/20' : 'bg-white'
      } transition-colors`}
    >
      {isMuted ? (
        <FaVolumeMute className={isMuted ? 'text-white' : 'text-black'} />
      ) : (
        <FaVolumeUp className={isMuted ? 'text-white' : 'text-black'} />
      )}
    </button>
  );

  const logoVariants = {
    initial: {
      y: 0,
      scale: 1,
      top: '6rem'
    },
    scrolled: {
      y: 0,
      scale: 0.5,
      top: '1rem'
    }
  };

  const headingVariants = {
    initial: {
      opacity: 1,
      y: 0
    },
    scrolled: {
      opacity: 0,
      y: -20
    }
  };

  return (
    <div className="relative">
      {/* Logo Section - Fixed above all slides */}
      <motion.div
        className="fixed w-full z-50 flex flex-col items-center"
        initial="initial"
        animate={currentSection > 0 ? "scrolled" : "initial"}
        transition={{ 
          duration: 1,
          ease: [0.16, 1, 0.3, 1], 
          delay: 0.1
        }}
      >
        <motion.img 
          variants={logoVariants}
          src="/images/logo.svg"
          alt="OPUS Loop Logo" 
          className="absolute h-20 md:h-24 w-auto"
        />
        <motion.div
          variants={headingVariants}
          className="absolute top-48 md:top-52 text-center"
        >
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-2 lowercase">opus loop</h1>
          <p className="text-white/80 text-base md:text-lg lowercase">a simple meditation app</p>
        </motion.div>
      </motion.div>

      {/* Background Audio */}
      <audio ref={audioRef} loop>
        <source src="https://res.cloudinary.com/daiq2zvtv/video/upload/v1732277721/meditation_g6tpsj.mp3" type="audio/mp3" />
      </audio>

      {/* Meditation Controls - Only show on slides 2 and 3 */}
      {currentSection > 0 && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-4">
          <div className="text-white bg-black/50 px-4 py-2 rounded-full">
            {formatTime(meditationTime)}
          </div>
          <MuteButton />
        </div>
      )}

      <FullscreenScroll onSectionChange={setCurrentSection}>
        <Slide1
          meditationTime={formatTime(meditationTime)}
          fullpageApi={null}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          currentSection={currentSection}
        />
        <Slide2 />
        <Slide3 />
      </FullscreenScroll>
    </div>
  );
}

export default App;
