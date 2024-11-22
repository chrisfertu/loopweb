import { useState, useRef, useEffect } from 'react';
import ReactFullpage from '@fullpage/react-fullpage';
import Slide1 from './components/Slide1';
import Slide2 from './components/Slide2';
import Slide3 from './components/Slide3';
import { FaBell } from 'react-icons/fa';

function App() {
  const [meditationTime, setMeditationTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="App">
      {/* Background Audio */}
      <audio ref={audioRef} loop>
        <source src="https://res.cloudinary.com/daiq2zvtv/video/upload/v1732277721/meditation_g6tpsj.mp3" type="audio/mp3" />
      </audio>

      {/* Meditation Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-4">
        <div className="text-white bg-black/50 px-4 py-2 rounded-full">
          {formatTime(meditationTime)}
        </div>
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${
            isMuted ? 'bg-white/20' : 'bg-white'
          } transition-colors`}
        >
          <FaBell className={isMuted ? 'text-white' : 'text-black'} />
        </button>
      </div>

      <ReactFullpage
        licenseKey={'YOUR_KEY_HERE'}
        scrollingSpeed={1000}
        render={({ state, fullpageApi }) => {
          return (
            <ReactFullpage.Wrapper>
              <div className="section">
                <Slide1
                  meditationTime={meditationTime}
                  fullpageApi={fullpageApi}
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
    </div>
  );
}

export default App;
