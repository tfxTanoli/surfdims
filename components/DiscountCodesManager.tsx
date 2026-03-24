
import React, { useState } from 'react';
import { DiscountCode, Condition } from '../types';
import { COUNTRIES, getCountryName } from '../countries';
import XIcon from './icons/XIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';

interface DiscountCodesManagerProps {
    codes: DiscountCode[];
    onCreate: (code: Omit<DiscountCode, 'id' | 'createdAt'>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const DiscountCodesManager: React.FC<DiscountCodesManagerProps> = ({ codes, onCreate, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCode, setNewCode] = useState<{
        name: string;
        percentageOff: number;
        appliesTo: 'Used' | 'New';
        country: string;
        expiryDate: string;
        usageLimit?: number;
        exclusiveTo?: string;
    }>({
        name: '',
        percentageOff: 100,
        appliesTo: 'Used',
        country: 'All',
        expiryDate: '',
        usageLimit: undefined,
        exclusiveTo: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newCode.name.trim()) {
            alert('Please enter a code name.');
            return;
        }
        if (!newCode.expiryDate) {
            alert('Please select an expiry date.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onCreate({ ...newCode, usageCount: 0 });
            setIsModalOpen(false);
            setNewCode({ name: '', percentageOff: 100, appliesTo: 'Used', country: 'All', expiryDate: '', usageLimit: undefined, exclusiveTo: '' });
        } catch (error: any) {
            console.error("Submission failed:", error);
            // Error is already alerted in AdminPage, but we catch it here to stop the loading state
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-700">Manage Discount Codes</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 py-2 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                    <PlusIcon className="h-5 w-5" />
                    Create New Code
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {codes.map(code => (
                    <div key={code.id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-lg font-bold text-gray-900">{code.name}</h4>
                                <button
                                    onClick={() => onDelete(code.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">
                                Discount: <span className="font-semibold">100% OFF</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                Country: <span className="font-semibold">{code.country === 'All' ? 'All Countries' : getCountryName(code.country)}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                Applies to: <span className="font-semibold">{code.appliesTo} boards</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                Expiry: <span className="font-semibold">{new Date(code.expiryDate).toLocaleDateString()}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                Usage: <span className="font-semibold">{code.usageCount} / {code.usageLimit || '∞'}</span>
                            </p>
                            {code.exclusiveTo && (
                                <p className="text-sm text-[#e23030]">
                                    Exclusive to: <span className="font-semibold">{code.exclusiveTo}</span>
                                </p>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-4">Created: {new Date(code.createdAt).toLocaleDateString()}</p>
                    </div>
                ))}
                {codes.length === 0 && (
                    <p className="text-center text-gray-400 py-12 border-2 border-dashed rounded-lg col-span-full">
                        No discount codes created yet.
                    </p>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md relative">
                        <button
                            onClick={() => !isSubmitting && setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <XIcon />
                        </button>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Discount Code</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Code Name</label>
                                <input
                                    type="text"
                                    required
                                    disabled={isSubmitting}
                                    value={newCode.name}
                                    onChange={e => setNewCode({ ...newCode, name: e.target.value.toUpperCase() })}
                                    className="w-full px-3 py-2 border rounded-md uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. SURF20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <select
                                    required
                                    disabled={isSubmitting}
                                    value={newCode.country}
                                    onChange={e => setNewCode({ ...newCode, country: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="All">All Countries</option>
                                    {COUNTRIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Applies to</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setNewCode({ ...newCode, appliesTo: 'Used' })}
                                        className={`flex-1 py-2 px-4 rounded-md font-semibold border transition ${newCode.appliesTo === 'Used' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        Used boards
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setNewCode({ ...newCode, appliesTo: 'New' })}
                                        className={`flex-1 py-2 px-4 rounded-md font-semibold border transition ${newCode.appliesTo === 'New' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        New boards
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#e23030] mb-1">Exclusive to</label>
                                <input
                                    type="email"
                                    disabled={isSubmitting}
                                    value={newCode.exclusiveTo || ''}
                                    onChange={e => setNewCode({ ...newCode, exclusiveTo: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#e23030] rounded-md focus:ring-2 focus:ring-[#e23030] outline-none text-[#e23030] placeholder-[#e23030]/50"
                                    placeholder="Enter email (optional)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    required
                                    disabled={isSubmitting}
                                    value={newCode.expiryDate}
                                    onChange={e => setNewCode({ ...newCode, expiryDate: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit (Optional)</label>
                                <input
                                    type="number"
                                    min="1"
                                    disabled={isSubmitting}
                                    value={newCode.usageLimit || ''}
                                    onChange={e => setNewCode({ ...newCode, usageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. 100 (leave blank for unlimited)"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Code'}
                                </button>
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscountCodesManager;
