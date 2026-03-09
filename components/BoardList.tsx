import React, { useMemo } from 'react';
import { ListItem, User, Surfboard, Advertisement, AppSettingsState, NotificationType } from '../types';
import BoardCard from './BoardCard';
import AdCard from './AdCard';
import BellIcon from './icons/BellIcon';

interface BoardListProps {
    items: ListItem[];
    users: User[];
    favs: string[];
    onToggleFavs: (boardId: string) => void;
    onSelectBoard: (boardId: string) => void;
    currentUser: User | null;
    onShare: (board: Surfboard) => void;
    onOpenLearnMore: () => void;
    onCreateAlert: () => void;
    hasMore: boolean;
    onShowMore: () => void;
    appSettings: AppSettingsState;
    isWelcomePage?: boolean;
    isFilterActive?: boolean;
    isFilterOpen?: boolean;
}

const BoardList: React.FC<BoardListProps> = ({ items, users, favs, onToggleFavs, onSelectBoard, currentUser, onShare, hasMore, onShowMore, appSettings, onCreateAlert, isWelcomePage, isFilterActive, isFilterOpen }) => {
    const sellerMap = useMemo(() => new Map<string, User>(users.map(user => [user.id, user])), [users]);

    const hasBoards = useMemo(() => items.some(item => item.type === 'board'), [items]);

    if (!hasBoards) {
        // This logic handles cases where there are no surfboards to display.
        if (items.length === 0) {
            // Case 1: No boards and no ads.
            if (isWelcomePage || !isFilterActive) return null;
            
            return (
                <div className="text-center py-12 px-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-gray-700">No Boards Found</h2>
                    <p className="text-gray-500 mt-2">Try adjusting your filter, check back later or…</p>
                    <button 
                        onClick={onCreateAlert}
                        className="mt-6 py-3 px-8 bg-[#e23030] text-white font-bold rounded-lg hover:brightness-110 transition flex items-center justify-center gap-2 mx-auto"
                    >
                        <BellIcon className="h-5 w-5" />
                        Create Alert
                    </button>
                </div>
            );
        } else {
            // Case 2: No boards, but there are ads. Display them in the grid.
            // This ensures ads always respect the column layout.
            return (
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${isFilterOpen ? 'md:grid-cols-1' : ''} lg:grid-cols-2 xl:grid-cols-3 gap-6`}>
                    {items.map(item => (
                        <AdCard key={item.id} ad={item as Advertisement} appSettings={appSettings} />
                    ))}
                </div>
            );
        }
    }

    // Case 3: There is at least one board, potentially mixed with ads.
    return (
        <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isFilterOpen ? 'md:grid-cols-1' : ''} lg:grid-cols-2 xl:grid-cols-3 gap-6`}>
                {items.map(item => {
                    if (item.type === 'ad') {
                        return <AdCard key={item.id} ad={item} appSettings={appSettings} />;
                    }

                    // It's a board
                    const board = item;
                    const seller = sellerMap.get(board.sellerId);
                    if (!seller) return null; // Should not happen in a consistent dataset

                    // Determine label from notifications or price drop
                    let label = undefined;
                    if (currentUser) {
                        const notifications = currentUser.notifications || [];
                        const notification = notifications.find(n => n.boardId === board.id && !n.isRead);
                        if (notification) {
                            if (notification.type === NotificationType.AlertMatch) label = 'Alert match';
                            else if (notification.type === NotificationType.PriceDrop) label = 'Price change';
                            else if (notification.type === NotificationType.ExpiredListing) label = 'Expired';
                        }
                    }
                    
                    // Fallback for demo: if it has an original price and no label yet, show 'Price change'
                    if (!label && board.originalPrice && board.originalPrice > board.price) {
                        label = 'Price change';
                    }

                    return (
                        <BoardCard
                            key={board.id}
                            board={board}
                            seller={seller}
                            isFavourited={favs.includes(board.id)}
                            onToggleFavs={onToggleFavs}
                            onSelect={() => onSelectBoard(board.id)}
                            currentUser={currentUser}
                            onShare={onShare}
                            label={label}
                        />
                    );
                })}
            </div>
            {hasMore && (
                <div className="text-center mt-10">
                    <button
                        onClick={onShowMore}
                        className="py-3 px-8 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    >
                        Show More
                    </button>
                </div>
            )}
        </>
    );
};

export default BoardList;