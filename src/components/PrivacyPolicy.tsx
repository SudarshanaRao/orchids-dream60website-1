import { ArrowLeft, Shield, Eye, Lock, Database, Server, Globe, AlertCircle, FileText, Users, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'motion/react';


interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      

      {/* Header with Logo */}
      <motion.header 
        className="bg-white/95 backdrop-blur-md border-b border-purple-200 shadow-sm sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div className="w-px h-6 bg-purple-300 hidden sm:block"></div>
              <div className="hidden sm:flex items-center space-x-2">
                <Shield className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-purple-800">Privacy Policy</h1>
              </div>
            </div>
            
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={onBack}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">Dream60</h2>
                <p className="text-[10px] text-purple-600">Live Auction Platform</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        {/* Mobile Title */}
        <motion.div 
          className="sm:hidden flex items-center space-x-2 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Shield className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-purple-800">Privacy Policy</h1>
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Privacy Promise */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start space-x-3">
                <Lock className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-green-800 mb-2">Our Privacy Promise</h3>
                  <p className="text-sm sm:text-base text-green-700">
                    Dream60 is committed to protecting the privacy of our Indian users. 
                    We collect only information necessary to provide secure auction services and comply with local regulations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Introduction */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
              <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>Introduction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
              <p>
                Finpages Tech Private Limited operates the Dream60 platform in India. This privacy policy describes how we collect, use, and share your personal information.
              </p>
              <p>
                By using Dream60, you consent to the data practices described in this policy. We ensure compliance with the Information Technology Act, 2000 and other relevant Indian data protection laws.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
              <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                <Database className="w-5 h-5 text-purple-600" />
                <span>Information We Collect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 text-sm sm:text-base">
              <p className="text-purple-700">
                To participate in auctions, we require specific information to verify your identity and process payments securely in INR (₹).
              </p>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                <h3 className="font-semibold text-purple-800 mb-2">Required Information</h3>
                <ul className="list-disc list-inside space-y-1 text-purple-700 text-sm">
                  <li>Full Name</li>
                  <li>Indian Mobile Number (for OTP verification)</li>
                  <li>Email Address</li>
                  <li>Residential Address in India</li>
                  <li>PAN Card Details (for prize verification and tax compliance)</li>
                  <li>Payment details (processed securely via India's trusted payment gateway)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
              <CardTitle className="text-lg sm:text-xl text-green-800 flex items-center space-x-2">
                <Server className="w-5 h-5 text-green-600" />
                <span>How We Use Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 text-sm sm:text-base">
              <div className="space-y-3">
                <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                  <h4 className="font-semibold text-purple-800 mb-2">Service Provision</h4>
                  <p className="text-purple-700 text-sm">
                    We use your info to manage your account, process entry fees and bids via India's trusted payment gateway, calculate auction winners, and deliver Amazon Vouchers.
                  </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                  <h4 className="font-semibold text-green-800 mb-2">Security & Verification</h4>
                  <p className="text-green-700 text-sm">
                    Verifying Indian residency and age (18+) is crucial for maintaining platform integrity and fulfilling legal requirements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-white border-b border-yellow-100">
              <CardTitle className="text-lg sm:text-xl text-yellow-800 flex items-center space-x-2">
                <Lock className="w-5 h-5 text-yellow-600" />
                <span>Data Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
              <p>
                We implement industry-standard encryption and security protocols. All financial transactions are handled by India's trusted payment gateway, ensuring your bank/UPI details never touch our servers directly.
              </p>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="bg-white border-purple-300 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-purple-700 mb-4">Contact Us:</h3>
                <p className="text-sm sm:text-base text-gray-700 mb-3">
                  For privacy-related queries, reach out to our Grievance Officer at:{' '}
                  <a 
                    href="mailto:support@dream60.com" 
                    className="text-purple-700 font-semibold underline hover:text-purple-800"
                  >
                    support@dream60.com
                  </a>
                </p>
                <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r">
                  <p className="text-sm sm:text-base text-gray-700 font-semibold">Grievance Officer, Dream60 Team</p>
                  <p className="text-sm sm:text-base text-gray-700">Finpages Tech Private Limited,</p>
                  <p className="text-sm sm:text-base text-gray-700">#709, Gowra Fountainhead,</p>
                  <p className="text-sm sm:text-base text-gray-700">Hitech City, Madhapur, Hyderabad,</p>
                  <p className="text-sm sm:text-base text-gray-700">Telangana - 500081.</p>
                </div>
                <p className="text-sm text-purple-600 mt-4 font-semibold">Last updated: December 21, 2025</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
