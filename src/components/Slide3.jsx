import { motion } from 'framer-motion';
import { FaTwitter, FaGithub, FaEnvelope } from 'react-icons/fa';

const Slide3 = () => {
  return (
    <div className="slide">
      <div className="flex flex-col md:flex-row w-full h-full">
        {/* Links Section */}
        <div className="w-full md:w-1/2 h-full flex items-center justify-center p-8">
          <div className="max-w-lg">
            <motion.h2
              className="text-3xl font-display font-bold mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Connect with us
            </motion.h2>
            
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <a
                href="https://twitter.com/opusloop"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-text-secondary hover:text-text-primary transition-colors"
              >
                <FaTwitter className="text-xl" />
                <span>Follow us on Twitter</span>
              </a>
              
              <a
                href="https://github.com/opusloop"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-text-secondary hover:text-text-primary transition-colors"
              >
                <FaGithub className="text-xl" />
                <span>Star us on GitHub</span>
              </a>
              
              <a
                href="mailto:hello@opusloop.com"
                className="flex items-center gap-4 text-text-secondary hover:text-text-primary transition-colors"
              >
                <FaEnvelope className="text-xl" />
                <span>Contact us</span>
              </a>
            </motion.div>
          </div>
        </div>

        {/* Text Section */}
        <div className="w-full md:w-1/2 h-full flex items-center justify-center p-8">
          <motion.div
            className="max-w-lg space-y-6 text-text-secondary"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p>
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Slide3;
