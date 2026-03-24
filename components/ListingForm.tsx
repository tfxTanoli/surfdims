
import React, { useState, useEffect } from 'react';
import { Surfboard, Condition, FinSystem, User, FinSetup, Dimension, SurfboardStatus, DiscountCode } from '../types';
import { FIN_SYSTEMS_OPTIONS, FIN_SETUP_OPTIONS } from '../constants';
import { getCurrencySymbol, COUNTRIES, getNewBoardFee, getUsedBoardFee } from '../countries';
import XIcon from './icons/XIcon';
import StarIcon from './icons/StarIcon';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { compressImage } from '../utils/imageCompression';

interface ListingFormProps {
    onClose: () => void;
    currentUser: User;
    editingBoard?: Surfboard | null;
    onUpdateBoard: (board: Surfboard) => void;
    onAddUsedBoard: (board: Omit<Surfboard, 'id'>, location?: { region: string, suburb: string }) => void;
    onDonateAndList: (board: Omit<Surfboard, 'id'>, donationAmount: number, location?: { region: string, suburb: string }) => void;
    onStageAndReset: (boards: Omit<Surfboard, 'id'>[], location?: { region: string; suburb: string }) => void;
    onStageAndPay: (boards: Omit<Surfboard, 'id'>[], location?: { region: string; suburb: string }) => void;
    stagedCount: number;
    totalEntries: number;
    onOpenLearnMore: () => void;
    onOpenCharityModal: () => void;
    onOpenCart: () => void;
}

const FormInput: React.FC<{
    label: string;
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    step?: string;
    rows?: number;
}> = ({ label, name, value, onChange, onBlur, onKeyDown, type = 'text', placeholder = '', required = true, step = '', rows = 0 }) => (
    <div className="w-full">
        <label htmlFor={name} className="block text-sm font-semibold text-[#4a5568] mb-1">{label}</label>
        {rows > 0 ? (
            <textarea id={name} name={name} value={value} onChange={onChange} onBlur={onBlur} onKeyDown={onKeyDown} required={required} placeholder={placeholder} rows={rows} className="w-full px-3 py-2 border border-[#cbd5e0] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900" />
        ) : (
            <input id={name} type={type} name={name} value={value} onChange={onChange} onBlur={onBlur} onKeyDown={onKeyDown} required={required} placeholder={placeholder} step={step} className="w-full px-3 py-2 border border-[#cbd5e0] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900" />
        )}
    </div>
);

