import React, { useState, useRef } from 'react';
import { User, Alert } from '../types';
import { COUNTRIES } from '../countries';
import XIcon from './icons/XIcon';
import UserIcon from './icons/UserIcon';
import TrashIcon from './icons/TrashIcon';

interface AccountSettingsModalProps {
    currentUser: User;
    onClose: () => void;
    onUpdateUser: (updatedUser: User) => void;
    onAddAlert: (brand: string, model: string) => void;
    onDeleteAlert: (alertId: string) => void;
}

const ProfileSettings: React.FC<{
    currentUser: User;
    onUpdateUser: (updatedUser: User) => void;
}> = ({ currentUser, onUpdateUser }) => {
    const [name, setName] = useState(currentUser.name);
    const [location, setLocation] = useState(currentUser.location);
    const [country, setCountry] = useState(currentUser.country);
    const [phone, setPhone] = useState(currentUser.phone || '');
    const [avatar, setAvatar] = useState(currentUser.avatar);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const showStatus = (text: string, type: 'success' | 'error') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 5000);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateUser({
            ...currentUser,
            name,
            location,
            country,
            phone,
            avatar,
        });
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <img src={avatar} alt="Current Avatar" className="w-20 h-20 rounded-full object-cover shadow-sm" />
                <div>
                     <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-4 py-2 bg-white border border-gray-300 text-sm font-semibold text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Change Avatar
                    </button>
                     <input
                        type="file"
                        ref={avatarInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg"
                        onChange={handleAvatarChange}
                    />
                    <p className="text-xs text-gray-500 mt-2">PNG or JPG. 2MB max.</p>
                </div>
            </div>

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 [-webkit-appearance:none]"/>
            </div>
                <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input id="email" type="email" value={currentUser.email} disabled className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed"/>
            </div>
                <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
                <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 123-456-7890" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 [-webkit-appearance:none]"/>
            </div>
                <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location (City, State/Region)</label>
                <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value)} required placeholder="e.g. Auckland" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 [-webkit-appearance:none]"/>
            </div>
            <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                <select id="country" value={country} onChange={e => setCountry(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 [-webkit-appearance:none]">
                    {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                </select>
            </div>
            
            <div className="pt-2 border-t border-gray-200 mt-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Notifications</h3>
                {statusMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm border ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {statusMessage.text}
                    </div>
                )}
                <button
                    type="button"
                    onClick={async () => {
                        try {
                            const apiUrl = '/api/test-notification';
                                
                            const response = await fetch(apiUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: currentUser.id })
                            });
                            
                            const data = await response.json();
                            if (response.ok) {
                                showStatus(data.message || 'Test notification sent!', 'success');
                            } else {
                                showStatus(`Error: ${data.error}`, 'error');
                            }
                        } catch (err) {
                            showStatus('Network error: Could not reach the server. Please try again.', 'error');
                        }
                    }}
                    className="w-full py-2 px-4 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition"
                >
                    Send Test Push Notification
                </button>
                <p className="text-xs text-gray-500 mt-2">
                    Ensures your browser is correctly configured to receive background alerts.
                </p>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                     <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Troubleshooting</h4>
                     <button
                        type="button"
                        onClick={async () => {
                             try {
                                const { requestPushToken } = await import('../firebase');
                                const token = await requestPushToken();
                                if (!token) {
                                    showStatus("Could not generate a token. Please check if you have allowed notifications in your browser.", 'error');
                                    return;
                                }
                                
                                const apiUrl = '/api/save-token';
                                    
                                const res = await fetch(apiUrl, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ token, userId: currentUser.id })
                                });
                                
                                if (res.ok) {
                                    showStatus("Notifications enabled successfully! Try the test button now.", 'success');
                                } else {
                                    const err = await res.json();
                                    showStatus(`Failed to save token: ${err.error}`, 'error');
                                }
                             } catch (e) {
                                 showStatus("Error enabling notifications. See console.", 'error');
                                 console.error(e);
                             }
                        }}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                     >
                        Force Re-enable Notifications
                     </button>
                </div>
            </div>

            <div className="pt-2">
                <button type="submit" className="w-full py-3 px-4 font-semibold rounded-lg shadow-md bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
                    Save Changes
                </button>
            </div>
        </form>
    );
};

const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ currentUser, onClose, onUpdateUser }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg relative animate-fade-in-down max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition z-10">
                    <XIcon />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Settings</h2>
                <ProfileSettings currentUser={currentUser} onUpdateUser={onUpdateUser} />
            </div>
        </div>
    );
};

export default AccountSettingsModal;