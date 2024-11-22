import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSpotify, FaApple } from 'react-icons/fa';

const noiseTypes = ['brown', 'white', 'pink', 'dark'];

const Slide2 = () => {
  const [currentNoiseText, setCurrentNoiseText] = useState(noiseTypes[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentNoiseIndex, setCurrentNoiseIndex] = useState(0);
  const [expandedFeature, setExpandedFeature] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isDeleting) {
        if (currentNoiseText === '') {
          setIsDeleting(false);
          setCurrentNoiseIndex((prev) => (prev + 1) % noiseTypes.length);
        } else {
          setCurrentNoiseText(prev => prev.slice(0, -1));
        }
      } else {
        const nextWord = noiseTypes[currentNoiseIndex];
        if (currentNoiseText === nextWord) {
          setTimeout(() => setIsDeleting(true), 800);
        } else {
          setCurrentNoiseText(nextWord.slice(0, currentNoiseText.length + 1));
        }
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [currentNoiseText, isDeleting, currentNoiseIndex]);

  const handleFeatureInteraction = (featureId, isClick = false) => {
    if (isClick && isMobile) {
      // On mobile, clicking toggles the current feature and closes others
      setExpandedFeature(expandedFeature === featureId ? null : featureId);
    } else if (!isMobile && !isClick) {
      // On desktop, hover behavior remains unchanged
      setExpandedFeature(featureId);
    }
  };

  const features = [
    {
      id: 'sounds',
      title: (
        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            Your meditation sounds (mp3, <FaApple className="inline-block" />, <FaSpotify className="inline-block" />)
          </span>
        </div>
      ),
      description: "Add your own audio backgrounds or guides or stream them from Apple Music and Spotify."
    },
    {
      id: 'noise',
      title: (
        <div className="flex items-center justify-center gap-2">
          <span>Silence, binaural beats & </span>
          <span className="inline-block min-w-[4ch]">{currentNoiseText}</span>
          <span>noise</span>
        </div>
      ),
      description: "Listen to any of the common background sounds that are included or just enjoy the silence."
    },
    {
      id: 'health',
      title: "Apple Health integration",
      description: "Track your mindful minutes with apple health. Keep your streak going or take a break when you need it."
    },
    {
      id: 'subscription',
      title: <span className="text-2xl font-semibold">No subscription</span>,
      description: "Meditation is a tool, not a service, and so is Opus Loop. It's $5 and it's yours."
    }
  ];

  return (
    <div className="slide">
      <div className="flex flex-col md:flex-row w-full h-full">
        {/* Video Section */}
        <div className="relative w-full md:w-1/2 aspect-square">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="https://res.cloudinary.com/daiq2zvtv/video/upload/v1732277722/features-video_inhrsl.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Features Section */}
        <div className="w-full md:w-1/2 h-full flex items-center justify-center p-8">
          <div className="max-w-lg text-center">
            <motion.h1
              className="text-5xl md:text-6xl font-display font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              opus loop
            </motion.h1>
            
            <motion.h2
              className="text-2xl text-text-secondary mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              a simple meditation app
            </motion.h2>

            <motion.ul
              className="space-y-6 mb-12 text-lg md:text-xl list-none"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {features.map((feature) => (
                <li 
                  key={feature.id}
                  className="relative group cursor-pointer"
                  onMouseEnter={() => !isMobile && handleFeatureInteraction(feature.id)}
                  onMouseLeave={() => !isMobile && handleFeatureInteraction(null)}
                  onClick={() => handleFeatureInteraction(feature.id, true)}
                >
                  {feature.title}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ 
                      opacity: expandedFeature === feature.id ? 1 : 0,
                      height: expandedFeature === feature.id ? 'auto' : 0
                    }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-gray-600 mt-2 overflow-hidden"
                  >
                    {feature.description}
                  </motion.div>
                </li>
              ))}
            </motion.ul>

            <div className="flex flex-col items-center gap-2">
              <motion.button
                className="button-primary flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl border border-black"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaApple className="text-2xl" />
                <span>Download on App Store</span>
              </motion.button>
              <span className="text-sm opacity-75">$5 | no subscription</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Slide2;
