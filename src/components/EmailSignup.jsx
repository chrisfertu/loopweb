import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

const EmailSignup = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!supabase) {
        console.log('Development mode: ', { name, email });
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setName('');
          setEmail('');
        }, 2000);
        return;
      }

      const { error: supabaseError } = await supabase
        .from('early_adopters')
        .insert([{ name, email }]);

      if (supabaseError) {
        if (supabaseError.code === '23505') {
          setError('This email is already registered. Thank you for your interest!');
        } else {
          setError('Something went wrong. Please try again.');
        }
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setName('');
        setEmail('');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-black/90 p-8 rounded-lg max-w-md w-full mx-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-white/50 hover:text-white/90 transition-colors"
              >
                <FaTimes />
              </button>

              {/* Content */}
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <h3 className="text-3xl font-bold mb-4">Thank you!</h3>
                  <p className="text-white/70 text-lg">
                    We'll notify you when OPUS Loop launches.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold mb-4">Stay Updated</h2>
                    <p className="text-white/70 text-lg">
                      One email when we launch. That's it.
                    </p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <input
                        ref={nameInputRef}
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-lg placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
                        required
                      />
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-lg placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
                        required
                      />
                    </div>
                    {error && (
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    )}
                    {!supabase && (
                      <p className="text-yellow-400 text-sm text-center">
                        Running in development mode - emails will not be stored
                      </p>
                    )}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-white text-black rounded-xl py-4 text-lg font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSubmitting ? 'Submitting...' : 'Notify Me'}
                    </motion.button>
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmailSignup;
