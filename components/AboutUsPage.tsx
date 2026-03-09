import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

interface AboutUsPageProps {
    onClose: () => void;
    onSignupClick: () => void;
    isLoggedIn: boolean;
}

const AboutUsPage: React.FC<AboutUsPageProps> = ({ onClose, onSignupClick, isLoggedIn }) => {
    return (
        <div className="fixed inset-0 bg-gray-100 z-50 animate-fade-in overflow-y-auto">
            <div className="container mx-auto p-4 lg:p-6">
                <div className="max-w-3xl mx-auto">
                    <button onClick={onClose} className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition mb-6">
                        <ArrowLeftIcon />
                        Back to Listings
                    </button>
                    <div className="bg-white p-8 rounded-xl shadow-lg">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">About SurfDims.</h1>
                        
                        <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
                            <p>
                                SurfDims was created by a disabled Kiwi surfer frustrated with having to browse multiple platforms and listings to find a board that fit the dimensions he wanted.
                            </p>
                            
                            <div className="space-y-4">
                                <p className="font-bold text-gray-900">With SurfDims you can...</p>
                                
                                <p>
                                    <span className="font-bold text-blue-600">FILTER</span> boards by country, volume, length, width, fin system and setup and then order results by price.
                                </p>
                                
                                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                                    <p className="font-semibold text-gray-900 mb-4">Create a FREE account to:</p>
                                    <ul className="space-y-2 mb-6">
                                        <li className="flex items-center gap-2">
                                            <span className="text-blue-600 font-bold">-</span>
                                            <span className="font-bold">SELL</span> new and used boards
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-blue-600 font-bold">-</span>
                                            <span className="font-bold">SAVE</span> favourites
                                        </li>
                                    </ul>

                                    <p className="font-semibold text-gray-900 mb-2">Be notified of:</p>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2">
                                            <span className="text-blue-600 font-bold">-</span>
                                            <span className="font-bold uppercase">NEW</span> listing matching favs
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-blue-600 font-bold">-</span>
                                            <span className="font-bold uppercase">PRICE</span> changes to favs
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-blue-600 font-bold">-</span>
                                            <span className="font-bold uppercase">WHEN</span> to renew listings
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100">
                                <p>I hope you find it useful.</p>
                                <p className="font-bold mt-2 text-gray-900">Cheers, Luke</p>
                            </div>

                            {!isLoggedIn && (
                                <div className="flex justify-center pt-6">
                                    <button 
                                        onClick={onSignupClick}
                                        className="py-3 px-10 text-xl font-bold rounded-lg shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-all transform hover:scale-105 active:scale-95"
                                    >
                                        Sign-up now!
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUsPage;