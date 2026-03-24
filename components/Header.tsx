import React, { useState, useRef, useEffect } from 'react';
import { User, BrandingState } from '../types';
import UserIcon from './icons/UserIcon';
import CogIcon from './icons/CogIcon';
import BellIcon from './icons/BellIcon';
import HeartIcon from './icons/HeartIcon';
import EditIcon from './icons/EditIcon';
import NotificationsDropdown from './NotificationsDropdown';
import AdminIcon from './icons/AdminIcon';
import CartIcon from './icons/CartIcon';
import PlusIcon from './icons/PlusIcon';
import QuestionIcon from './icons/QuestionIcon';
import XIcon from './icons/XIcon';

interface HeaderProps {
    branding: BrandingState;
    currentUser: User | null;
    onListBoardClick: () => void;
    onLoginClick: () => void;
    onLogout: () => void;
    onShowFavs: () => void;
    onShowMyListings: () => void;
    onShowAll: () => void;
    onAccountSettingsClick: () => void;
    onFaqClick: () => void;
    onContactClick: () => void;
    onAboutUsClick: () => void;
    onAdminClick: () => void;
    onCartClick: () => void;
    onMyAlertsClick: () => void;
    onNotificationClick: (notification: any) => void;
    cartItemCount: number;
    showTip: boolean;
    onCloseTip: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    branding,
    currentUser, 
    onListBoardClick, 
    onLoginClick, 
    onLogout, 
    onShowFavs, 
    onShowMyListings, 
    onShowAll, 
    onAccountSettingsClick,
    onFaqClick,
    onContactClick,
    onAboutUsClick,
    onAdminClick,
    onCartClick,
    onMyAlertsClick,
    onNotificationClick,
    cartItemCount,
    showTip,
    onCloseTip,
}) => {
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isHelpDropdownOpen, setIsHelpDropdownOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const userDropdownRef = useRef<HTMLDivElement>(null);
    const helpDropdownRef = useRef<HTMLDivElement>(null);
    const notificationsDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
            if (helpDropdownRef.current && !helpDropdownRef.current.contains(event.target as Node)) {
                setIsHelpDropdownOpen(false);
            }
            if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="bg-[#123156] shadow-md sticky top-0 z-20 h-16 md:h-20">
            <div className="container mx-auto px-4 lg:px-6 flex justify-between items-center h-full">
                <div 
                    className="cursor-pointer flex items-center h-full"
                    onClick={onShowAll}
                >
                    {/* Logo for desktop and tablet: Restored h-full to remove spacing artifacts */}
                    <div className="hidden md:flex items-center h-full">
                        <img src={branding.desktopLogo} alt="SurfDims Logo" className="h-full w-auto object-contain block" />
                    </div>

                    {/* Logo for mobile */}
                    <div className="md:hidden flex items-center h-full">
                        {branding.mobileLogo ? (
                            <img src={branding.mobileLogo} alt="SurfDims Logo" className="h-10 object-contain" />
                        ) : (
                             <h1 className="text-2xl font-extrabold text-white tracking-tight">
                                <span className="text-[#7fd4d8]">Surf</span>Dims
                            </h1>
                        )}
                    </div>
                </div>

                {showTip && (
                    <div className="hidden md:flex items-center flex-1 justify-center px-4">
                        <div className="bg-[#007bff] text-white px-4 py-1.5 rounded-full flex items-center gap-3 shadow-sm">
                            <span className="text-xs font-bold whitespace-nowrap uppercase tracking-wider">TIP: Tap logo to reset page</span>
                            <button onClick={(e) => { e.stopPropagation(); onCloseTip(); }} className="hover:opacity-80 transition-opacity p-0.5">
                                <XIcon className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 md:gap-4 h-full">
                    {/* List Board Button: Circle with Plus for Mobile, Text Button for Desktop */}
                    <button 
                        onClick={onListBoardClick}
                        className="md:hidden flex items-center justify-center h-10 w-10 rounded-full bg-[#7fd4d8] text-white shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={!!currentUser && !currentUser.isVerified}
                        title={!!currentUser && !currentUser.isVerified ? "Please verify your account to list a board" : "List a board"}
                    >
                        <PlusIcon className="h-7 w-7" />
                    </button>

                    <button 
                        onClick={onListBoardClick}
                        className="hidden md:flex items-center justify-center h-10 px-6 bg-white text-[#123156] font-bold rounded-lg shadow-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#123156] focus:ring-white transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={!!currentUser && !currentUser.isVerified}
                        title={!!currentUser && !currentUser.isVerified ? "Please verify your account to list a board" : "List a new or used surfboard"}
                    >
                        List Board
                    </button>
                    
                    {/* Help Dropdown: Visible for all users, but hidden on mobile when logged in to reduce clutter */}
                    <div className={`relative items-center ${currentUser ? 'hidden md:flex' : 'flex'}`} ref={helpDropdownRef}>
                         <button onClick={() => setIsHelpDropdownOpen(!isHelpDropdownOpen)} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#123156] focus:ring-white rounded-full flex items-center">
                            <QuestionIcon className="h-10 w-10 p-1.5 rounded-full text-white border-2 border-[#7fd4d8]" />
                        </button>
                        {isHelpDropdownOpen && (
                             <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-xl z-20 py-1">
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); onAboutUsClick(); setIsHelpDropdownOpen(false); }}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b"
                                >
                                    About us
                                </a>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); onFaqClick(); setIsHelpDropdownOpen(false); }}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b"
                                >
                                    FAQ
                                </a>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); onContactClick(); setIsHelpDropdownOpen(false); }}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Connect
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Notifications Bell */}
                    {currentUser && (
                        <div className="relative flex items-center" ref={notificationsDropdownRef}>
                            <button 
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                                className="relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#123156] focus:ring-white rounded-full flex items-center"
                            >
                                <BellIcon className="h-10 w-10 p-2 rounded-full text-white border-2 border-[#7fd4d8]" />
                                {(currentUser.notifications || []).filter(n => !n.isRead).length > 0 && (
                                    <span className="absolute -top-1 -right-1 block h-5 w-5 transform rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-[#123156]">
                                        {(currentUser.notifications || []).filter(n => !n.isRead).length}
                                    </span>
                                )}
                            </button>
                            {isNotificationsOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-md shadow-xl z-30 py-1 border border-gray-200">
                                    <div className="px-4 py-2 border-b border-gray-100 font-bold text-gray-800">Notifications</div>
                                    {(currentUser.notifications || []).filter(n => !n.isRead).length === 0 ? (
                                        <div className="px-4 py-6 text-center text-gray-500 text-sm italic">No new notifications</div>
                                    ) : (
                                        <div className="py-1">
                                            {(() => {
                                                const notifications = (currentUser.notifications || []).filter(n => !n.isRead);
                                                const expiredNotifications = notifications.filter(n => n.type === 'Expired Listing');
                                                const alertNotifications = notifications.filter(n => n.type === 'Alert Match');
                                                const priceNotifications = notifications.filter(n => n.type === 'Price Drop');
                                                
                                                return (
                                                    <>
                                                        {expiredNotifications.length > 0 && (
                                                            <button 
                                                                onClick={() => { onNotificationClick(expiredNotifications[0]); setIsNotificationsOpen(false); }}
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                                                            >
                                                                <span className="text-sm text-gray-700">[{expiredNotifications.length}] Expired Listing</span>
                                                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                                            </button>
                                                        )}
                                                        {alertNotifications.length > 0 && (
                                                            <button 
                                                                onClick={() => { onNotificationClick(alertNotifications[0]); setIsNotificationsOpen(false); }}
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                                                            >
                                                                <span className="text-sm text-gray-700">[{alertNotifications.length}] Alert Match</span>
                                                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                                            </button>
                                                        )}
                                                        {priceNotifications.length > 0 && (
                                                            <button 
                                                                onClick={() => { onNotificationClick(priceNotifications[0]); setIsNotificationsOpen(false); }}
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                                                            >
                                                                <span className="text-sm text-gray-700">[{priceNotifications.length}] Price drop</span>
                                                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                                            </button>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cart Icon */}
                    {currentUser && (
                        <button 
                            onClick={onCartClick} 
                            className="relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#123156] focus:ring-white rounded-full flex items-center"
                        >
                            <CartIcon className="h-10 w-10 p-2 rounded-full text-white border-2 border-[#7fd4d8]" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 block h-5 w-5 transform rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-[#123156]">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    )}

                    {/* User Dropdown */}
                    {currentUser ? (
                        <div className="relative flex items-center" ref={userDropdownRef}>
                            <button onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#123156] focus:ring-white rounded-full flex items-center">
                                {currentUser.avatar ? (
                                    <img src={currentUser.avatar} alt="User Avatar" className="h-10 w-10 rounded-full object-cover border-2 border-[#7fd4d8]" />
                                ) : (
                                    <UserIcon className="h-10 w-10 p-2 rounded-full bg-blue-100 text-[#123156] border-2 border-[#7fd4d8]" />
                                )}
                            </button>
                            {isUserDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-xl z-20 py-1">
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); onShowMyListings(); setIsUserDropdownOpen(false); }}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <EditIcon className="h-4 w-4" />
                                        My Listings
                                    </a>
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); onShowFavs(); setIsUserDropdownOpen(false); }}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <HeartIcon className="h-4 w-4" />
                                        My Favs
                                    </a>
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); onMyAlertsClick(); setIsUserDropdownOpen(false); }}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <BellIcon className="h-4 w-4" />
                                        My Alerts
                                    </a>
                                     <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); onAccountSettingsClick(); setIsUserDropdownOpen(false); }}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <CogIcon />
                                        My Account
                                    </a>
                                    {(currentUser.role === 'admin' || currentUser.email === 'eyemac2@gmail.com') && (
                                        <a
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); onAdminClick(); setIsUserDropdownOpen(false); }}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <AdminIcon />
                                            Admin Panel
                                        </a>
                                    )}
                                    <div className="md:hidden">
                                        <div className="border-t my-1"></div>
                                        <a
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); onAboutUsClick(); setIsUserDropdownOpen(false); }}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            About us
                                        </a>
                                        <a
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); onFaqClick(); setIsUserDropdownOpen(false); }}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            FAQ
                                        </a>
                                        <a
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); onContactClick(); setIsUserDropdownOpen(false); }}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Connect
                                        </a>
                                    </div>
                                    <div className="border-t my-1"></div>
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); onLogout(); setIsUserDropdownOpen(false); }}
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Logout
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button 
                            onClick={onLoginClick}
                            className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#123156] focus:ring-white rounded-full flex items-center"
                        >
                            <UserIcon className="h-10 w-10 p-2 rounded-full bg-blue-100 text-[#123156] border-2 border-[#7fd4d8]" />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;