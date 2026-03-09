import React, { useRef, useEffect } from 'react';
import { AppNotification, NotificationType } from '../types';
import BellIcon from './icons/BellIcon';

interface NotificationsDropdownProps {
    notifications: AppNotification[];
    onNotificationClick: (notification: AppNotification) => void;
    onClose: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ notifications, onNotificationClick, onClose }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const groupedNotifications = {
        [NotificationType.ExpiredListing]: notifications.filter(n => n.type === NotificationType.ExpiredListing && !n.isRead).length,
        [NotificationType.AlertMatch]: notifications.filter(n => n.type === NotificationType.AlertMatch && !n.isRead).length,
        [NotificationType.PriceDrop]: notifications.filter(n => n.type === NotificationType.PriceDrop && !n.isRead).length,
    };

    return (
        <div className="relative flex items-center" ref={dropdownRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); }} 
                className="relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#123156] focus:ring-white rounded-full flex items-center"
            >
                <BellIcon className="h-10 w-10 p-2 rounded-full text-white border-2 border-[#7fd4d8]" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 block h-5 w-5 transform rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-[#123156]">
                        {unreadCount}
                    </span>
                )}
            </button>
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-md shadow-xl z-30 py-1 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100 font-bold text-gray-800">Notifications</div>
                {unreadCount === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm italic">No new notifications</div>
                ) : (
                    <div className="py-1">
                        {groupedNotifications[NotificationType.ExpiredListing] > 0 && (
                            <button 
                                onClick={() => onNotificationClick(notifications.find(n => n.type === NotificationType.ExpiredListing)!)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                            >
                                <span className="text-sm text-gray-700">[{groupedNotifications[NotificationType.ExpiredListing]}] Expired Listing</span>
                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            </button>
                        )}
                        {groupedNotifications[NotificationType.AlertMatch] > 0 && (
                            <button 
                                onClick={() => onNotificationClick(notifications.find(n => n.type === NotificationType.AlertMatch)!)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                            >
                                <span className="text-sm text-gray-700">[{groupedNotifications[NotificationType.AlertMatch]}] Alert Match</span>
                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            </button>
                        )}
                        {groupedNotifications[NotificationType.PriceDrop] > 0 && (
                            <button 
                                onClick={() => onNotificationClick(notifications.find(n => n.type === NotificationType.PriceDrop)!)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                            >
                                <span className="text-sm text-gray-700">[{groupedNotifications[NotificationType.PriceDrop]}] Price drop</span>
                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsDropdown;
