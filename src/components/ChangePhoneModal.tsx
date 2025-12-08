import  { useState } from 'react';
import { X, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ChangePhoneModalProps {
  currentPhone: string;
  onClose: () => void;
  onSubmit: (newPhone: string) => void;
}

export function ChangePhoneModal({ currentPhone, onClose, onSubmit }: ChangePhoneModalProps) {
  const [newPhone, setNewPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPhone && newPhone !== currentPhone) {
      onSubmit(newPhone);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border-2 border-purple-200">
        <div className="flex items-center justify-between p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-purple-900">Change Phone Number</h2>
          </div>
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPhone" className="text-sm font-medium text-purple-900">
              Current Phone Number
            </Label>
            <Input
              id="currentPhone"
              type="tel"
              value={currentPhone}
              disabled
              className="bg-purple-50 border-purple-300 text-purple-700 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPhone" className="text-sm font-medium text-purple-900">
              New Phone Number
            </Label>
            <Input
              id="newPhone"
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Enter new phone number"
              className="border-purple-300 focus:border-purple-600 focus:ring-purple-600"
              required
            />
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-sm text-purple-700">
              <span className="font-medium">Note:</span> You will receive an OTP verification code on your new phone number via SMS to confirm the change.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
            >
              Continue
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
