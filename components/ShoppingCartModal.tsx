import React from 'react';
import { Surfboard, User } from '../types';
import { getCurrencySymbol, getNewBoardFee } from '../countries';
import XIcon from './icons/XIcon';
import ShoppingCartIcon from './icons/ShoppingCartIcon';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';

interface ShoppingCartModalProps {
    items: Omit<Surfboard, 'id'>[];
    currentUser: User;
    onClose: () => void;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
    onCheckout: () => void;
}

const ShoppingCartModal: React.FC<ShoppingCartModalProps> = ({ items, currentUser, onClose, onEdit, onDelete, onCheckout }) => {
    const currencySymbol = getCurrencySymbol(currentUser.country);
    const feePerBoard = getNewBoardFee(currentUser.country);
    
    // Calculate total: each item can have multiple dimensions (each counts as a board fee)
    const totalBoards = items.reduce((acc, item) => acc + item.dimensions.length, 0);
    const totalPrice = totalBoards * feePerBoard;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl relative animate-fade-in-down">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition">
                    <XIcon />
                </button>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <ShoppingCartIcon className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">Your cart is empty.</p>
                        <button onClick={onClose} className="mt-4 text-blue-600 font-semibold hover:underline">Continue Browsing</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
                            {items.map((item, index) => {
                                const itemCount = item.dimensions.length;
                                const itemFee = itemCount * feePerBoard;
                                return (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex-grow">
                                            <p className="font-bold text-gray-900">{item.brand}</p>
                                            <p className="text-gray-600 text-sm">{item.model}</p>
                                            <p className="text-xs text-blue-600 mt-1">{itemCount} size{itemCount !== 1 ? 's' : ''} listed</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="font-bold text-gray-800">{currencySymbol}{itemFee.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => onEdit(index)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Edit listing"
                                                >
                                                    <EditIcon className="h-5 w-5" />
                                                </button>
                                                <button 
                                                    onClick={() => onDelete(index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Remove from cart"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-lg font-bold text-gray-700">Total:</span>
                                <span className="text-2xl font-black text-blue-600">{currencySymbol}{totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <button 
                                    onClick={onCheckout}
                                    className="w-full py-4 text-lg font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all"
                                >
                                    Proceed to Checkout
                                </button>
                                <button 
                                    onClick={onClose}
                                    className="w-full py-2 text-gray-500 font-semibold hover:text-gray-700 transition-colors"
                                >
                                    Keep Shopping
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShoppingCartModal;