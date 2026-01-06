import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, LogOut, Settings, Trophy, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
// import { Card } from './ui/card';

interface UserDropdownProps {
  user: {
    username: string;
    totalWins: number;
    totalAuctions: number;
  };
  onLogout: () => void;
  onNavigate?: (page: string) => void;
}

export function UserDropdown({ user, onLogout, onNavigate }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const updatePosition = () => {
      if (buttonRef.current && isOpen) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right
        });
      }
    };

    if (isOpen) {
      updatePosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleMenuItemClick = (action: string) => {
    setIsOpen(false);
    if (action === 'logout') {
      onLogout();
    } else if (onNavigate) {
      onNavigate(action);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-purple-700 hover:text-purple-800 hover:bg-purple-50 px-3 py-2 rounded-md transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="font-medium">{user.username}</span>
        </button>
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-64 bg-white/95 backdrop-blur-md border border-purple-300 rounded-xl shadow-xl"
          style={{
            top: dropdownPosition.top,
            right: dropdownPosition.right,
            zIndex: 999999
          }}
        >
          <div className="p-4">
            {/* User Info Header */}
            <div className="flex items-center space-x-3 pb-3 border-b border-purple-200">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-purple-800 font-semibold">{user.username}</div>
                <div className="text-purple-600 text-sm">Dream60 Player</div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="py-3 border-b border-purple-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-purple-700 font-semibold">{user.totalWins}</div>
                  <div className="text-purple-600 text-xs">Total Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-700 font-semibold">{user.totalAuctions}</div>
                  <div className="text-purple-600 text-xs">Auctions Joined</div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2 space-y-1">
              <Button
                onClick={() => handleMenuItemClick('profile')}
                variant="ghost"
                className="w-full justify-start text-purple-700 hover:text-purple-800 hover:bg-purple-50"
              >
                <Settings className="w-4 h-4 mr-3" />
                Account Settings
              </Button>

              <Button
                onClick={() => handleMenuItemClick('history')}
                variant="ghost"
                className="w-full justify-start text-purple-700 hover:text-purple-800 hover:bg-purple-50"
              >
                <Trophy className="w-4 h-4 mr-3" />
                Auction History
              </Button>

              <Button
                onClick={() => handleMenuItemClick('support')}
                variant="ghost"
                className="w-full justify-start text-purple-700 hover:text-purple-800 hover:bg-purple-50"
              >
                <HelpCircle className="w-4 h-4 mr-3" />
                Help & Support
              </Button>

              <div className="border-t border-purple-200 pt-2 mt-2">
                <Button
                  onClick={() => handleMenuItemClick('logout')}
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}