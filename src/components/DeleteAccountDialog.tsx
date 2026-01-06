
import { AlertTriangle } from 'lucide-react';

interface DeleteAccountDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteAccountDialog({ onConfirm, onCancel }: DeleteAccountDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-2">
        {/* Warning Header */}
        <div className="relative p-4 sm:p-6 text-center">
          {/* Warning icon */}
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          
          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Delete Account?
          </h1>
          
          {/* Message */}
          <p className="text-sm sm:text-base text-gray-600">
            Are you sure you want to delete your account?
          </p>
        </div>

        {/* Warning Section */}
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 sm:p-6 border border-red-200">
            <div className="text-center">
              <p className="text-sm font-semibold text-red-900 mb-2">
                ⚠️ This action cannot be undone
              </p>
              <p className="text-sm text-red-700">
                All your data, auction history, and account information will be permanently deleted.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl text-sm sm:text-base font-medium transition-all"
          >
            No, Keep My Account
          </button>
          <button
            onClick={onConfirm}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl text-sm sm:text-base font-medium transition-all"
          >
            Yes, Delete Account
          </button>
        </div>

        {/* Bottom Warning */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-red-50 border-t border-red-200">
          <div className="text-center">
            <p className="text-sm text-red-700">
              💔 We're sorry to see you go!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
