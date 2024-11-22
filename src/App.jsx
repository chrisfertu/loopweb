import { useState, useRef, useEffect } from 'react';
import ReactFullpage from '@fullpage/react-fullpage';
import { motion } from 'framer-motion';
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import Slide1 from './components/Slide1';
import Slide2 from './components/Slide2';
import Slide3 from './components/Slide3';

function App() {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0);
  const fullpageApiRef = useRef(null);
  const audioRef = useRef(null);
  const fadeInterval = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTotalSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Initialize audio
    if (audioRef.current) {
      audioRef.current.volume = 0;
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {
        console.log('Autoplay prevented - waiting for user interaction');
      });
    }
  }, []);

  const fadeAudio = (targetVolume) => {
    if (fadeInterval.current) {
      clearInterval(fadeInterval.current);
    }

    const step = 0.02;
    const interval = 50;
    
    fadeInterval.current = setInterval(() => {
      if (audioRef.current) {
        const currentVolume = Number(audioRef.current.volume);
        let newVolume;

        if (targetVolume > currentVolume) {
          newVolume = Math.min(targetVolume, currentVolume + step);
        } else {
          newVolume = Math.max(targetVolume, currentVolume - step);
        }

        audioRef.current.volume = newVolume;
        setAudioVolume(newVolume);

        if (newVolume === targetVolume) {
          clearInterval(fadeInterval.current);
        }
      }
    }, interval);
  };

  const toggleMute = () => {
    const newIsMuted = !isMuted;
    setIsMuted(newIsMuted);
    
    if (audioRef.current) {
      if (!audioRef.current.playing) {
        audioRef.current.play().catch(console.error);
      }
      fadeAudio(newIsMuted ? 0 : 0.5);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const onLeave = (origin, destination) => {
    setCurrentSlide(destination.index);
  };

  const handleSlideChange = (api) => {
    fullpageApiRef.current = api;
  };

  const scrollToSlide = (index) => {
    if (fullpageApiRef.current) {
      fullpageApiRef.current.moveTo(index, {
        duration: 1000,
        easing: 'easeInOutCubic'
      });
    }
  };

  return (
    <>
      {/* Persistent Audio */}
      <audio ref={audioRef} preload="auto">
        <source src="https://res.cloudinary.com/daiq2zvtv/video/upload/v1732277721/meditation_g6tpsj.mp3" type="audio/mp3" />
      </audio>

      {/* Persistent Mute Button */}
      <motion.button
        className="fixed top-6 right-6 text-white/50 hover:text-white/90 transition-colors z-50"
        onClick={toggleMute}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isMuted ? <FaVolumeMute size={24} /> : <FaVolumeUp size={24} />}
      </motion.button>

      {/* Logo */}
      <motion.div
        className="logo-container"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1,
          scale: currentSlide === 0 ? 1 : 0.8,
          y: currentSlide === 0 ? 0 : -10,
          x: '-50%'
        }}
        transition={{
          duration: 0.6,
          ease: [0.43, 0.13, 0.23, 0.96]
        }}
      >
        <div className="flex flex-col items-center">
          <motion.img 
            src="/images/logo.svg" 
            alt="OPUS Loop" 
            className={`transition-all duration-500 ${
              currentSlide === 0 
                ? 'w-20 md:w-24 lg:w-28' 
                : 'w-16 md:w-20 lg:w-24' 
            }`}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
          {currentSlide === 0 && (
            <motion.div 
              className="text-center mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-2">opus loop</h1>
              <p className="text-[0.65rem] md:text-sm text-white/80 tracking-[0.2em] md:tracking-wider whitespace-nowrap">A SIMPLE MEDITATION APP</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      <ReactFullpage
        licenseKey={'YOUR_KEY_HERE'}
        scrollingSpeed={1000}
        onLeave={onLeave}
        afterRender={handleSlideChange}
        easingcss3="cubic-bezier(0.645, 0.045, 0.355, 1.000)"
        render={({ state, fullpageApi }) => {
          return (
            <ReactFullpage.Wrapper>
              <div className="section">
                <Slide1 
                  meditationTime={formatTime(totalSeconds)} 
                  onScrollDown={() => scrollToSlide(2)} 
                />
              </div>
              <div className="section">
                <Slide2 />
              </div>
              <div className="section">
                <Slide3 />
              </div>
            </ReactFullpage.Wrapper>
          );
        }}
      />
    </>
  );
}

export default App;
