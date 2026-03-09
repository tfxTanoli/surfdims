import React from 'react';
import BellIcon from './icons/BellIcon';
import HeartIcon from './icons/HeartIcon';
import XIcon from './icons/XIcon';

interface AlertCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    iconType?: 'heart' | 'bell';
    showSureNoThanks?: boolean;
    onSure?: () => void;
    onNoThanks?: () => void;
    successMessage?: string;
    onViewAlerts?: () => void;
}

const AlertCreationModal: React.FC<AlertCreationModalProps> = ({ 
    isOpen, 
    onClose, 
    title = "My Alerts",
    message, 
    iconType = 'bell',
    showSureNoThanks, 
    onSure, 
    onNoThanks,
    successMessage,
    onViewAlerts
}) => {
    if (!isOpen) return null;

    const iconBgColor = iconType === 'heart' ? 'bg-[#7fd4d8]' : 'bg-[#e23030]';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-10 relative animate-fade-in">
                <div className="flex flex-col items-center text-center">
                    <div className={`${iconBgColor} p-5 rounded-full mb-8`}>
                        {iconType === 'heart' ? (
                            <HeartIcon isFilled={true} className="h-12 w-12 text-white" />
                        ) : (
                            <BellIcon className="h-12 w-12 text-white" />
                        )}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">{title}</h2>
                    
                    {!successMessage ? (
                        <>
                            <p className="text-gray-600 text-lg mb-10 leading-relaxed">
                                {message.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        {i < message.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </p>
                            {showSureNoThanks ? (
                                <div className="flex gap-4 w-full">
                                    <button 
                                        onClick={onSure}
                                        className="flex-1 py-4 px-6 bg-[#e23030] text-white font-bold rounded-xl hover:brightness-110 transition text-lg"
                                    >
                                        Sure
                                    </button>
                                    <button 
                                        onClick={onNoThanks}
                                        className="flex-1 py-4 px-6 bg-[#e5e7eb] text-[#374151] font-bold rounded-xl hover:bg-[#d1d5db] transition text-lg"
                                    >
                                        No thanks
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={onClose}
                                    className="w-full py-4 px-6 bg-[#e23030] text-white font-bold rounded-xl hover:brightness-110 transition text-lg"
                                >
                                    Close
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="animate-fade-in w-full">
                            <p className="text-gray-600 text-lg mb-10 leading-relaxed">{successMessage}</p>
                            <div className="flex gap-4 w-full">
                                <button 
                                    onClick={onClose}
                                    className={`flex-1 py-4 px-6 font-bold rounded-xl transition text-lg ${
                                        iconType === 'bell' && onViewAlerts 
                                            ? 'bg-[#e5e7eb] text-[#374151] hover:bg-[#d1d5db]' 
                                            : 'bg-[#e23030] text-white hover:brightness-110'
                                    }`}
                                >
                                    Close
                                </button>
                                {iconType === 'bell' && onViewAlerts && (
                                    <button 
                                        onClick={onViewAlerts}
                                        className="flex-1 py-4 px-6 bg-[#e23030] text-white font-bold rounded-xl hover:brightness-110 transition text-lg"
                                    >
                                        View Alerts
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertCreationModal;
