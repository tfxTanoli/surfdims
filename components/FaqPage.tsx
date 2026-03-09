import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface FaqPageProps {
    onClose: () => void;
    onContactClick: () => void;
    onOpenLearnMore: () => void;
    onInstallClick: () => void;
    canInstall: boolean;
    currentUser: any;
}

const FaqItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => (
    <details className="group border-b border-gray-200 py-4">
        <summary className="flex justify-between items-center font-semibold text-lg text-gray-800 cursor-pointer list-none">
            {question}
            <span className="transition-transform duration-300 transform group-open:rotate-180">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </span>
        </summary>
        <div className="mt-4 text-gray-600 leading-relaxed">
            {children}
        </div>
    </details>
);

const FaqPage: React.FC<FaqPageProps> = ({ onClose, onContactClick, onOpenLearnMore, onInstallClick, canInstall, currentUser }) => {
    const isAuOrNz = currentUser?.country === 'Australia' || currentUser?.country === 'New Zealand';
    
    return (
        <div className="fixed inset-0 bg-gray-100 z-50 animate-fade-in overflow-y-auto">
            <div className="container mx-auto p-4 lg:p-6">
                <div className="max-w-4xl mx-auto">
                    <button onClick={onClose} className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition mb-6">
                        <ArrowLeftIcon />
                        Back to Listings
                    </button>
                    <div className="bg-white p-8 rounded-xl shadow-lg">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Frequently Asked Questions</h1>
                        
                        <div className="space-y-2">
                             <FaqItem question="What is SurfDims?">
                                <p>SurfDims is a web app that lets you list and search boards by dimension. Browse anonymously or create a FREE account to save favourites and create listings.</p>
                            </FaqItem>
                            <FaqItem question="What are Alerts?">
                                <div className="space-y-2">
                                    <p>An Alert is a notification of a newly listed board that matches the dimension you’re looking for.</p>
                                    <p>You can create an Alert 3 ways:</p>
                                    <ol className="list-decimal ml-5 space-y-1">
                                        <li>Click ‘Create Alert’ in the filter bar.</li>
                                        <li>Click 'Create Alert' under 'No Boards Found' message</li>
                                        <li>Click ‘Heart’ icon on a listing you like.</li>
                                    </ol>
                                </div>
                            </FaqItem>
                            <FaqItem question="What are notifications?">
                                <div className="space-y-2">
                                    <p>Notifications appear above the ‘Bell’ icon in the SurfDims header.</p>
                                    <p>There are 3 types:</p>
                                    <ol className="list-decimal ml-5 space-y-1">
                                        <li><strong>Match Alerts:</strong> A board was listed that matches one of your ‘My Alerts’</li>
                                        <li><strong>Price Change:</strong> A board in your ‘My Favs’ had a price change.</li>
                                        <li><strong>Expired Listing:</strong> See ‘How do I Manage My Listings’</li>
                                    </ol>
                                </div>
                            </FaqItem>
                            <FaqItem question="How much does it cost to list a board?">
                                <p>
                                    {isAuOrNz 
                                        ? '$5 for used boards and $20 for new boards' 
                                        : '$2.50 for used boards and $10 for new boards'}
                                </p>
                            </FaqItem>
                             <FaqItem question="How do I list my surfboard?">
                                <p>Click the "List board" button in the header ( + icon on mobile). If you're not logged in, you'll be prompted to sign up or log in first. Then, simply fill out the form with your board's details, upload some photos, and submit!</p>
                            </FaqItem>
                            <FaqItem question="Can I edit my listing after posting it?">
                                <p>Absolutely! Go to "My Listings" from the user dropdown menu in the header. Click on the listing you want to change, and on the detail page, you'll find an "Edit Listing" button. This will open the listing form with all your current information pre-filled, ready for you to update.</p>
                            </FaqItem>
                            <FaqItem question="How do I manage my listings?">
                                <div className="space-y-4">
                                    <p>Every 30 days we’ll send you an ‘Expired Listing’ notification. You can:</p>
                                    <ol className="list-decimal ml-5 space-y-1">
                                        <li>EXTEND for another 30 days if not sold.</li>
                                        <li>Mark SOLD. This removes it from public listings but gives you 30 days to relist if the sale falls through, or</li>
                                        <li>DELETE it.</li>
                                    </ol>
                                    <div className="pt-2">
                                        <p className="font-bold text-gray-800 mb-1">THINGS TO NOTE:</p>
                                        <ol className="list-decimal ml-5 space-y-1">
                                            <li>Listings left in an Expired or Sold state for 30 days are deleted.</li>
                                            <li>After 90 days listings require payment to relist.</li>
                                        </ol>
                                    </div>
                                </div>
                            </FaqItem>
                            {canInstall && (
                                <FaqItem question="Add SurfDims to your home screen">
                                    <p>
                                        <button onClick={onInstallClick} className="text-blue-600 hover:underline font-semibold focus:outline-none">
                                            Click Here
                                        </button>
                                    </p>
                                </FaqItem>
                            )}
                        </div>

                        <div className="mt-10 pt-6 border-t border-gray-200 text-center">
                            <h3 className="text-xl font-semibold text-gray-800">Unanswered question?</h3>
                            <button onClick={onContactClick} className="mt-2 text-lg font-semibold text-blue-600 hover:underline">
                                Contact us
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaqPage;