import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import FacebookIcon from './icons/FacebookIcon';
import InstagramIcon from './icons/InstagramIcon';

interface ContactPageProps {
    onClose: () => void;
    contactEmail: string;
}

const ContactPage: React.FC<ContactPageProps> = ({ onClose, contactEmail }) => {
    return (
        <div className="fixed inset-0 bg-gray-100 z-50 animate-fade-in overflow-y-auto">
            <div className="container mx-auto p-4 lg:p-6 max-w-2xl">
                <div className="mb-6">
                    <button onClick={onClose} className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition">
                        <ArrowLeftIcon />
                        Back to Listings
                    </button>
                </div>
                
                <div className="bg-white p-12 rounded-2xl shadow-xl text-center">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">Connect</h1>
                    <p className="text-xl text-gray-600 mb-12">Tap to follow for news and giveaways</p>

                    <div className="flex justify-center gap-12 mb-16">
                        <a 
                            href="https://www.facebook.com/surfdims" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="transition-transform hover:scale-110"
                        >
                            <div className="bg-[#1877F2] p-0 rounded-full overflow-hidden">
                                <FacebookIcon className="h-24 w-24 text-white" />
                            </div>
                        </a>
                        <a 
                            href="https://www.instagram.com/surfdims/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="transition-transform hover:scale-110"
                        >
                            <InstagramIcon className="h-24 w-24" />
                        </a>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xl text-gray-600">or email us</p>
                        <a 
                            href={`mailto:${contactEmail}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-4xl md:text-5xl font-medium text-blue-500 hover:text-blue-600 transition-colors break-all"
                        >
                            {contactEmail}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
