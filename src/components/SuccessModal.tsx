import React from 'react';
import { Check, X } from 'lucide-react';

interface SuccessModalProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  onClose: () => void;
}

export function SuccessModal({ 
  title, 
  message, 
  icon,
  onClose 
}: SuccessModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-2">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="relative p-4 sm:p-6 text-center">
          {/* Success checkmark */}
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <Check className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          
          {/* Title */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {icon && <div className="text-purple-600">{icon}</div>}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {title}
            </h1>
          </div>
          
          {/* Message */}
          <p className="text-sm sm:text-base text-gray-600">
            {message}
          </p>
        </div>

        {/* Success Badge */}
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 sm:p-6 text-center border border-purple-200">
            <div className="inline-flex items-center bg-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-medium">
              <Check className="w-4 h-4 mr-1.5" />
              COMPLETED SUCCESSFULLY
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-center">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 sm:py-3 px-8 sm:px-12 rounded-xl text-sm sm:text-base font-medium hover:from-purple-500 hover:to-purple-600 transition-all"
          >
            Got it!
          </button>
        </div>

        {/* Success Message */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-purple-50 border-t border-purple-200">
          <div className="text-center">
            <p className="text-sm text-purple-700">
              🎉 Your changes have been saved successfully!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
