import React from 'react';
import { User, Alert } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import TrashIcon from './icons/TrashIcon';

interface MyAlertsPageProps {
    currentUser: User;
    onClose: () => void;
    onDeleteAlert: (alertId: string) => void;
}

const MyAlertsPage: React.FC<MyAlertsPageProps> = ({ currentUser, onClose, onDeleteAlert }) => {
    return (
        <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto animate-fade-in">
            <div className="container mx-auto p-4 lg:p-6">
                <div className="max-w-4xl mx-auto">
                    <button onClick={onClose} className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition mb-6">
                        <ArrowLeftIcon />
                        Back to Listings
                    </button>
                    
                    <div className="bg-white p-8 rounded-xl shadow-lg">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">My Alerts</h1>
                        
                        {(!currentUser.alerts || currentUser.alerts.length === 0) ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">You haven't created any alerts yet.</p>
                                <p className="text-gray-400 mt-2">Use the filters to create an alert for boards you're looking for.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {currentUser.alerts.map((alert, index) => (
                                    <div key={alert.id} className="border border-gray-200 rounded-xl p-6 relative bg-gray-50 hover:shadow-md transition">
                                        <div className="absolute top-4 right-4">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alert #{index + 1}</span>
                                        </div>

                                        <div className="space-y-2 mt-2">
                                            {alert.type === 'keyword' || !alert.type ? (
                                                <p><span className="font-bold text-[#e23030]">Keyword:</span> <span className="text-[#e23030]">{alert.brand || 'Any'}</span></p>
                                            ) : (
                                                <>
                                                    <p><span className="font-bold text-gray-700">Brand:</span> {alert.brand || 'Any'}</p>
                                                    <p><span className="font-bold text-gray-700">Model:</span> {alert.model || 'Any'}</p>
                                                </>
                                            )}
                                            <p><span className="font-bold text-gray-700">Volume:</span> {alert.volumeMin}-{alert.volumeMax}L</p>
                                            <p><span className="font-bold text-gray-700">Length:</span> {alert.lengthMin}-{alert.lengthMax}'</p>
                                            <p><span className="font-bold text-gray-700">Width:</span> {alert.widthMin}-{alert.widthMax}"</p>
                                            <p><span className="font-bold text-gray-700">Thickness:</span> {alert.thicknessMin}-{alert.thicknessMax}"</p>
                                            <p><span className="font-bold text-gray-700">Fin setup:</span> {alert.finSetup}</p>
                                            <p><span className="font-bold text-gray-700">Fin system:</span> {alert.finSystem}</p>
                                        </div>
                                        
                                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                                            <button 
                                                onClick={() => onDeleteAlert(alert.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                                                title="Delete Alert"
                                            >
                                                <TrashIcon className="h-6 w-6" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyAlertsPage;
