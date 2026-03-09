import React from 'react';
import { Surfboard } from '../types';
import TrashIcon from './icons/TrashIcon';
import XIcon from './icons/XIcon';
import EditIcon from './icons/EditIcon';
import ShoppingCartIcon from './icons/ShoppingCartIcon';

interface StagedBoardsCartProps {
    stagedBoards: Omit<Surfboard, 'id'>[];
    onRemoveBoard: (index: number) => void;
    onEditBoard: (index: number) => void;
    onClearAll: () => void;
    onProceedToPayment: () => void;
    onListAnother: () => void;
    currencySymbol: string;
    boardFee: number;
    isOpen: boolean;
    onClose: () => void;
}

const StagedBoardsCart: React.FC<StagedBoardsCartProps> = ({
    stagedBoards,
    onRemoveBoard,
    onEditBoard,
    onClearAll,
    onProceedToPayment,
    onListAnother,
    currencySymbol,
    boardFee,
    isOpen,
    onClose
}) => {
    if (!isOpen) return null;

    const totalBoardCount = stagedBoards.reduce((count, board) => {
        if (board.isPaid) return count;
        return count + board.dimensions.length;
    }, 0);
    const totalAmount = boardFee * totalBoardCount;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-end">
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
                {/* Header Section */}
                <div className="p-6 flex items-start justify-between relative">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <ShoppingCartIcon className="h-7 w-7 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Your Cart</h2>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 transition p-1"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-6 py-2">
                    {stagedBoards.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-400 text-lg italic">Your cart is empty</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stagedBoards.map((board, index) => (
                                <div key={index} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex gap-4">
                                    {/* Thumbnail */}
                                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                        {board.images.length > 0 ? (
                                            <img 
                                                src={board.images[0]} 
                                                alt={board.brand} 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Details */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                            {board.brand}
                                        </h3>
                                        <p className="text-gray-500 text-base mt-1">
                                            {currencySymbol}{board.price}
                                        </p>
                                        <div className="mt-2">
                                            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded">
                                                {board.dimensions.length} Dims
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Icons */}
                                    <div className="flex flex-col justify-between py-1">
                                        <button
                                            onClick={() => onEditBoard(index)}
                                            className="text-blue-500 hover:text-blue-700 transition"
                                            title="Edit item"
                                        >
                                            <EditIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => onRemoveBoard(index)}
                                            className="text-red-500 hover:text-red-700 transition"
                                            title="Remove item"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="p-6 bg-white">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xl font-bold text-gray-800">Total:</span>
                        <span className="text-2xl font-bold text-blue-600">
                            {totalAmount === 0 && stagedBoards.length > 0 ? 'FREE' : `${currencySymbol}${totalAmount.toFixed(2)}`}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={onProceedToPayment}
                            disabled={stagedBoards.length === 0}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Proceed to Checkout
                        </button>
                        <button
                            onClick={onListAnother}
                            className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-all"
                        >
                            List another Board
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StagedBoardsCart;