// Helper to parse strings like "2 1/2" into "2.5"
const parseFraction = (input: string): string => {
    // Remove quotes and "in" suffix if present
    const trimmed = input.trim().replace(/"/g, '').replace(/in/gi, '');
    if (!trimmed) return "";

    // Check if it's already a valid decimal or integer
    if (/^\d*\.?\d+$/.test(trimmed)) return trimmed;

    // Handle "2 1/2", "2-1/2", "1/4", "2 1 / 2"
    const fractionRegex = /^(\d+)?\s*[- ]?\s*(\d+)\s*\/\s*(\d+)$/;
    const match = trimmed.match(fractionRegex);

    if (match) {
        const whole = match[1] ? parseInt(match[1], 10) : 0;
        const numerator = parseInt(match[2], 10);
        const denominator = parseInt(match[3], 10);

        if (denominator !== 0) {
            const decimal = whole + (numerator / denominator);
            // Limit to 3 decimal places for surfboard dimensions (e.g., 2.375)
            return (Math.round(decimal * 1000) / 1000).toString();
        }
    }

    return trimmed;
};

const ListingForm: React.FC<ListingFormProps> = ({ onClose, currentUser, editingBoard, onUpdateBoard, onAddUsedBoard, onStageAndReset, onStageAndPay, stagedCount, totalEntries, onDonateAndList, onOpenLearnMore, onOpenCharityModal, onOpenCart }) => {
    const isEditing = !!editingBoard;
    const isStagedEdit = editingBoard?.id?.startsWith('editing-');

    const initialBoardState = {
        brand: '',
        model: '',
        dimensions: [{ length: '', width: '', thickness: '', volume: '' }],
        finSystem: FinSystem.FCS2,
        finSetup: FinSetup.Thruster,
        condition: Condition.Used,
        price: '',
        description: '',
        images: [] as string[]
    };

    const [board, setBoard] = useState(initialBoardState);
    const [condition, setCondition] = useState<Condition>(Condition.Used);
    const [region, setRegion] = useState('');
    const [suburb, setSuburb] = useState('');
    const [discountCode, setDiscountCode] = useState('');
    const [appliedCode, setAppliedCode] = useState<DiscountCode | null>(null);
    const [discountError, setDiscountError] = useState<string | null>(null);
    const [discountSuccess, setDiscountSuccess] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isValidatingCode, setIsValidatingCode] = useState(false);

    const newImageBlobs = React.useRef<Map<string, { full: Blob, thumb: Blob }>>(new Map());

    const regionsForSelectedCountry = COUNTRIES.find(c => c.code === currentUser.country)?.regions || [];

    useEffect(() => {
        if (!isEditing && !currentUser.location) {
            if (regionsForSelectedCountry.length > 0) {
                setRegion(regionsForSelectedCountry[0].name);
            } else {
                setRegion('');
            }
        }
    }, [currentUser.country, currentUser.location, isEditing, regionsForSelectedCountry]);

    const resetForm = () => {
        setBoard(initialBoardState);
        setCondition(Condition.Used);
        setSuburb('');
        setDiscountCode('');
        if (regionsForSelectedCountry.length > 0) {
            setRegion(regionsForSelectedCountry[0].name);
        }
    };

    useEffect(() => {
        if (isEditing && editingBoard) {
            const { sellerId, listedDate, status, type, id, isPaid, expiresAt, ...formData } = editingBoard;
            setBoard({
                ...formData,
                price: formData.price.toString(),
                dimensions: formData.dimensions.map(d => ({
                    length: d.length.toString(),
                    width: d.width.toString(),
                    thickness: d.thickness.toString(),
                    volume: d.volume.toString()
                }))
            });
            setCondition(formData.condition);
        } else {
            resetForm();
        }
    }, [editingBoard, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setBoard(prev => ({ ...prev, [name]: value }));
    };

    const handleConditionChange = (newCondition: Condition) => {
        setCondition(newCondition);
        if (appliedCode && appliedCode.appliesTo !== newCondition) {
            setAppliedCode(null);
            setDiscountSuccess(null);
            setDiscountError(`Discount code "${appliedCode.name}" only applies to ${appliedCode.appliesTo} boards.`);
        }
    };

    const handleDimensionChange = (index: number, field: string, value: string) => {
        setBoard(prev => {
            const newDimensions = prev.dimensions.map((dim, i) =>
                i === index ? { ...dim, [field]: value } : dim
            );
            return { ...prev, dimensions: newDimensions };
        });
    };

    const handleDimensionBlur = (index: number, field: string, value: string) => {
        const convertedValue = parseFraction(value);
        if (convertedValue !== value) {
            handleDimensionChange(index, field, convertedValue);
        }
    };

    const handleAddDimensionRow = () => {
        setBoard(prev => ({
            ...prev,
            dimensions: [...prev.dimensions, { length: '', width: '', thickness: '', volume: '' }]
        }));
    };

    const handleRemoveDimensionRow = (index: number) => {
        setBoard(prev => ({
            ...prev,
            dimensions: prev.dimensions.filter((_, i) => i !== index)
        }));
    };

    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;

        setDiscountError(null);
        setDiscountSuccess(null);
        setAppliedCode(null);
        setIsValidatingCode(true);

        try {
            const q = query(collection(db, "discountCodes"), where("name", "==", discountCode.trim().toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setDiscountError("Invalid code. Try again");
                return;
            }

            const codeDoc = querySnapshot.docs[0];
            const codeData = { id: codeDoc.id, ...codeDoc.data() } as DiscountCode;

            // Check expiry
            const now = new Date();
            const expiry = new Date(codeData.expiryDate);
            if (expiry < now) {
                setDiscountError("This code has expired");
                return;
            }

            // Check country if applicable
            if (codeData.country !== 'All' && codeData.country !== currentUser.country) {
                setDiscountError("Invalid code for your country.");
                return;
            }

            // Check appliesTo
            if (codeData.appliesTo !== condition) {
                setDiscountError(`This code only applies to ${codeData.appliesTo} boards.`);
                return;
            }

            // Check exclusive email restriction
            if (codeData.exclusiveTo && codeData.exclusiveTo.toLowerCase() !== currentUser.email?.toLowerCase()) {
                setDiscountError("This code is not valid for your account.");
                return;
            }

            // Check usage limit
            if (codeData.usageLimit !== undefined && codeData.usageCount >= codeData.usageLimit) {
                setDiscountError("This code has reached its usage limit.");
                return;
            }

            setAppliedCode(codeData);
            setDiscountSuccess("Valid code. Discount applied");
        } catch (error) {
            console.error("Error applying discount:", error);
            setDiscountError("Error validating code. Try again.");
        } finally {
            setIsValidatingCode(false);
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const currentCount = board.images.length;
            const remaining = 6 - currentCount;

            if (remaining <= 0) {
                alert("You can only upload a maximum of 6 images.");
                return;
            }

            const files = Array.from(e.target.files).filter(file => {
                const f = file as File;
                return f && typeof f.type === 'string' && f.type.startsWith('image/');
            }).slice(0, remaining);

            if (Array.from(e.target.files).length > remaining) {
                alert(`You can only add ${remaining} more image${remaining === 1 ? '' : 's'}. Only the first ${remaining} ${remaining === 1 ? 'was' : 'were'} selected.`);
            }

            try {
                const newPreviewUrls: string[] = [];
                for (const fileObj of files) {
                    const file = fileObj as File;
                    const fullBlob = await compressImage(file, { maxWidth: 1200, quality: 0.8, type: 'image/webp' });
                    const thumbBlob = await compressImage(file, { maxWidth: 400, quality: 0.6, type: 'image/webp' });
                    const previewUrl = URL.createObjectURL(thumbBlob);

                    newImageBlobs.current.set(previewUrl, { full: fullBlob, thumb: thumbBlob });
                    newPreviewUrls.push(previewUrl);
                }

                setBoard(prev => ({ ...prev, images: [...(prev.images || []), ...newPreviewUrls] }));
            } catch (error) {
                console.error("Error processing images:", error);
                alert("There was an error processing one or more images. Please try again.");
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        setBoard(prev => ({
            ...prev,
            images: (prev.images || []).filter((_, i) => i !== index)
        }));
    };

    const handleSetFeatureImage = (index: number) => {
        if (index === 0) return;
        setBoard(prev => {
            const newImages = [...(prev.images || [])];
            const [selectedImage] = newImages.splice(index, 1);
            newImages.unshift(selectedImage);
            return { ...prev, images: newImages };
        });
    };

    const processAndValidateBoard = () => {
        if (!currentUser) {
            alert('You must be logged in.');
            return null;
        }
        if (!board.images || board.images.length === 0) {
            alert('Please upload at least one image.');
            return null;
        }

        const areDimensionsValid = board.dimensions.every(dim =>
            parseFloat(dim.length) > 0 &&
            parseFloat(dim.width) > 0 &&
            parseFloat(dim.thickness) > 0 &&
            parseFloat(dim.volume) > 0
        );

        if (!areDimensionsValid) {
            alert('All dimension fields are required and must be valid numbers.');
            return null;
        }

        const priceNum = parseFloat(board.price);
        if (isNaN(priceNum) || priceNum < 0) {
            alert('Please provide a valid price.');
            return null;
        }

        return {
            ...board,
            brand: (board.brand || '').trim(),
            model: (board.model || '').trim(),
            price: priceNum,
            dimensions: board.dimensions.map(dim => ({
                length: parseFloat(dim.length),
                width: parseFloat(dim.width),
                thickness: parseFloat(dim.thickness),
                volume: parseFloat(dim.volume)
            }))
        };
    }

    const uploadImages = async (imageParams: string[]): Promise<{ images: string[], thumbnails: string[] }> => {
        const uploadedUrls: string[] = [];
        const uploadedThumbnails: string[] = [];

        for (const img of imageParams) {
            if (img.startsWith('http')) {
                uploadedUrls.push(img);
                let thumbUrl = img;
                if (editingBoard && editingBoard.images && editingBoard.thumbnails) {
                    const originalIndex = editingBoard.images.indexOf(img);
                    if (originalIndex !== -1 && editingBoard.thumbnails[originalIndex]) {
                        thumbUrl = editingBoard.thumbnails[originalIndex];
                    }
                }
                uploadedThumbnails.push(thumbUrl);

            } else if (img.startsWith('blob:')) {
                const blobs = newImageBlobs.current.get(img);
                if (blobs) {
                    const timestamp = Date.now();
                    const random = Math.floor(Math.random() * 1000);

                    const fullPath = `images/${currentUser.id}/${timestamp}_${random}.webp`;
                    const fullRef = ref(storage, fullPath);
                    const fullSnapshot = await uploadBytes(fullRef, blobs.full);
                    const fullUrl = await getDownloadURL(fullSnapshot.ref);
                    uploadedUrls.push(fullUrl);

                    const thumbPath = `images/${currentUser.id}/${timestamp}_${random}_thumb.webp`;
                    const thumbRef = ref(storage, thumbPath);
                    const thumbSnapshot = await uploadBytes(thumbRef, blobs.thumb);
                    const thumbUrl = await getDownloadURL(thumbSnapshot.ref);
                    uploadedThumbnails.push(thumbUrl);
                }
            }
        }
        return { images: uploadedUrls, thumbnails: uploadedThumbnails };
    }

    const getListingData = async (): Promise<Omit<Surfboard, 'id'> | null> => {
        setIsSaving(true);
        try {
            const processedBoard = processAndValidateBoard();
            if (!processedBoard) return null;

            const { images: finalImages, thumbnails: finalThumbnails } = await uploadImages(board.images);
            const now = new Date();
            const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
            const expiresAt = new Date(now.getTime() + ninetyDaysInMs);

            return {
                ...processedBoard,
                images: finalImages,
                thumbnails: finalThumbnails,
                type: 'board' as const,
                condition: condition,
                listingType: condition === Condition.Used ? 'used' : 'new',
                sellerId: currentUser.id,
                ownerId: currentUser.id,
                status: SurfboardStatus.Live,
                lifecycleStatus: 'active',
                listedDate: now.toISOString(),
                firstListedDate: now.toISOString(),
                isPaid: appliedCode ? true : false,
                discountCodeId: appliedCode ? appliedCode.id : undefined,
                expiresAt: expiresAt.toISOString(),
            } as Omit<Surfboard, 'id'>;
        } catch (error) {
            console.error(error);
            alert("Failed to create listing (image upload).");
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    const getLocationData = () => {
        if (!isEditing && !currentUser.location) {
            if (!region || !suburb.trim()) {
                alert('Please provide your City/Region and Suburb to continue.');
                return null;
            }
            return { region, suburb: suburb.trim() };
        }
        return undefined;
    };

    const handleFormSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const processedBoard = processAndValidateBoard();
        if (!processedBoard || !isEditing || !editingBoard) return;

        setIsSaving(true);
        try {
            const { images: finalImages, thumbnails: finalThumbnails } = await uploadImages(board.images);
            const updatedBoardData: Surfboard = {
                ...editingBoard,
                ...processedBoard,
                images: finalImages,
                thumbnails: finalThumbnails,
                condition,
            };
            onUpdateBoard(updatedBoardData);
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update listing.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAndListAnother = async () => {
        const data = await getListingData();
        if (!data) return;
        const location = getLocationData();
        if (!isEditing && !currentUser.location && !location) return;

        onStageAndReset([data], location);
        alert('Board added to cart! Click "View Cart" or the icon in the header to proceed to payment.');
        resetForm();
    };

    const handleViewCartClick = async () => {
        // Option A: Save current form data to cart then open cart
        const data = await getListingData();
        if (data) {
            const location = getLocationData();
            if (isEditing || currentUser.location || location) {
                onStageAndReset([data], location);
                resetForm();
            }
        }
        onOpenCart();
    };

    const currencySymbol = getCurrencySymbol(currentUser.country);
    const newBoardFee = getNewBoardFee(currentUser.country);
    const usedBoardFee = getUsedBoardFee(currentUser.country);

    const currentTotal = condition === Condition.New
        ? board.dimensions.length * newBoardFee
        : board.dimensions.length * usedBoardFee;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start py-10 overflow-y-auto px-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl relative animate-fade-in-down overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 text-[#4a5568] hover:text-gray-800 transition z-10">
                    <XIcon />
                </button>

                <div className="p-8 pb-4">
                    <h2 className="text-[28px] font-bold text-[#1a202c] mb-6">{isEditing ? (isStagedEdit ? 'Edit staged listing' : 'Edit listing') : 'List a board'}</h2>

                    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput label="Brand" name="brand" value={board.brand} onChange={handleChange} />
                            <FormInput label="Model" name="model" value={board.model} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[#4a5568] mb-1">Condition / Type</label>
                            <div className="flex w-full border border-[#cbd5e0] rounded-md overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => handleConditionChange(Condition.Used)}
                                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${condition === Condition.Used ? 'bg-white text-gray-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    Used
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleConditionChange(Condition.New)}
                                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${condition === Condition.New ? 'bg-[#28a745] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    New
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[#4a5568] mb-1">Dimensions (supports fractions like "2 1/2")</label>
                            <div className="bg-[#f8f9fa] p-4 rounded-md space-y-4">
                                {board.dimensions.map((dim, index) => (
                                    <div key={index} className="relative flex flex-col gap-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <FormInput
                                                label="Length (ft)"
                                                name="length"
                                                type="text"
                                                value={dim.length}
                                                onChange={(e) => handleDimensionChange(index, 'length', e.target.value)}
                                                onBlur={(e) => handleDimensionBlur(index, 'length', e.target.value)}
                                            />
                                            <FormInput
                                                label="Width (in)"
                                                name="width"
                                                type="text"
                                                value={dim.width}
                                                onChange={(e) => handleDimensionChange(index, 'width', e.target.value)}
                                                onBlur={(e) => handleDimensionBlur(index, 'width', e.target.value)}
                                            />
                                            <FormInput
                                                label="Thickness (in)"
                                                name="thickness"
                                                type="text"
                                                value={dim.thickness}
                                                onChange={(e) => handleDimensionChange(index, 'thickness', e.target.value)}
                                                onBlur={(e) => handleDimensionBlur(index, 'thickness', e.target.value)}
                                            />
                                            <FormInput
                                                label="Volume (L)"
                                                name="volume"
                                                type="text"
                                                value={dim.volume}
                                                onChange={(e) => handleDimensionChange(index, 'volume', e.target.value)}
                                                onBlur={(e) => handleDimensionBlur(index, 'volume', e.target.value)}
                                            />
                                        </div>
                                        {board.dimensions.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveDimensionRow(index)} className="absolute -right-2 -top-2 text-red-500 hover:text-red-700 bg-white rounded-full shadow-sm p-1">
                                                <XIcon />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <div className="bg-[#e9f7ef] border-l-4 border-[#28a745] p-3 text-sm text-[#155724]">
                                    Have multiple sizes of same model? Add dims for each size on the one listing. Listing fee applies for each board.
                                </div>
                            </div>
                            {(!isEditing || isStagedEdit) && (
                                <button type="button" onClick={handleAddDimensionRow} className="mt-2 text-sm font-semibold text-[#0056b3] hover:underline">
                                    + Add another size
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput label="Price" name="price" type="text" value={board.price} onChange={handleChange} />
                            <div>
                                <label className="block text-sm font-semibold text-[#4a5568] mb-1">Fin Setup</label>
                                <select name="finSetup" value={board.finSetup} onChange={handleChange} className="w-full px-3 py-2 border border-[#cbd5e0] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900">
                                    {FIN_SETUP_OPTIONS.map(fs => <option key={fs} value={fs}>{fs}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-[#4a5568] mb-1">Fin System</label>
                                <select name="finSystem" value={board.finSystem} onChange={handleChange} className="w-full px-3 py-2 border border-[#cbd5e0] rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900">
                                    {FIN_SYSTEMS_OPTIONS.map(fs => <option key={fs} value={fs}>{fs}</option>)}
                                </select>
                            </div>
                        </div>

                        <FormInput label="Description" name="description" value={board.description} onChange={handleChange} rows={4} placeholder="Tell us about your board..." />

                        {/* Image Upload UI */}
                        <div>
                            <label className="block text-sm font-semibold text-[#4a5568] mb-2">Upload Images (Max 6)</label>
                            <p className="text-xs text-gray-500 mb-2">Click the star on an image to set it as the feature image.</p>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-4">
                                    <label className={`px-4 py-1.5 border border-[#cbd5e0] rounded-full text-sm font-semibold transition-colors ${board.images.length >= 6 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-[#4a5568] cursor-pointer hover:bg-gray-50'}`}>
                                        Choose files
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            disabled={board.images.length >= 6}
                                        />
                                    </label>
                                    <span className="text-sm text-gray-500">{board.images.length > 0 ? `${board.images.length} files chosen` : 'No file chosen'}</span>
                                </div>
                                {board.images.length > 0 && (
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                                        {board.images.map((img, idx) => (
                                            <div key={idx} className={`relative aspect-square rounded-md overflow-hidden border ${idx === 0 ? 'border-[#28a745] ring-2 ring-[#28a745]' : 'border-gray-200'} group`}>
                                                <img src={img} className="w-full h-full object-cover" alt="Preview" />

                                                <button
                                                    type="button"
                                                    onClick={() => handleSetFeatureImage(idx)}
                                                    className={`absolute bottom-0 left-0 p-1 transition-colors ${idx === 0 ? 'bg-[#28a745] text-white' : 'bg-black bg-opacity-40 text-gray-300 hover:text-white hover:bg-opacity-60'}`}
                                                    title={idx === 0 ? "Feature Image" : "Set as Feature Image"}
                                                >
                                                    <StarIcon className="h-3.5 w-3.5" isFilled={idx === 0} />
                                                </button>

                                                <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-0 right-0 p-0.5 bg-black bg-opacity-50 text-white hover:bg-opacity-70">
                                                    <XIcon />
                                                </button>

                                                {idx === 0 && (
                                                    <div className="absolute top-0 left-0 bg-[#28a745] text-white text-[8px] font-bold px-1 py-0.5 rounded-br">
                                                        FEATURE
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {!isEditing && !currentUser.location && (
                            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                                <h3 className="font-semibold text-blue-800">Your location</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-blue-700 mb-1">City / Region</label>
                                        <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-md bg-white">
                                            {regionsForSelectedCountry.map(reg => <option key={reg.name} value={reg.name}>{reg.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-blue-700 mb-1">Suburb</label>
                                        <input type="text" value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="e.g. Raglan" className="w-full px-3 py-2 border border-blue-200 rounded-md bg-white" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-end gap-2">
                                <div className="flex-grow">
                                    <FormInput
                                        label="Discount code"
                                        name="discountCode"
                                        value={discountCode}
                                        onChange={(e) => {
                                            setDiscountCode(e.target.value);
                                            if (appliedCode) {
                                                setAppliedCode(null);
                                                setDiscountSuccess(null);
                                            }
                                            if (discountError) {
                                                setDiscountError(null);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleApplyDiscount();
                                            }
                                        }}
                                        placeholder="Enter code"
                                        required={false}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleApplyDiscount}
                                    disabled={isValidatingCode || !discountCode.trim()}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 h-[42px]"
                                >
                                    {isValidatingCode ? '...' : 'Apply'}
                                </button>
                            </div>
                            {discountError && <p className="text-red-600 text-xs mt-1 font-medium">{discountError}</p>}
                            {discountSuccess && <p className="text-green-600 text-xs mt-1 font-medium">{discountSuccess}</p>}
                        </div>
                    </form>
                </div>

                <div className="p-8 pt-0">
                    <div className="border-t border-dashed border-[#cbd5e0] mb-4"></div>

                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xl font-bold text-[#1a202c]">Total:</span>
                        <span className={`text-xl font-bold ${appliedCode ? 'text-green-600' : 'text-[#4a5568]'}`}>
                            {appliedCode ? 'FREE' : `${currencySymbol}${currentTotal.toFixed(2)}`}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {isEditing ? (
                            <button
                                type="button"
                                onClick={() => handleFormSubmit()}
                                disabled={isSaving}
                                className="col-span-full py-3 px-6 text-base font-bold rounded-lg bg-[#5d87f5] hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Processing...' : 'Save Changes'}
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleSaveAndListAnother}
                                    disabled={isSaving}
                                    className="py-3 px-6 text-base font-bold rounded-lg bg-[#838996] hover:bg-gray-600 text-white transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Processing...' : 'Save & List Another'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleViewCartClick}
                                    disabled={isSaving}
                                    className="py-3 px-6 text-base font-bold rounded-lg bg-[#5d87f5] hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Processing...' : 'View Cart'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingForm;
