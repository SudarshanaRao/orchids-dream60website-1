import { ArrowLeft, Shield, Eye, Lock, Database, Server, Globe, AlertCircle, FileText, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'motion/react';
import { AnimatedBackground } from './AnimatedBackground';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <motion.header 
        className="bg-white/95 backdrop-blur-md border-b border-purple-200 shadow-sm relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
            <div className="w-px h-6 bg-purple-300"></div>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-purple-800">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
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
                    Dream60 is committed to protecting your privacy and personal information. 
                    We collect only what's necessary to provide our auction services and never sell your data.
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
                Finpages tech private limited operates the portal in India, which offers fantasy stock trading games through the web-portal Dream60 app. and partner website(s) and mobile application(s) (collectively referred to as the "Portal") (Finpages tech private limited, its affiliates, group companies, parent and subsidiary shall collectively be referred to herein as "Dream60" or "we" or "our").
              </p>
              <p>
                Any person utilizing the Portal ("User" or "you" or "your") or any of its features including participation in the various contests and games ("Game" or "Services") being conducted on the Portal shall be bound by the terms of this privacy policy ("Privacy Policy" or "Policy").
              </p>
              <p>
                All capitalized terms not defined herein shall have the meaning ascribed to them in the terms and conditions of the Portal ("Term").
              </p>
              <p>
                We respects the privacy of our Users and we are committed to protect it in all respects. With a view to offer an enriching and holistic internet experience to our Users, we offers a vast repository of Services. You are hereby advised to read this Policy carefully and fully understand the nature and purpose of gathering and/or collecting any sensitive, personal and other information and the usage, disclosure and sharing of such information
              </p>
              <p>
                Your use of any part of the Portal indicates your acceptance of this Privacy Policy and of the collection, use and disclosure of your personal information in accordance with this Privacy Policy. Further, while you have the option not to provide us with certain information, withdraw your consent to collect certain information, request temporary suspension of collection of information or request deletion of information collected, kindly note that in such an event you may not be able to take full advantage of the entire scope of features and services offered to you and we reserve the right not to provide you with our services.
              </p>
              <p>
                We may periodically review and change our Privacy Policy to incorporate such future changes as may be considered appropriate. We will notify you of the change. Further, Any changes to our Privacy Policy will be posted on this page, so you are always aware of what information we collect, how we use it, how we store it and under what circumstances we disclose it
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
              <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                <Database className="w-5 h-5 text-purple-600" />
                <span>Information Provided by You</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 text-sm sm:text-base">
              <p className="text-purple-700">
                We collect and use the personal information provided by you (any information that may be used to identify you that is not otherwise publicly available) ("Personal Information"), including but not limited to, your first and last name, gender, age etc., your contact details such as your email address, postal addresses, telephone (mobile or otherwise) and/or fax numbers or other contact information. we may also collect certain financial information that may qualify as Sensitive Personal Information ("SPI") such as information regarding the payment instrument/modes used by you to make such payments, which may include cardholder name, credit/debit card number with expiration date, banking details, wallet details etc
              </p>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                <h3 className="font-semibold text-purple-800 mb-2">Required Information for Registration</h3>
                <ul className="list-disc list-inside space-y-1 text-purple-700 text-sm">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Mobile number</li>
                  <li>Permanent Account Number (PAN)</li>
                  <li>Date of Birth</li>
                  <li>Gender</li>
                  <li>Address</li>
                </ul>
              </div>

              <p className="text-purple-700">
                We may require you to provide additional details, as and when required, in order to comply with any applicable regulatory requirement or for additional services/products offered via the Portal, as and when offered. In the course of providing you with access to the Services, and in order to provide you access to the features offered through the Portal and to verify your identity, you may be required to furnish additional information, including Know Your Customer (KYC) information and bank account details.
              </p>

              <p className="text-purple-700">
                Except for any financial information that you choose to provide while making payment for any Services on the Portal, Dream60 does not collect any other SPI in the course of providing the Services. Any SPI collected by Dream60 shall not be disclosed to any third party without your express consent, save as otherwise set out in this Privacy Policy or as provided in a separate written agreement between Dream60 and you or as required by law. It is clarified that this condition shall not apply to publicly available information, including SPI, in relation to you on the Portal.
              </p>
            </CardContent>
          </Card>

          {/* Express Consent */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
              <CardTitle className="text-lg sm:text-xl text-blue-800 flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Express Consent</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
              <p>
                While providing any information via the Portal, including but not limited to Personal Information as mentioned herein above, you expressly consent to Dream60, our affiliates and our group companies (including its marketing channels and business partners) to contact you through SMS, call and/or e-mail and to follow up with regard to the Services / Games provided through the Portal, for imparting product knowledge, offering promotional offers running on the Portals & various other offers/services by our affiliates, our group companies and business partners.
              </p>
              <p>
                In the course of providing the Services, Users may invite other existing Users or other users ("Invited Users") to participate in any of the Services by through any social media platform including without limitation, Facebook, WhatsApp, Instagram etc. Dream60 may thereafter use this information to contact the Invited User and invite such user to register with Dream60 (if such Invited User is not an existing User) and participate in the Game in relation to which such person was invited by the User. The participation of the Invited User in any of the Game shall be subject to the terms of this Privacy Policy and the Terms and Conditions for the use of the Portal. The User hereby represents that the Invited Users have consented and agreed to such disclosure of their information with us, our affiliates and our group companies. User may also choose to invite their friends by syncing their phonebook and inviting them directly from the Portal to play the Game and utilize the Services.
              </p>
              <p>
                You may withdraw your consent to submit any or all Personal Information or decline to provide any permissions on its Portal as covered above at any time. In case, you choose to do so then your access to the Portal may be limited, or we might not be able to provide the services to you. You may withdraw your consent by writing to Helpdesk.
              </p>
            </CardContent>
          </Card>

          {/* Information Automatically Collected */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-white border-b border-yellow-100">
              <CardTitle className="text-lg sm:text-xl text-yellow-800 flex items-center space-x-2">
                <Server className="w-5 h-5 text-yellow-600" />
                <span>Information Automatically Collected</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
              <p>
                When you browse through the Portal we may collect information relating to your use of our Portal such as your IP address, browser type, mobile operating system, manufacturer and model of your mobile device/computer, access time and time spent, and anonymized statistical data. We may also collect information about the screens/pages you view within our Portal and other actions you take while using our Portal.
              </p>
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
                  <h4 className="font-semibold text-purple-800 mb-2">For Registration</h4>
                  <p className="text-purple-700 text-sm">
                    We will use the information including Personal Information provided by you to register you on our Portal and create an account that you can use to avail the Services. We will be using the information for the purpose of providing services, including but not limited to the following services requested by the User. Communicating through SMS, call and/or e-mail with you about the Service Keep you informed of the transaction status; send notification of any updates or changes in Services; allow our customer service to contact you, if necessary; customize the content of our Portal; validate/authenticate your account and to prevent any misuse or abuse. to contact you upon your request, or to respond to your query reach out to you about the services offered by our affiliates and our group entities to improve our Services
                  </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                  <h4 className="font-semibold text-green-800 mb-2">Marketing</h4>
                  <p className="text-green-700 text-sm">
                    Dream60 (including its marketing channels and business partners) may use your information to contact you through SMS, call and/or e-mail to provide information about additional offerings such as promotional offers running on the Portals & various other offers/services by our business partners.
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <h4 className="font-semibold text-blue-800 mb-2">Advertising</h4>
                  <p className="text-blue-700 text-sm">
                    We share with advertisers and/or merchant partners ("Advertisers") anonymized aggregate data of users who will see their advertisements and/or promotional offers. You agree that we may provide any of the information we have collected from you in non-personally identifiable form to an Advertiser, in order for that Advertiser to select the appropriate audience for those advertisements and/or offers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-white border-b border-yellow-100">
              <CardTitle className="text-lg sm:text-xl text-yellow-800 flex items-center space-x-2">
                <Globe className="w-5 h-5 text-yellow-600" />
                <span>Information Sharing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
              <p>
                We may need to share limited Personal Information with our affiliates, group companies, partners to enable them to to reach out to You in relation to the products and services offered by them. We may also share your information with third party service providers who perform services for us and help us operate our business, for the purpose of data analytics storage, and improving services (including product enhancements) provided by Dream60. Provided that affiliate, group entity and third party service provider (as may be applicable) with whom the information is shared will be required, on best efforts basis, to comply with the same standards as applicable to Dream60 in relation to maintaining the security of the information.
              </p>
              <p>
                Where we propose to use your SPI for any other uses, we will ensure that we notify you first.
              </p>
              <p>
                By using the Portal, you hereby expressly agree and grant consent to the collection, use and storage of this information by Dream60. Dream60 reserves the right to share, disclose and transfer information collected hereunder with its own affiliates and group companies.
              </p>
              <p>
                In the event Dream60 sells or transfers all or a portion of its business assets, consumer information may be one of the business assets that are shared, disclosed or transferred as part of the transaction. You hereby expressly grant consent and permission to Dream60 for disclosure and transfer of information to such third parties. Dream60 may share information as provided by you and data concerning usage of the Services and participation in the Game with its commercial partners for the purpose of facilitating user engagement, for marketing and promotional purposes and other related purposes
              </p>
              <p>
                Dream60 may also share such information with affiliates, our group companies and third parties in limited circumstances, including for the purpose complying with legal process, preventing fraud or imminent harm, and ensuring the security of our network and services. However, we do not share any information with third parties for soliciting products and services offered by them.
              </p>
            </CardContent>
          </Card>

          {/* Information Security */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
              <CardTitle className="text-lg sm:text-xl text-green-800 flex items-center space-x-2">
                <Lock className="w-5 h-5 text-green-600" />
                <span>Information Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
              <p>
                All information gathered on Dream60 is securely stored within Dream60 controlled database. The database is stored on servers secured behind a firewall; access to such servers being password-protected and strictly limited based on need-to-know basis. However, we understand that as effective as our security measures are, no security system is impenetrable. Thus, we cannot guarantee the security of our database, nor can we guarantee that information you supply will not be intercepted while being transmitted to us over the Internet. Further, any information you include in a posting to the discussion areas will be available to anyone with Internet access. By using the Portal, you understand and agree that your information may be used in or transferred to countries other than India.
              </p>
            </CardContent>
          </Card>

          {/* Additional Terms */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
              <CardTitle className="text-lg sm:text-xl text-purple-800">Additional Privacy Terms</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 text-sm sm:text-base text-purple-700">
              <div>
                <h3 className="font-bold text-purple-800 mb-2">Log Files</h3>
                <p>
                  This information may include Internet Protocol (IP) addresses, browser type, Internet Service Provider (ISP), referring/exit pages, operating system, date/time stamp, and/or clickstream data. We may use the collected log information about you to improve services offered to you, to improve marketing, analytics, or Portal functionality.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-purple-800 mb-2">Links</h3>
                <p>
                  Dream60 also includes links to other websites. Such websites are governed by their respective privacy policies, which are beyond Dream60's control. Once the User leaves Dream60's servers (the User can tell where he/she is by checking the URL in the location bar on the User's browser), use of any information provided by the User is governed by the privacy policy of the operator of the site which the User is visiting. That policy may differ from Dream60's own. If the User can't find the privacy policy of any of these sites via a link from the site's homepage, the User may contact the site directly for more information. Dream60 is not responsible for the privacy practices or the content of such websites.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-purple-800 mb-2">Confidentiality of your account</h3>
                <p>
                  You are solely responsible for maintaining the security of your account and must not provide your credentials including any password, security pin etc. if assigned to you for the Portal itself to any third party. We are not responsible or liable if someone else accesses your account through the credentials they have obtained from you or through a violation by you of this Privacy Policy.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-purple-800 mb-2">Cookies</h3>
                <p className="mb-2">
                  We use "cookies" that are text files containing small amounts of information which are downloaded to your device when you visit a website, in order to provide a personalized browsing experience. These cookies help the Portal identify unique users, unique sessions, gather information and store information. No Personally Information is retrieved or stored. The only Personal Information that a cookie can contain is information supplied by the User.
                </p>
                <p className="mb-2">
                  Dream60's advertisers may also assign their own cookies to the User's browser (if the User clicks on their ad banners), a process that Dream60 does not control. Dream60 and its affiliates are not responsible for cookies placed in the device of Users by any other website and information collected thereto
                </p>
                <p>
                  Cookies allow users to navigate between pages efficiently, remembering their preferences, and generally improving their browsing experience. These cookies collect information analytics about how users use a website, for instance, often visited pages, time spent on each page etc. All information collected by third party cookies is aggregated and therefore anonymous. By using the Portal, the user agrees that these types of cookies can be placed on his / her device. The user is free to disable/ delete these cookies by changing his / her web browser settings.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-purple-800 mb-2">Data Retention</h3>
                <p>
                  We will retain your information for as long as it is necessary for the purpose for which the information was collected or the information is required to be retained by applicable law, regulations, or contractual obligations, whichever is later.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-purple-800 mb-2">Account and Data Deletion</h3>
                <p className="mb-2">
                  Users are entitled to request Dream60 to delete their User accounts and their Personal Information by sending an email with their written request by writing to Helpdesk. ("Termination Request"). Dream60 will comply with all Termination Requests promptly and in any event within one month of the receipt of the Termination Request or receipt of any additional information sought by Dream60 to enable Dream60 to comply with the Termination Request. Provided however (i) there may be delays between when you request deletion and when copies are deleted from our active and backup systems; and (ii) we will continue to retain any information (including SPI) required to be retained by us as per any applicable laws.
                </p>
                <p>
                  However, Dream60 reserves the right to continue to use your anonymized data, post termination of your account, aggregated or in combination with anonymized data of other users. We use this aggregated anonymized data for data analysis, profiling and research purposes. We may keep your contact information along with your application details (if any) for fraud prevention purposes and for the exercise/ defense of a legal claim or for providing evidence in legal proceeding(s) if required.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-purple-800 mb-2">Disclaimer</h3>
                <p>
                  Several deceptive emails, websites, blogs etc. claiming to be from or associated with Company may or are circulating on the Internet ("Deceptive Communication"). Such Deceptive Communication may include our logo, photos, links, content or other information. The sources and contents of these Deceptive Communications and accompanying materials are in no way associated with the Company. For your own protection, we strongly recommend not responding to such Deceptive Communication. You agree that we shall not be liable for any loss, damage and harm that you may suffer by relying and/or acting upon such Deceptive Communications.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-purple-800 mb-2">Condition of User</h3>
                <p>
                  WE DO NOT WARRANT THAT THIS PORTAL, IT'S SERVERS, OR EMAIL SENT BY US OR ON OUR BEHALF ARE VIRUS FREE. WE WILL NOT BE LIABLE FOR ANY DAMAGES OF ANY KIND ARISING FROM THE USE OF THIS PORTAL, INCLUDING, BUT NOT LIMITED TO COMPENSATORY, DIRECT, INDIRECT, INCIDENTAL, PUNITIVE, SPECIAL AND CONSEQUENTIAL DAMAGES, LOSS OF DATA, GOODWILL, BUSINESS OPPORTUNITY, INCOME OR PROFIT, LOSS OF OR DAMAGE TO PROPERTY AND CLAIMS OF THIRD PARTIES. IN NO EVENT WILL WE BE LIABLE FOR ANY DAMAGES WHATSOEVER IN AN AMOUNT IN EXCESS OF AN AMOUNT OF INR 100
                </p>
              </div>

              <div>
                <h3 className="font-bold text-purple-800 mb-2">Accuracy and Updating Information</h3>
                <p className="mb-2">
                  To the extent Personal Information provided by you, we encourage you to update and maintain accurate and current Personal Information with us to enable us to provide you the Services efficiently.
                </p>
                <p>
                  You will promptly notify Dream60 if there are any changes, updates or modifications to your information. Further, you may also review, update or modify your information and user preferences by logging into your Profile page on the Portal.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="bg-white border-purple-300 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-purple-700 mb-4">Contact Us:</h3>
                <p className="text-sm sm:text-base text-gray-700 mb-3">
                  Any questions or clarifications with respect to this Privacy Policy or any complaints, comments, concerns or feedback can be sent to Dream60 at:{' '}
                  <a 
                    href="mailto:support@dream60.com" 
                    className="text-purple-700 font-semibold underline hover:text-purple-800"
                  >
                    support@dream60.com
                  </a>
                  {' '}or by normal/physical mail addressed to:
                </p>
                <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r">
                  <p className="text-sm sm:text-base text-gray-700 font-semibold">Attn: Dream60 Team</p>
                  <p className="text-sm sm:text-base text-gray-700">Finpages Tech Private Limited,</p>
                  <p className="text-sm sm:text-base text-gray-700">#709, Gowra Fountainhead,</p>
                  <p className="text-sm sm:text-base text-gray-700">Hitech City, Madhapur,</p>
                  <p className="text-sm sm:text-base text-gray-700">Pin: 500081.</p>
                </div>
                <p className="text-sm text-purple-600 mt-4 font-semibold">Last updated: December 5, 2025</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}