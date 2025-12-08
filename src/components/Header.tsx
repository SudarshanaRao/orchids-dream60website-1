import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Trophy, Clock, Menu, X, User, LogOut, Shield, FileText, History, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  user?: {
    username: string;
    totalWins: number;
    totalAuctions: number;
  } | null;
  onNavigate?: (page: string) => void;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function Header({ user, onNavigate, onLogin, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const overlayVariants = {
    hidden: {
      opacity: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as any }
    },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as any }
    }
  };


  const menuVariants = {
    hidden: {
      scale: 0.95,
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: [0.6, -0.05, 0.01, 0.99] as any,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.6, -0.05, 0.01, 0.99] as any,
        when: "beforeChildren",
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };


  const menuItemVariants = {
    hidden: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 }
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <>
      <motion.header
        className="bg-white/70 backdrop-blur-xl border-b border-purple-200/50 shadow-lg shadow-purple-500/5 sticky top-0 z-50 overflow-hidden"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.6, -0.05, 0.01, 0.99] }}
      >
        {/* Animated shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "easeInOut"
          }}
        />

        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 relative">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => onNavigate?.('home')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                whileHover={{
                  scale: 1.05,
                  rotate: 5,
                  transition: { duration: 0.2 }
                }}
              >
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </motion.div>
              <div className="min-w-0">
                <motion.h1
                  className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent truncate"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  Dream60
                </motion.h1>
                <motion.p
                  className="text-[10px] sm:text-xs hidden sm:block 
  bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC]
  bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  Live Auction Game
                </motion.p>

              </div>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-purple-700 p-2.5 hover:bg-purple-50/80 rounded-xl transition-all relative z-10 backdrop-blur-sm border border-purple-200/50 shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Desktop Navigation & User Area */}
            <motion.div
              className="hidden lg:flex items-center space-x-3 xl:space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {user ? (
                <>
                  {/* User Stats */}
                  <motion.div
                    className="hidden xl:flex items-center space-x-3 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-purple-200/50 shadow-md shadow-purple-500/5"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="flex items-center space-x-2"
                      whileHover={{ x: 2 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Trophy className="w-4 h-4 text-purple-600" />
                      </motion.div>
                      <span className="text-sm font-medium text-purple-700">{user.totalWins} Wins</span>
                    </motion.div>
                    <div className="w-px h-5 bg-purple-300"></div>
                    <motion.div
                      className="flex items-center space-x-2"
                      whileHover={{ x: 2 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Coins className="w-4 h-4 text-purple-600" />
                      </motion.div>
                      <span className="text-sm font-medium text-purple-700">{user.totalAuctions} Joined</span>
                    </motion.div>
                  </motion.div>

                  {/* Navigation Links */}
                  <div className="flex items-center space-x-1.5">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => onNavigate?.('rules')}
                        variant="ghost"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50/80 transition-all"
                        size="sm"
                      >
                        <FileText className="w-4 h-4 mr-1.5" />
                        Rules
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => onNavigate?.('participation')}
                        variant="ghost"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50/80 hidden xl:flex transition-all"
                        size="sm"
                      >
                        <Shield className="w-4 h-4 mr-1.5" />
                        Participation
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => onNavigate?.('support')}
                        variant="ghost"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50/80 transition-all"
                        size="sm"
                      >
                        Support
                      </Button>
                    </motion.div>
                  </div>

                  {/* User Profile Button */}
                  <motion.button
                    onClick={() => onNavigate?.('profile')}
                    className="flex items-center space-x-2 text-purple-700 hover:text-purple-800 bg-white/70 hover:bg-purple-50/80 px-3 py-2 rounded-xl transition-all border border-purple-200/50 shadow-md shadow-purple-500/5 backdrop-blur-sm"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="w-8 h-8 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-full flex items-center justify-center shadow-md"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <span className="text-white text-sm font-semibold">{user.username.charAt(0).toUpperCase()}</span>
                    </motion.div>
                    <span className="font-medium text-sm">{user.username}</span>
                  </motion.button>
                </>
              ) : (
                /* Guest Navigation */
                <div className="flex items-center space-x-1.5">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => onNavigate?.('rules')}
                      variant="ghost"
                      className="rounded-xl text-purple-600 hover:text-purple-700 hover:bg-purple-100/90 transition-all"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-1.5" />
                      Rules
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => onNavigate?.('participation')}
                      variant="ghost"
                      className="rounded-xl text-purple-600 hover:text-purple-700 hover:bg-purple-100/90 hidden xl:flex transition-all"
                      size="sm"
                    >
                      How to Play
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => onNavigate?.('support')}
                      variant="ghost"
                      className="rounded-xl text-purple-600 hover:text-purple-700 hover:bg-purple-100/90 transition-all"
                      size="sm"
                    >
                      Support
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={onLogin}
                      size="lg"
                      className="
                        rounded-xl
                        bg-gradient-to-r from-[#5E3A8A] via-[#7A4FB0] to-[#9A6ED6]
                        text-white font-semibold
                        hover:from-[#7A4FB0] hover:to-[#9A6ED6]
                        shadow-xl shadow-[#9A6ED6]/30
                        transition-all duration-300
                        hover:scale-[1.02]
                      "
                    >
                      Login
                    </Button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Popup */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Popup Menu */}
            <motion.div
              className="fixed inset-x-0 top-0 z-[70] lg:hidden flex items-start justify-center pt-10 px-4 pointer-events-none"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.div
                className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-500/20 border border-purple-200/50 overflow-hidden pointer-events-auto relative"
                variants={menuVariants}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"
                  initial={{ x: '-100%', y: '-100%' }}
                  animate={{ x: '100%', y: '100%' }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                />

                {/* Header with Logo and Back Button */}
                <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-4 pb-6">
                  {/* Back Button */}
                  <motion.button
                    onClick={() => { onNavigate?.('home'); setMobileMenuOpen(false); }}
                    className="flex items-center gap-1.5 text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm px-2.5 py-1.5 rounded-xl transition-all mb-3 border border-white/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back</span>
                  </motion.button>

                  <motion.div
                    className="flex items-center justify-center space-x-3"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-xl"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.3,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                    >
                      <Clock className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Dream60</h2>
                      <p className="text-xs text-purple-200">Live Auction Game</p>
                    </div>
                  </motion.div>

                  {/* User Info or Welcome */}
                  {user && (
                    <motion.div
                      className="mt-4 flex items-center justify-center space-x-3 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20"
                      variants={menuItemVariants}
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{user.username}</p>
                        <div className="flex items-center space-x-3 text-xs text-purple-200">
                          <span className="flex items-center">
                            <Trophy className="w-3 h-3 mr-1" />
                            {user.totalWins} Wins
                          </span>
                          <span className="flex items-center">
                            <Coins className="w-3 h-3 mr-1" />
                            {user.totalAuctions} Joined
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Menu Items */}
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto relative">
                  {user ? (
                    <>
                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('rules'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Rules</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('participation'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Shield className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Participation</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('support'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Shield className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Support</span>
                        </button>
                      </motion.div>

                      {/* Divider */}
                      <div className="border-t border-purple-200/50 my-3"></div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('history'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <History className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Auction History</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('profile'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <User className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Profile Settings</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onLogout?.(); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <LogOut className="w-5 h-5 text-red-600" />
                          </div>
                          <span className="font-medium text-red-700">Logout</span>
                        </button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('rules'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Rules</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('participation'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Shield className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">How to Play</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('support'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Shield className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Support</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants} className="pt-2">
                        <Button
                          onClick={() => { onLogin?.(); setMobileMenuOpen(false); }}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 shadow-lg shadow-purple-500/30 py-6 rounded-xl"
                        >
                          Login to Continue
                        </Button>
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
