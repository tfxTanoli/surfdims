
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, collection, query, onSnapshot, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth, db, setupOnMessageListener } from './firebase';
import AuthModal from './components/AuthModal';
import { Surfboard, FilterState, User, SurfboardStatus, ListItem, SortOption, Alert, BrandingState, AppNotification, AppSettingsState, DonationEntry, VerificationFlowStatus, Condition } from './types';
import { INITIAL_BOARDS, MOCK_USERS, SLIDER_RANGES, DEFAULT_BRANDING, MOCK_ENTRIES } from './constants';
import { getCurrencySymbol, getNewBoardFee, getUsedBoardFee } from './countries';
import Header from './components/Header';
import BoardList from './components/BoardList';
import FilterPanel from './components/FilterPanel';
import StagedBoardsCart from './components/StagedBoardsCart';
import ListingForm from './components/ListingForm';

import XIcon from './components/icons/XIcon';
import FilterIcon from './components/icons/FilterIcon';
import ListingDetail from './components/ListingDetail';
import NotificationModal from './components/NotificationModal';
import AccountSettingsModal from './components/AccountSettingsModal';
import PaymentModal from './components/PaymentModal';
import FaqPage from './components/FaqPage';
import ContactPage from './components/ContactPage';
import AdminPage from './components/AdminPage';
import SortIcon from './components/icons/SortIcon';
import ShareModal from './components/ShareModal';
import LearnMoreModal from './components/LearnMoreModal';
import VerificationBanner from './components/VerificationBanner';

import CharityModal from './components/CharityModal';
import VolumeCalculatorModal from './components/VolumeCalculatorModal';

import AboutUsPage from './components/AboutUsPage';
import MyAlertsPage from './components/MyAlertsPage';
import AlertCreationModal from './components/AlertCreationModal';
import { AdminAd, NotificationType } from './types';

const initialFilters: FilterState = {
    brand: '',
    country: 'All',
    finSystem: 'All' as any,
    finSetup: 'All' as any,
    minLength: SLIDER_RANGES.length.min,
    maxLength: SLIDER_RANGES.length.max,
    minWidth: SLIDER_RANGES.width.min,
    maxWidth: SLIDER_RANGES.width.max,
    minThickness: SLIDER_RANGES.thickness.min,
    maxThickness: SLIDER_RANGES.thickness.max,
    minVolume: SLIDER_RANGES.volume.min,
    maxVolume: SLIDER_RANGES.volume.max,
    condition: 'All' as any,
};

const App: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [boards, setBoards] = useState<Surfboard[]>([]);
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [donationEntries, setDonationEntries] = useState<DonationEntry[]>(MOCK_ENTRIES);
    const [isListingFormOpen, setIsListingFormOpen] = useState(false);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

    const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [view, setView] = useState<'all' | 'favs' | 'myListings'>('all');
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [notificationBoard, setNotificationBoard] = useState<Surfboard | null>(null);
    const [notificationSearchTerm, setNotificationSearchTerm] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [boardsForPayment, setBoardsForPayment] = useState<Omit<Surfboard, 'id'>[]>([]);
    const [stagedNewBoards, setStagedNewBoards] = useState<Omit<Surfboard, 'id'>[]>([]);
    const [stagedUsedBoard, setStagedUsedBoard] = useState<Omit<Surfboard, 'id'> | null>(null);
    const [stagedLocation, setStagedLocation] = useState<{ region: string; suburb: string } | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentDescription, setPaymentDescription] = useState<string>('');
    const [isFaqOpen, setIsFaqOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [editingBoard, setEditingBoard] = useState<Surfboard | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOption>('date_desc');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [boardToShare, setBoardToShare] = useState<Surfboard | null>(null);
    const [branding, setBranding] = useState<BrandingState>(DEFAULT_BRANDING);
    const [appSettings, setAppSettings] = useState<AppSettingsState>({ mailchimpApiKey: '', adsenseCode: '', contactEmail: 'info@surfdims.com' });

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
    const [isCharityModalOpen, setIsCharityModalOpen] = useState(false);
    const [isVolumeCalculatorOpen, setIsVolumeCalculatorOpen] = useState(false);
    const [giveawayImages, setGiveawayImages] = useState<string[]>([]);
    const [verificationStatus, setVerificationStatus] = useState<VerificationFlowStatus>('unverified');
    const [visibleListingsCount, setVisibleListingsCount] = useState(15);
    const [adminAds, setAdminAds] = useState<AdminAd[]>([]);
    const [adRotationOffset, setAdRotationOffset] = useState(0);
    const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
    const [isMyAlertsOpen, setIsMyAlertsOpen] = useState(false);
    const [isAlertCreationModalOpen, setIsAlertCreationModalOpen] = useState(false);
    const [showTip, setShowTip] = useState(() => {
        const saved = localStorage.getItem('surfdims-show-tip');
        return saved === null ? true : saved === 'true';
    });
    const [alertCreationMessage, setAlertCreationMessage] = useState('');
    const [alertCreationTitle, setAlertCreationTitle] = useState('My Alerts');
    const [alertCreationIconType, setAlertCreationIconType] = useState<'heart' | 'bell'>('bell');
    const [alertCreationSuccessMessage, setAlertCreationSuccessMessage] = useState('');
    const [showSureNoThanks, setShowSureNoThanks] = useState(false);
    const [pendingAlertBoard, setPendingAlertBoard] = useState<Surfboard | null>(null);
    const [isAdminPageOpen, setIsAdminPageOpen] = useState(false);
    const [authModalInitialIsLogin, setAuthModalInitialIsLogin] = useState(true);

    const mobileSortDropdownRef = useRef<HTMLDivElement>(null);
    const desktopSortDropdownRef = useRef<HTMLDivElement>(null);
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
    const [boardToRenewId, setBoardToRenewId] = useState<string | null>(null);
    const [foregroundNotification, setForegroundNotification] = useState<{title: string, body: string} | null>(null);

    // Auth Modal State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('login');
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isStagedCartOpen, setIsStagedCartOpen] = useState(false);
    const [authReason, setAuthReason] = useState<string>('');
    const scrollPosRef = React.useRef(0);

    useEffect(() => {
        setVisibleListingsCount(15);
    }, [filters, view, sortOrder]);

    useEffect(() => {
        if (currentUser) {
            try {
                const saved = localStorage.getItem(`surfdims-staged-boards-${currentUser.id}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) setStagedNewBoards(parsed);
                }
            } catch (e) { console.error(e); }
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            try {
                localStorage.setItem(`surfdims-staged-boards-${currentUser.id}`, JSON.stringify(stagedNewBoards));
            } catch (e) { console.error(e); }
        }
    }, [stagedNewBoards, currentUser]);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallPrompt = useCallback(async () => {
        try {
            if (!deferredInstallPrompt) {
                alert('App is already installed or your browser does not support this feature.');
                return;
            }
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            setDeferredInstallPrompt(null);
        } catch (error) {
            console.error("Error showing install prompt:", error);
        }
    }, [deferredInstallPrompt]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Remove individual getDoc as we'll use onSnapshot for real-time updates
                setIsAuthLoading(false);
            } else {
                setCurrentUser(null);
                setFilters(initialFilters);
                setIsAuthLoading(false);
            }
        });

        try {
            const savedBranding = localStorage.getItem('surfDimsBranding');
            if (savedBranding) {
                const parsed = JSON.parse(savedBranding);
                if (parsed && typeof parsed === 'object') setBranding(prev => ({ ...prev, ...parsed }));
            }
        } catch (e) { console.error(e); }

        try {
            const savedAppSettings = localStorage.getItem('surfDimsAppSettings');
            if (savedAppSettings) {
                const parsed = JSON.parse(savedAppSettings);
                if (parsed && typeof parsed === 'object') setAppSettings(prev => ({ ...prev, ...parsed }));
            }
        } catch (e) { console.error(e); }

        try {
            const savedGiveawayImages = localStorage.getItem('surfDimsGiveawayImages');
            if (savedGiveawayImages) {
                const parsed = JSON.parse(savedGiveawayImages);
                if (Array.isArray(parsed)) setGiveawayImages(parsed);
            }
        } catch (e) { console.error(e); }

        setupOnMessageListener((payload: any) => {
            console.log('Received foreground message', payload);
            setForegroundNotification({
                title: payload?.notification?.title || 'Notification',
                body: payload?.notification?.body || 'You have a new message.'
            });
            setTimeout(() => setForegroundNotification(null), 5000); // 5 seconds display
        });

        return () => unsubscribe();
    }, []);

    // Unified current user document listener
    useEffect(() => {
        if (!auth.currentUser) return;

        const unsubscribe = onSnapshot(doc(db, "users", auth.currentUser.uid), (userDoc) => {
            if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                const isVerified = userData.isVerified || (auth.currentUser?.emailVerified ?? false);
                let role = userData.role;
                if (auth.currentUser?.email === 'eyemac2@gmail.com') {
                    role = 'superadmin';
                }
                const currentUserData = { ...userData, id: auth.currentUser.uid, isVerified, role };

                setCurrentUser(currentUserData);
                setFilters(prev => ({ ...prev, country: currentUserData.country || 'All' }));

                // Update users list with current user data
                setUsers(prev => {
                    const exists = prev.find(u => u.id === auth.currentUser?.uid);
                    if (exists) return prev.map(u => u.id === auth.currentUser?.uid ? currentUserData : u);
                    return [...prev, currentUserData];
                });
            }
        }, (error) => {
            console.error("Current User document listener error:", error);
        });

        // Request and save push token once when user logs in (not on every doc change)
        import('./firebase').then(({ requestPushToken }) => {
            requestPushToken().then((token) => {
                if (token) {
                    const apiUrl = '/api/save-token';

                    fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token, userId: auth.currentUser?.uid })
                    }).catch(err => console.error("Error saving push token:", err));
                }
            }).catch(err => console.error("Error requesting push token:", err));
        }).catch(err => console.error("Error importing firebase for messaging:", err));

        return () => unsubscribe();
    }, [auth.currentUser]);

    // Handle user data synchronization (verification, admin role)
    useEffect(() => {
        if (!currentUser || !auth.currentUser) return;

        const syncUserData = async () => {
            try {
                const updates: Partial<User> = {};
                
                // Auto-verify if email is verified but Firestore is not updated
                if (auth.currentUser?.emailVerified && !currentUser.isVerified) {
                    updates.isVerified = true;
                }

                // Force superadmin role for the specific email if not already set
                if (auth.currentUser?.email === 'eyemac2@gmail.com' && currentUser.role !== 'superadmin') {
                    updates.role = 'superadmin';
                }

                if (Object.keys(updates).length > 0) {
                    await setDoc(doc(db, "users", auth.currentUser.uid), updates, { merge: true });
                }
            } catch (error) {
                console.error("Error syncing user data to Firestore:", error);
            }
        };

        syncUserData();
    }, [currentUser?.id, currentUser?.isVerified, currentUser?.role, auth.currentUser?.emailVerified]);

    useEffect(() => {
        if (currentUser?.role !== 'admin' && currentUser?.role !== 'superadmin' && currentUser?.email !== 'eyemac2@gmail.com') return;

        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const usersData: User[] = [];
            querySnapshot.forEach((doc) => {
                usersData.push({ id: doc.id, ...doc.data() } as User);
            });
            setUsers(prev => {
                const userMap = new Map<string, User>();
                MOCK_USERS.forEach(u => userMap.set(u.id, u));
                usersData.forEach(u => userMap.set(u.id, u));
                return Array.from(userMap.values());
            });
        }, (error) => {
            console.error("Admin Users collection listener error:", error);
        });
        return () => unsubscribe();
    }, [currentUser?.role]);

    useEffect(() => {
        const q = query(collection(db, "boards"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const boardsData: Surfboard[] = [];
            querySnapshot.forEach((doc) => {
                boardsData.push({ id: doc.id, ...doc.data() } as Surfboard);
            });
            setBoards(boardsData);
        }, (error) => {
            console.error("Boards listener error:", error);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const q = query(collection(db, "ads"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const adsData: AdminAd[] = [];
            querySnapshot.forEach((doc) => {
                adsData.push({ id: doc.id, ...doc.data() } as AdminAd);
            });
            setAdminAds(adsData);
        }, (error) => {
            console.error("Ads listener error:", error);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "branding", "settings"), (doc) => {
            if (doc.exists()) {
                const brandingData = doc.data() as BrandingState;
                setBranding(brandingData);
                try {
                    localStorage.setItem('surfDimsBranding', JSON.stringify(brandingData));
                } catch (e) { console.error(e); }
            }
        }, (error) => {
            console.error("Branding listener error:", error);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setAdRotationOffset(prev => prev + 1);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const boardIdFromUrl = urlParams.get('boardId');

        if (boardIdFromUrl && boards.some(b => b.id === boardIdFromUrl)) {
            if (selectedBoardId !== boardIdFromUrl) {
                handleSelectBoard(boardIdFromUrl);
            }
        }

        const handlePopState = (event: PopStateEvent) => {
            const boardIdFromState = event.state?.boardId ?? null;
            if (boardIdFromState) {
                handleSelectBoard(boardIdFromState);
            } else {
                setSelectedBoardId(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [boards]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isClickInsideMobile = mobileSortDropdownRef.current?.contains(event.target as Node);
            const isClickInsideDesktop = desktopSortDropdownRef.current?.contains(event.target as Node);
            if (!isClickInsideMobile && !isClickInsideDesktop) setIsSortDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const now = new Date();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;

        let boardsHaveChanged = false;
        let updatedBoards = boards.map(board => {
            if (board.status === SurfboardStatus.Live) {
                const listedDate = new Date(board.listedDate);
                const timeSinceListed = now.getTime() - listedDate.getTime();
                let isExpired = timeSinceListed > thirtyDaysInMs;
                if (isExpired) {
                    boardsHaveChanged = true;

                    // Notify seller
                    const seller = users.find(u => u.id === board.sellerId);
                    if (seller) {
                        const firstListedDate = board.firstListedDate ? new Date(board.firstListedDate) : listedDate;
                        const totalTimeLive = now.getTime() - firstListedDate.getTime();
                        const isHardExpiry = totalTimeLive >= ninetyDaysInMs;

                        const message = isHardExpiry
                            ? `This listing has now been live 90 days. You can pay to make the listing active for another 90 days or delete it.`
                            : `Your listing for ${board.brand} ${board.model} has expired.`;

                        const newNotification: AppNotification = {
                            id: Math.random().toString(36).substr(2, 9),
                            type: NotificationType.ExpiredListing,
                            message: message,
                            boardId: board.id,
                            isRead: false,
                            createdAt: new Date().toISOString()
                        };
                        const updatedUser = {
                            ...seller,
                            notifications: [newNotification, ...(seller.notifications || [])]
                        };
                        setDoc(doc(db, "users", seller.id), updatedUser);
                        if (currentUser && seller.id === currentUser.id) {
                            setCurrentUser(updatedUser);
                        }
                    }

                    return {
                        ...board,
                        status: SurfboardStatus.Expired,
                        lifecycleStatus: 'inactive' as const,
                        inactiveAt: new Date().toISOString()
                    };
                }
            }
            return board;
        });

        const preDeleteCount = updatedBoards.length;
        updatedBoards = updatedBoards.filter(board => {
            if (board.status === SurfboardStatus.Expired) {
                const inactiveAt = board.inactiveAt ? new Date(board.inactiveAt) : null;
                if (inactiveAt) {
                    const timeSinceInactive = now.getTime() - inactiveAt.getTime();
                    if (timeSinceInactive > thirtyDaysInMs) return false;
                }
            }
            return true;
        });

        if (preDeleteCount !== updatedBoards.length) boardsHaveChanged = true;
        if (boardsHaveChanged) setBoards(updatedBoards);

        if (!currentUser) {
            setNotifications([]);
            return;
        }

        let savedNotifications: AppNotification[] = [];
        try {
            const stored = localStorage.getItem(`surfdims-notifications-${currentUser.id}`);
            if (stored) savedNotifications = JSON.parse(stored);
        } catch (e) { console.error(e); }

        const userBoards = updatedBoards.filter(b => b.sellerId === currentUser.id && b.status === SurfboardStatus.Live);
        const newNotifications: AppNotification[] = [];
        const oneDayInMs = 24 * 60 * 60 * 1000;

        userBoards.forEach(board => {
            const nowTime = now.getTime();
            const listedDate = new Date(board.listedDate);
            const expiryTime = listedDate.getTime() + thirtyDaysInMs;

            const daysUntilExpiry = Math.ceil((expiryTime - nowTime) / oneDayInMs);
            if (daysUntilExpiry >= 0 && daysUntilExpiry <= 7) {
                if (!savedNotifications.find(n => n.boardId === board.id)) {
                    const message = daysUntilExpiry > 0
                        ? `Your listing for "${board.brand} ${board.model}" expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.`
                        : `Your listing for "${board.brand} ${board.model}" expires today.`;
                    newNotifications.push({
                        id: `notif-${board.id}-${Date.now()}`,
                        type: NotificationType.ExpiredListing,
                        boardId: board.id,
                        message: message,
                        isRead: false,
                        createdAt: now.toISOString(),
                    });
                }
            }
        });

        if (newNotifications.length > 0) {
            const allNotifications = [...savedNotifications, ...newNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setNotifications(allNotifications);
            try {
                localStorage.setItem(`surfdims-notifications-${currentUser.id}`, JSON.stringify(allNotifications));
            } catch (e) { console.error(e); }
        } else {
            setNotifications(savedNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
    }, [currentUser]);

    useEffect(() => {
        if (isFilterPanelOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isFilterPanelOpen]);

    const handleCloseDetail = useCallback(() => {
        setSelectedBoardId(null);
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => {
            window.scrollTo(0, scrollPosRef.current);
        }, 0);
    }, []);

    const handleSelectBoard = useCallback((boardId: string | null) => {
        if (!boardId) {
            handleCloseDetail();
            return;
        }
        const board = boards.find(b => b.id === boardId);
        if (board) {
            scrollPosRef.current = window.scrollY;
            setSelectedBoardId(boardId);
            if (window.location.search !== `?boardId=${boardId}`) {
                window.history.pushState({ boardId }, '', `?boardId=${boardId}`);
            }
            window.scrollTo(0, 0);
        } else if (!board && selectedBoardId) {
            handleCloseDetail();
        }
    }, [boards, selectedBoardId, handleCloseDetail]);

    const checkAlertsForBoard = useCallback(async (board: Surfboard) => {
        // In a real app, this would be a cloud function.
        // For this prototype, we'll simulate it by checking all users in the 'users' state.
        const matchingUsers = users.filter(user => {
            if (user.id === board.sellerId) return false;
            const alerts = user.alerts || [];
            return alerts.some(alert => {
                const brandMatch = !alert.brand || board.brand.toLowerCase().includes(alert.brand.toLowerCase());
                const modelMatch = !alert.model || board.model.toLowerCase().includes(alert.model.toLowerCase());

                // For simplicity, we check the first dimension
                const dim = board.dimensions[0];
                if (!dim) return brandMatch && modelMatch;

                const volMatch = dim.volume >= alert.volumeMin && dim.volume <= alert.volumeMax;
                const lenMatch = dim.length >= alert.lengthMin && dim.length <= alert.lengthMax;
                const widMatch = dim.width >= alert.widthMin && dim.width <= alert.widthMax;
                const thickMatch = dim.thickness >= alert.thicknessMin && dim.thickness <= alert.thicknessMax;
                const setupMatch = alert.finSetup === 'All' || board.finSetup === alert.finSetup;
                const systemMatch = alert.finSystem === 'All' || board.finSystem === alert.finSystem;

                return brandMatch && modelMatch && volMatch && lenMatch && widMatch && thickMatch && setupMatch && systemMatch;
            });
        });

        for (const user of matchingUsers) {
            const newNotification: AppNotification = {
                id: Math.random().toString(36).substr(2, 9),
                type: NotificationType.AlertMatch,
                message: `New match found: ${board.brand} ${board.model}`,
                boardId: board.id,
                isRead: false,
                createdAt: new Date().toISOString()
            };

            const updatedUser = {
                ...user,
                favs: [...new Set([...(user.favs || []), board.id])],
                notifications: [newNotification, ...(user.notifications || [])]
            };

            await setDoc(doc(db, "users", user.id), updatedUser);
            if (currentUser && user.id === currentUser.id) {
                setCurrentUser(updatedUser);
            }
        }
    }, [users, db, currentUser]);

    const handleAddUsedBoard = useCallback(async (newBoard: Omit<Surfboard, 'id'>, location?: { region: string, suburb: string }) => {
        if (!currentUser) return;
        const newBoardId = `board-${Date.now()}`;
        const now = new Date();
        const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
        const expiresAt = new Date(now.getTime() + ninetyDaysInMs).toISOString();

        const newBoardData: Surfboard = {
            ...newBoard,
            id: newBoardId,
            sellerId: currentUser.id,
            status: SurfboardStatus.Live,
            listedDate: now.toISOString(),
            expiresAt: expiresAt,
            isPaid: false,
            discountCodeId: newBoard.discountCodeId || null,
            ownerId: currentUser.id,
            listingType: 'used',
            lifecycleStatus: 'active',
            createdAt: serverTimestamp(),
            inactiveAt: null,
            storagePath: `images/${currentUser.id}`
        };

        const boardWithId = Object.fromEntries(
            Object.entries(newBoardData).filter(([_, v]) => v !== undefined)
        ) as any;

        try {
            await setDoc(doc(db, "boards", newBoardId), boardWithId);

            // Increment discount code usage if applicable
            if (boardWithId.discountCodeId) {
                try {
                    const codeRef = doc(db, "discountCodes", boardWithId.discountCodeId);
                    const codeDoc = await getDoc(codeRef);
                    if (codeDoc.exists()) {
                        const currentCount = codeDoc.data().usageCount || 0;
                        await updateDoc(codeRef, { usageCount: currentCount + 1 });
                    }
                } catch (err) {
                    console.error("Error incrementing discount usage:", err);
                }
            }

            if (location) {
                const updatedUser: User = { ...currentUser, location: `${location.suburb}, ${location.region}` };
                setCurrentUser(updatedUser);
                await setDoc(doc(db, "users", currentUser.id), updatedUser);
                setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            }
            setIsListingFormOpen(false);
            handleSelectBoard(newBoardId);

            // Trigger alert check
            checkAlertsForBoard(boardWithId);
        } catch (error: any) {
            console.error("Error adding board", error);
            alert("Failed to create listing. Please try again.");
        }
    }, [currentUser, handleSelectBoard, db, checkAlertsForBoard]);

    const handleRelistBoard = useCallback(async (boardId: string) => {
        const now = new Date();
        const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
        const expiresAt = new Date(now.getTime() + ninetyDaysInMs);
        try {
            await updateDoc(doc(db, "boards", boardId), {
                status: SurfboardStatus.Live,
                lifecycleStatus: 'active',
                inactiveAt: null,
                listedDate: now.toISOString(),
                firstListedDate: now.toISOString(),
                expiresAt: expiresAt.toISOString()
            });
            alert('Board has been relisted for another 90 days!');
        } catch (error) {
            console.error("Error relisting board", error);
            alert("Failed to relist board.");
        }
    }, [db]);

    const handlePaymentSuccess = async (paymentIntentId: string, boards?: Omit<Surfboard, 'id'>[], donationBoard?: Omit<Surfboard, 'id'>, amount?: number) => {
        if (boardToRenewId) {
            await handleRelistBoard(boardToRenewId);
            setBoardToRenewId(null);
            setIsPaymentModalOpen(false);
            setPaymentAmount(0);
            return;
        }

        const currentBoardsForPayment = boards || boardsForPayment;
        const currentStagedUsedBoard = donationBoard || stagedUsedBoard;
        const currentPaymentAmount = amount !== undefined ? amount : paymentAmount;

        if (currentStagedUsedBoard && currentUser) {
            const donationAmountValue = currentPaymentAmount;
            const newEntry: DonationEntry = {
                id: `entry-${Date.now()}`,
                userId: currentUser.id,
                userEmail: currentUser.email,
                entries: donationAmountValue,
                amount: donationAmountValue,
                date: new Date().toISOString(),
            };
            setDonationEntries(prev => [newEntry, ...prev]);
            await handleAddUsedBoard(currentStagedUsedBoard, stagedLocation);
            alert(`Thanks for your donation! Your board is now listed.`);
        } else if (currentBoardsForPayment.length > 0 && currentUser) {
            try {
                const newIds: string[] = [];
                const promises = currentBoardsForPayment.map(async (board) => {
                    const newId = `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    newIds.push(newId);
                    const now = new Date();
                    const newBoard: Surfboard = {
                        ...board,
                        id: newId,
                        sellerId: currentUser.id,
                        status: SurfboardStatus.Live,
                        listedDate: now.toISOString(),
                        expiresAt: new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)).toISOString(),
                        isPaid: false,
                        discountCodeId: board.discountCodeId || null,
                        ownerId: currentUser.id,
                        listingType: board.condition === Condition.New ? 'new' : 'used',
                        lifecycleStatus: 'active',
                        createdAt: serverTimestamp(),
                        inactiveAt: null,
                        storagePath: `images/${currentUser.id}`,
                        paymentIntentId: paymentIntentId || null
                    };

                    const sanitizedBoard = Object.fromEntries(
                        Object.entries(newBoard).filter(([_, v]) => v !== undefined)
                    ) as any;

                    console.log("Attempting to write board:", sanitizedBoard);
                    try {
                        await setDoc(doc(db, "boards", newId), sanitizedBoard);
                    } catch (e) {
                        console.error("Firebase write error for board", sanitizedBoard, e);
                        throw e;
                    }

                    return sanitizedBoard;
                });

                const writtenBoards = await Promise.all(promises);

                // Send any boards with discount codes to the secure backend to activate and increment usage tracking
                if (paymentIntentId === 'free_discount_code' || paymentIntentId === null) {
                    const discountMap = new Map<string, string[]>();
                    writtenBoards.forEach(board => {
                        if (board.discountCodeId) {
                            if (!discountMap.has(board.discountCodeId)) discountMap.set(board.discountCodeId, []);
                            discountMap.get(board.discountCodeId)!.push(board.id);
                        }
                    });

                    for (const [discountCodeId, boardIds] of discountMap.entries()) {
                        try {
                            const apiUrl = '/api/apply-discount';

                            const response = await fetch(apiUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ discountCodeId, boardIds }),
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                console.error('Failed to apply discount securely:', errorData);
                                alert(`Failed to verify discount code logic: ${errorData.error}`);
                            }
                        } catch (err) {
                            console.error('Network error calling apply-discount API:', err);
                        }
                    }
                }

                if (stagedLocation) {
                    try {
                        const updatedUser: User = { ...currentUser, location: `${stagedLocation.suburb}, ${stagedLocation.region}` };
                        setCurrentUser(updatedUser);
                        await setDoc(doc(db, "users", currentUser.id), updatedUser);
                        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                    } catch (e) {
                        console.error("Firebase write error for user update", e);
                        throw e;
                    }
                }
                const totalListedCount = currentBoardsForPayment.reduce((count, board) => count + board.dimensions.length, 0);
                alert(`Payment successful! Your ${totalListedCount} board(s) are now listed.`);
                if (newIds.length > 0) handleSelectBoard(newIds[newIds.length - 1]);
            } catch (error: any) {
                console.error("Detailed Error creating new boards:", error, "Message:", error.message, "Code:", error.code);
                alert("Failed to create listings. Please check console for precise error log.");
            }
        }

        setIsPaymentModalOpen(false);
        setBoardsForPayment([]);
        setStagedUsedBoard(null);
        setStagedLocation(null);
        setStagedNewBoards([]);
        setPaymentAmount(0);
        setPaymentDescription('');
    };

    const handlePaymentCancel = () => {
        setIsPaymentModalOpen(false);
        setBoardsForPayment([]);
        setStagedUsedBoard(null);
        setStagedLocation(null);
        setPaymentAmount(0);
        setPaymentDescription('');
        setBoardToRenewId(null);
    };

    const handleStageAndReset = useCallback((newBoards: Omit<Surfboard, 'id'>[], location?: { region: string; suburb: string; }) => {
        setStagedNewBoards(prev => [...prev, ...newBoards]);
        if (location) setStagedLocation(location);
    }, []);

    const handleStageAndPay = useCallback((finalBoards: Omit<Surfboard, 'id'>[], location?: { region: string; suburb: string; }) => {
        const allBoardsToPay = [...stagedNewBoards, ...finalBoards];
        setBoardsForPayment(allBoardsToPay);
        if (currentUser) {
            const newFee = getNewBoardFee(currentUser.country);
            const usedFee = getUsedBoardFee(currentUser.country);

            const totalCost = allBoardsToPay.reduce((total, board) => {
                if (board.isPaid) return total;
                const fee = board.condition === Condition.New ? newFee : usedFee;
                return total + (fee * board.dimensions.length);
            }, 0);

            if (totalCost === 0) {
                handlePaymentSuccess('free_discount_code', allBoardsToPay);
                return;
            }

            setPaymentAmount(totalCost);
            setPaymentDescription(`${allBoardsToPay.length} listing(s)`)
        }
        if (location) setStagedLocation(location);
        setIsListingFormOpen(false);
        setIsPaymentModalOpen(true);
    }, [stagedNewBoards, currentUser, handlePaymentSuccess]);

    const handleDonateAndList = useCallback((board: Omit<Surfboard, 'id'>, donationAmount: number, location?: { region: string; suburb: string; }) => {
        setStagedUsedBoard(board);
        if (location) setStagedLocation(location);
        setPaymentAmount(donationAmount);
        setPaymentDescription(`${donationAmount} entries for your donation`);
        setIsPaymentModalOpen(true);
    }, []);

    const handleUpdateBoard = useCallback(async (updatedBoard: Surfboard) => {
        try {
            // Only send editable fields to avoid Firestore rules rejecting immutable field changes
            const editableFields: Record<string, any> = {
                brand: updatedBoard.brand,
                model: updatedBoard.model,
                price: updatedBoard.price,
                dimensions: updatedBoard.dimensions,
                finSystem: updatedBoard.finSystem,
                finSetup: updatedBoard.finSetup,
                description: updatedBoard.description,
                images: updatedBoard.images,
                thumbnails: updatedBoard.thumbnails || [],
            };
            await updateDoc(doc(db, "boards", updatedBoard.id), editableFields);
            setIsListingFormOpen(false);
            setEditingBoard(null);
            setSelectedBoardId(updatedBoard.id);
            alert('Your listing has been updated!');
            // Price drop notifications are handled server-side by the onBoardUpdate Cloud Function
        } catch (error) {
            console.error("Error updating board", error);
            alert("Failed to update listing.");
        }
    }, [boards, db]);

    const handleBrandingUpdate = useCallback(async (newBranding: BrandingState) => {
        setBranding(newBranding);
        try {
            await setDoc(doc(db, "branding", "settings"), newBranding);
            localStorage.setItem('surfDimsBranding', JSON.stringify(newBranding));
        } catch (e) {
            console.error("Failed to save branding to Firestore", e);
            alert('Failed to save branding settings.');
        }
    }, []);

    const handleAppSettingsUpdate = useCallback((newSettings: AppSettingsState) => {
        setAppSettings(newSettings);
        try {
            localStorage.setItem('surfDimsAppSettings', JSON.stringify(newSettings));
            alert('App settings updated!');
        } catch (e) { console.error(e); }
    }, []);

    const handleGiveawayImagesUpdate = useCallback((images: string[]) => {
        setGiveawayImages(images);
        try {
            localStorage.setItem('surfDimsGiveawayImages', JSON.stringify(images));
            alert('Giveaway images updated!');
        } catch (e) { console.error(e); }
    }, []);

    const handleAdminAdsUpdate = useCallback(async (updatedAds: AdminAd[]) => {
        try {
            const promises = updatedAds.map(ad => setDoc(doc(db, "ads", ad.id), ad));
            const newIds = new Set(updatedAds.map(ad => ad.id));
            const adsToDelete = adminAds.filter(ad => !newIds.has(ad.id));
            const deletePromises = adsToDelete.map(ad => deleteDoc(doc(db, "ads", ad.id)));
            await Promise.all([...promises, ...deletePromises]);
        } catch (error) {
            console.error("Error updating ads", error);
            alert("Failed to update ads.");
        }
    }, [adminAds]);

    const handleApplyVolumeRange = useCallback((min: number, max: number) => {
        setFilters(prev => ({ ...prev, minVolume: min, maxVolume: max }));
        setIsVolumeCalculatorOpen(false);
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) { console.error("Logout error", error); }
    };

    const handleListBoardClick = () => {
        if (currentUser) {
            if (!currentUser.isVerified) {
                alert('Please verify your email to list a board.');
                return;
            }
            setEditingBoard(null);
            setIsListingFormOpen(true);
        }
    };

    const handleLoginClick = () => promptForAuth("Please log in to continue.", true);
    const handleCloseListingForm = () => { setIsListingFormOpen(false); setEditingBoard(null); };

    const handleEditStagedBoard = useCallback(async (index: number) => {
        const boardToEdit = stagedNewBoards[index];
        if (!boardToEdit) return;
        const tempBoard = { ...boardToEdit, id: `editing-${index}` } as Surfboard;
        (window as any).__editingStagedBoardIndex = index;
        setEditingBoard(tempBoard);
        setIsListingFormOpen(true);
        setIsStagedCartOpen(false);
    }, [stagedNewBoards]);

    const handleFormUpdateStagedBoard = useCallback(async (updatedBoard: Surfboard) => {
        const editingIndex = (window as any).__editingStagedBoardIndex;
        if (editingIndex !== undefined && editingIndex !== null) {
            const { id, ...boardData } = updatedBoard;
            const updatedBoards = [...stagedNewBoards];
            updatedBoards[editingIndex] = boardData;
            setStagedNewBoards(updatedBoards);
            delete (window as any).__editingStagedBoardIndex;
            setIsListingFormOpen(false);
            setEditingBoard(null);
            alert('Cart item updated successfully!');
            return;
        }
        await handleUpdateBoard(updatedBoard);
    }, [stagedNewBoards, handleUpdateBoard]);

    const handleClearStagedBoards = useCallback(() => {
        if (window.confirm('Are you sure you want to clear all staged boards?')) {
            setStagedNewBoards([]);
            setStagedLocation(null);
            setIsStagedCartOpen(false);
        }
    }, []);

    const handleProceedToPaymentFromCart = useCallback(() => {
        if (stagedNewBoards.length === 0) {
            alert('No boards to pay for');
            return;
        }
        if (currentUser) {
            const newFee = getNewBoardFee(currentUser.country);
            const usedFee = getUsedBoardFee(currentUser.country);

            const totalCost = stagedNewBoards.reduce((total, board) => {
                if (board.isPaid) return total;
                const fee = board.condition === Condition.New ? newFee : usedFee;
                return total + (fee * board.dimensions.length);
            }, 0);

            if (totalCost === 0) {
                handlePaymentSuccess('free_discount_code', stagedNewBoards);
                return;
            }

            setPaymentAmount(totalCost);
            setPaymentDescription(`${stagedNewBoards.length} listing(s)`);
            setBoardsForPayment(stagedNewBoards);
        }
        setIsStagedCartOpen(false);
        setIsPaymentModalOpen(true);
    }, [stagedNewBoards, currentUser]);

    const handleListAnotherFromCart = useCallback(() => {
        setIsStagedCartOpen(false);
        handleListBoardClick();
    }, [handleListBoardClick]);

    const handleUpdateUser = useCallback(async (updatedUser: User) => {
        try {
            await setDoc(doc(db, "users", updatedUser.id), updatedUser, { merge: true });
            setCurrentUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            setIsAccountSettingsOpen(false);
            alert('Your settings have been updated!');
        } catch (error) {
            console.error("Error updating profile", error);
            alert("Failed to update profile.");
        }
    }, []);

    const promptForAuth = useCallback((reason: string, initialIsLogin: boolean = true) => {
        setAuthReason(reason);
        setAuthModalInitialIsLogin(initialIsLogin);
        setIsAuthModalOpen(true);
    }, []);

    const handleNotificationClick = useCallback(async (notification: any) => {
        if (!currentUser) return;

        // Mark as read
        let updatedNotifications = (currentUser.notifications || []);
        if (notification.type === NotificationType.ExpiredListing) {
            // Clear all expired listing notifications
            updatedNotifications = updatedNotifications.map(n =>
                n.type === NotificationType.ExpiredListing ? { ...n, isRead: true } : n
            );
        } else {
            // Mark only the clicked one as read
            updatedNotifications = updatedNotifications.map(n =>
                n.id === notification.id ? { ...n, isRead: true } : n
            );
        }

        const updatedUser = { ...currentUser, notifications: updatedNotifications };
        setCurrentUser(updatedUser);
        await setDoc(doc(db, "users", currentUser.id), updatedUser);

        // Navigate
        if (notification.type === NotificationType.ExpiredListing) {
            setView('myListings');
            setSelectedBoardId(null);
            navigate('/');
        } else if (notification.boardId) {
            setSelectedBoardId(notification.boardId);
        } else if (notification.type === NotificationType.AlertMatch || notification.type === NotificationType.PriceDrop) {
            setView('favs');
            setSelectedBoardId(null);
            navigate('/');
        }
    }, [currentUser, db, navigate]);

    const handleCloseTip = useCallback(() => {
        setShowTip(false);
        localStorage.setItem('surfdims-show-tip', 'false');
    }, []);

    const handleCreateAlert = useCallback(async () => {
        if (!currentUser) {
            promptForAuth("You must be logged in to create alerts.");
            return;
        }

        const newAlert: Alert = {
            id: Math.random().toString(36).substr(2, 9),
            brand: filters.brand,
            model: '',
            volumeMin: filters.minVolume,
            volumeMax: filters.maxVolume,
            lengthMin: filters.minLength,
            lengthMax: filters.maxLength,
            widthMin: filters.minWidth,
            widthMax: filters.maxWidth,
            thicknessMin: filters.minThickness,
            thicknessMax: filters.maxThickness,
            finSetup: filters.finSetup,
            finSystem: filters.finSystem,
            createdAt: new Date().toISOString()
        };

        const updatedUser = {
            ...currentUser,
            alerts: [...currentUser.alerts, newAlert]
        };

        try {
            await setDoc(doc(db, "users", currentUser.id), updatedUser);
            setCurrentUser(updatedUser);
            setAlertCreationTitle("My Alerts");
            setAlertCreationIconType("bell");
            const alertName = [filters.brand].filter(Boolean).join(' ') || 'Alert';
            setAlertCreationSuccessMessage(`${alertName} saved.`);
            setShowSureNoThanks(false);
            setIsAlertCreationModalOpen(true);
        } catch (error) {
            console.error("Error saving alert:", error);
            alert("Failed to save alert. Please try again.");
        }
    }, [currentUser, filters, db, promptForAuth]);

    const handleSureAlert = useCallback(async () => {
        if (!currentUser || !pendingAlertBoard) return;

        const newAlert: Alert = {
            id: Math.random().toString(36).substr(2, 9),
            brand: pendingAlertBoard.brand,
            model: pendingAlertBoard.model,
            volumeMin: pendingAlertBoard.dimensions[0]?.volume || 0,
            volumeMax: pendingAlertBoard.dimensions[0]?.volume || 100,
            lengthMin: pendingAlertBoard.dimensions[0]?.length || 0,
            lengthMax: pendingAlertBoard.dimensions[0]?.length || 20,
            widthMin: pendingAlertBoard.dimensions[0]?.width || 0,
            widthMax: pendingAlertBoard.dimensions[0]?.width || 30,
            thicknessMin: pendingAlertBoard.dimensions[0]?.thickness || 0,
            thicknessMax: pendingAlertBoard.dimensions[0]?.thickness || 10,
            finSetup: pendingAlertBoard.finSetup,
            finSystem: pendingAlertBoard.finSystem,
            createdAt: new Date().toISOString()
        };

        const updatedUser = {
            ...currentUser,
            alerts: [...currentUser.alerts, newAlert]
        };

        try {
            await setDoc(doc(db, "users", currentUser.id), updatedUser);
            setCurrentUser(updatedUser);
            setAlertCreationTitle("My Alerts");
            setAlertCreationIconType("bell");
            const alertName = [pendingAlertBoard.brand, pendingAlertBoard.model].filter(Boolean).join(' ');
            setAlertCreationSuccessMessage(`${alertName} saved.`);
        } catch (error) {
            console.error("Error saving alert:", error);
        }
    }, [currentUser, pendingAlertBoard, db]);

    const handleDeleteAlert = useCallback(async (alertId: string) => {
        if (!currentUser) return;

        const updatedUser = {
            ...currentUser,
            alerts: (currentUser.alerts || []).filter(a => a.id !== alertId)
        };

        try {
            await setDoc(doc(db, "users", currentUser.id), updatedUser);
            setCurrentUser(updatedUser);
        } catch (error) {
            console.error("Error deleting alert:", error);
            alert("Failed to delete alert.");
        }
    }, [currentUser, db]);

    const handleToggleFavs = useCallback((boardId: string) => {
        if (!currentUser) {
            promptForAuth('Login or sign-up to save favourites and create listings.');
            return;
        }
        if (!currentUser.isVerified) {
            alert('Please verify your email to save favourites.');
            return;
        }
        const isAdding = !(currentUser.favs || []).includes(boardId);
        setCurrentUser(user => {
            if (!user) return null;
            const currentFavs = user.favs || [];
            const newFavs = isAdding
                ? [...currentFavs, boardId]
                : currentFavs.filter(id => id !== boardId);
            const updatedUser = { ...user, favs: newFavs };
            setDoc(doc(db, "users", user.id), updatedUser);
            return updatedUser;
        });

        if (isAdding) {
            const board = boards.find(b => b.id === boardId);
            if (board) {
                setPendingAlertBoard(board);
                setAlertCreationTitle("My Favs");
                setAlertCreationIconType("heart");
                setAlertCreationMessage(`${board.brand} ${board.model} saved to ‘My Favs’.\nWould you like alerts of matching listings?`);
                setAlertCreationSuccessMessage("");
                setShowSureNoThanks(true);
                setIsAlertCreationModalOpen(true);
            }
        }
    }, [currentUser, promptForAuth, boards, db]);

    const handleAddAlert = useCallback((brand: string, model: string) => {
        if (!currentUser) return;
        const newAlert: Alert = {
            id: `alert-${Date.now()}`,
            brand,
            model,
            volumeMin: 0,
            volumeMax: 100,
            lengthMin: 0,
            lengthMax: 20,
            widthMin: 0,
            widthMax: 30,
            thicknessMin: 0,
            thicknessMax: 10,
            finSetup: 'All',
            finSystem: 'All',
            createdAt: new Date().toISOString()
        };
        const alreadyExists = (currentUser.alerts || []).some(
            alert => alert.brand.toLowerCase() === brand.toLowerCase() && alert.model.toLowerCase() === model.toLowerCase()
        );
        const alertName = `${brand}${model ? ` ${model}` : ''}`;
        if (alreadyExists) {
            alert(`You already have an alert for ${alertName}.`);
            return;
        }
        const updatedUser = { ...currentUser, alerts: [...(currentUser.alerts || []), newAlert] };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        alert(`Alert created for ${alertName}!`);
    }, [currentUser]);

    const handleShare = useCallback(async (board: Surfboard) => {
        const boardUrl = `${window.location.origin}${window.location.pathname}?boardId=${board.id}`;
        const firstDim = board.dimensions?.[0];
        const dimensionText = (firstDim && typeof firstDim.length === 'number' && !isNaN(firstDim.length)) ? `${firstDim.length}' ` : '';
        const brandModelText = [board.brand, board.model].filter(Boolean).join(' ');

        const shareText = `Check out this ${dimensionText}${brandModelText || 'surfboard'} on SurfDims!`;

        const imageUrl = (board.thumbnails && board.thumbnails[0]) || (board.images && board.images[0]);

        if (navigator && navigator.share) {
            const shareData: any = {
                title: brandModelText || 'Surfboard',
                text: shareText,
                url: boardUrl
            };

            // Attempt to include image file for rich preview if supported
            if (imageUrl && navigator.canShare && navigator.canShare({ files: [] as any })) {
                try {
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const fileName = (brandModelText || 'surfboard').toLowerCase().replace(/\s+/g, '-') + '.jpg';
                    const file = new File([blob], fileName, { type: blob.type });

                    if (navigator.canShare({ files: [file] })) {
                        shareData.files = [file];
                    }
                } catch (e) { console.error("Failed to prepare image for sharing:", e); }
            }

            try {
                await navigator.share(shareData);
                return;
            } catch (error: any) {
                if (error && error.name === 'AbortError') return;
                console.error("Web Share API failed, falling back to modal", error);
            }
        }

        // Fallback to internal share modal
        setBoardToShare(board);
    }, []);

    const handleSaveSearch = useCallback(async () => {
        if (!currentUser) {
            promptForAuth("You must be logged in to create alerts.");
            return;
        }

        const newAlert: Alert = {
            id: Math.random().toString(36).substr(2, 9),
            brand: filters.brand,
            model: '',
            volumeMin: filters.minVolume,
            volumeMax: filters.maxVolume,
            lengthMin: filters.minLength,
            lengthMax: filters.maxLength,
            widthMin: filters.minWidth,
            widthMax: filters.maxWidth,
            thicknessMin: filters.minThickness,
            thicknessMax: filters.maxThickness,
            finSetup: filters.finSetup,
            finSystem: filters.finSystem,
            createdAt: new Date().toISOString()
        };

        const updatedUser = {
            ...currentUser,
            alerts: [...currentUser.alerts, newAlert]
        };

        try {
            await setDoc(doc(db, "users", currentUser.id), updatedUser);
            setCurrentUser(updatedUser);
            setAlertCreationTitle("My Alerts");
            setAlertCreationIconType("bell");
            setAlertCreationMessage("Alert saved to ‘My Alerts’.");
            setAlertCreationSuccessMessage("");
            setShowSureNoThanks(false);
            setIsAlertCreationModalOpen(true);
        } catch (error) {
            console.error("Error saving alert:", error);
            alert("Failed to save alert. Please try again.");
        }
    }, [currentUser, filters, db, promptForAuth]);

    const handleConfirmNotification = () => {
        if (notificationBoard) {
            handleAddAlert(notificationBoard.brand, notificationBoard.model);
        } else if (notificationSearchTerm) {
            handleAddAlert(notificationSearchTerm, '');
        }
        setIsNotificationModalOpen(false);
        setNotificationBoard(null);
        setNotificationSearchTerm(null);
    };

    const handleCloseNotificationModal = () => {
        setIsNotificationModalOpen(false);
        setNotificationBoard(null);
        setNotificationSearchTerm(null);
    };

    const handleViewSellerListings = useCallback((sellerId: string) => {
        setFilters(prev => ({ ...initialFilters, country: prev.country, sellerId: sellerId }));
        setView('all');
        handleCloseDetail();
        window.scrollTo(0, 0);
    }, [handleCloseDetail]);

    const handleMarkAsSold = useCallback(async (boardId: string) => {
        try {
            await updateDoc(doc(db, "boards", boardId), { status: SurfboardStatus.Sold, lifecycleStatus: 'inactive', inactiveAt: new Date().toISOString() });
            alert('Listing marked as sold!');
        } catch (error) {
            console.error("Error marking as sold", error);
            alert("Failed to update status.");
        }
    }, []);

    const handleRenewListing = useCallback(async (boardId: string) => {
        const boardToRenew = boards.find(b => b.id === boardId);
        if (!boardToRenew) return;

        const now = new Date();
        const expiresAt = boardToRenew.expiresAt ? new Date(boardToRenew.expiresAt) : null;

        // Requirement 4: Clicking the 'Extend Listing' make the listing live again for 30 days.
        // Check if we are still within the 90-day window from initial payment
        if (expiresAt && now.getTime() < expiresAt.getTime()) {
            try {
                await updateDoc(doc(db, "boards", boardId), {
                    status: SurfboardStatus.Live,
                    listedDate: now.toISOString(),
                    lifecycleStatus: 'active',
                    inactiveAt: null
                });
                alert('Listing extended for 30 days!');
            } catch (error) {
                console.error("Error extending board", error);
                alert("Failed to extend listing.");
            }
            return;
        }

        // If expired beyond 90 days or no expiresAt, trigger payment for another 90 days
        setBoardToRenewId(boardId);
        if (currentUser) {
            const fee = boardToRenew.condition === Condition.New
                ? getNewBoardFee(currentUser.country)
                : getUsedBoardFee(currentUser.country);

            const totalCost = fee * boardToRenew.dimensions.length;
            setPaymentAmount(totalCost);
            setPaymentDescription(`Reactivate Listing for 90 days (${boardToRenew.dimensions.length} size${boardToRenew.dimensions.length !== 1 ? 's' : ''})`);
            setIsPaymentModalOpen(true);
        }
    }, [boards, currentUser]);

    const handleDeleteListing = useCallback(async (boardId: string) => {
        try {
            await deleteDoc(doc(db, "boards", boardId));
            setBoards(prev => prev.filter(b => b.id !== boardId));
            handleCloseDetail();
            alert('Listing has been deleted.');
        } catch (error) {
            console.error("Error deleting listing", error);
            alert("Failed to delete listing. Please try again.");
        }
    }, [handleCloseDetail]);

    const handleEditListing = useCallback((board: Surfboard) => {
        setEditingBoard(board);
        setIsListingFormOpen(true);
        handleCloseDetail();
    }, [handleCloseDetail]);

    const handleAdminDeleteListing = useCallback(async (boardId: string) => {
        if (window.confirm('Are you sure you want to permanently delete this listing?')) {
            try {
                await deleteDoc(doc(db, "boards", boardId));
                setBoards(prev => prev.filter(b => b.id !== boardId));
                alert('Listing has been deleted.');
            } catch (error) {
                console.error("Error deleting listing:", error);
                alert("Failed to delete listing.");
            }
        }
    }, []);

    const handleAdminApproveListing = useCallback(async (boardId: string) => {
        try {
            await setDoc(doc(db, "boards", boardId), { status: SurfboardStatus.Live }, { merge: true });
            setBoards(prev => prev.map(b => b.id === boardId ? { ...b, status: SurfboardStatus.Live } : b));
            alert('Listing has been approved and is now live.');
        } catch (error) {
            console.error("Error approving listing:", error);
            alert("Failed to approve listing.");
        }
    }, []);

    const handleAdminToggleUserBlock = useCallback(async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        const action = user.isBlocked ? 'unblock' : 'block';
        if (window.confirm(`Are you sure you want to ${action} this user?`)) {
            try {
                await setDoc(doc(db, "users", userId), { isBlocked: !user.isBlocked }, { merge: true });
                setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
                alert(`User has been ${action}ed.`);
            } catch (error) {
                console.error(`Error ${action}ing user:`, error);
                alert(`Failed to ${action} user.`);
            }
        }
    }, [users]);

    const handleAdminDeleteUser = useCallback(async (userId: string) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this user? This action cannot be undone and will remove their listings as well.')) return;
        try {
            await deleteDoc(doc(db, "users", userId));
            const userBoards = boards.filter(b => b.sellerId === userId);
            const deletePromises = userBoards.map(board => deleteDoc(doc(db, "boards", board.id)));
            await Promise.all(deletePromises);
            setUsers(prev => prev.filter(u => u.id !== userId));
            setBoards(prev => prev.filter(b => b.sellerId !== userId));
            alert('User and their listings have been permanently deleted.');
        } catch (error: any) {
            console.error("Error deleting user:", error);
            alert(`Failed to delete user: ${error.message}`);
        }
    }, [boards]);

    const handleAdminPromoteUser = useCallback(async (userId: string, newRole: 'superadmin' | 'admin' | 'user') => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        const roleLabels: Record<string, string> = { superadmin: 'Super Admin', admin: 'Admin', user: 'User' };
        if (!window.confirm(`Change ${user.name}'s role to ${roleLabels[newRole]}?`)) return;
        try {
            await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            alert(`${user.name} is now a ${roleLabels[newRole]}.`);
        } catch (error: any) {
            console.error('Error changing user role:', error);
            alert(`Failed to change role: ${error.message}`);
        }
    }, [users]);

    const handleMarkNotificationAsRead = useCallback((notificationId: string) => {
        if (!currentUser) return;
        const updatedNotifications = (currentUser.notifications || []).map(n => n.id === notificationId ? { ...n, isRead: true } : n);
        const updatedUser = { ...currentUser, notifications: updatedNotifications };
        setCurrentUser(updatedUser);
        setDoc(doc(db, "users", currentUser.id), updatedUser);
    }, [currentUser, db]);

    const handleMarkAllNotificationsAsRead = useCallback(() => {
        if (!currentUser) return;
        const updatedNotifications = (currentUser.notifications || []).map(n => ({ ...n, isRead: true }));
        const updatedUser = { ...currentUser, notifications: updatedNotifications };
        setCurrentUser(updatedUser);
        setDoc(doc(db, "users", currentUser.id), updatedUser);
    }, [currentUser, db]);

    const handleClearAllNotifications = useCallback(() => {
        if (!currentUser) return;
        if (window.confirm('Are you sure you want to clear all notifications?')) {
            const updatedUser = { ...currentUser, notifications: [] };
            setCurrentUser(updatedUser);
            setDoc(doc(db, "users", currentUser.id), updatedUser);
        }
    }, [currentUser, db]);

    const handleInitiateVerification = useCallback(async () => {
        if (!auth.currentUser) return;
        try {
            const actionCodeSettings = { url: window.location.origin, handleCodeInApp: false };
            await sendEmailVerification(auth.currentUser, actionCodeSettings);
            setVerificationStatus('pending');
            alert("Verification email sent! Please check your inbox.");
        } catch (error: any) {
            console.error("Error sending verification email", error);
            if (error.code === 'auth/too-many-requests') alert("Too many requests. Please wait a moment before trying again.");
            else alert("Failed to send verification email. Please try again later.");
        }
    }, []);

    const handleShowMore = useCallback(() => setVisibleListingsCount(prev => prev + 15), []);
    const handleOpenContactFromFaq = useCallback(() => { setIsFaqOpen(false); setIsContactOpen(true); }, []);
    const handleOpenLearnMoreFromFaq = useCallback(() => { setIsFaqOpen(false); setIsLearnMoreOpen(true); }, []);

    const sellerMap: Map<string, User> = useMemo(() => new Map<string, User>(users.map(u => [u.id, u])), [users]);

    // Lazy load sellers for boards
    useEffect(() => {
        if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') return; // Admins already have all users

        const missingSellerIds = Array.from(new Set(boards.map(b => b.sellerId)))
            .filter((id): id is string => typeof id === 'string' && id !== '' && !sellerMap.has(id));

        if (missingSellerIds.length === 0) return;

        missingSellerIds.forEach(async (sellerId) => {
            try {
                const userDoc = await getDoc(doc(db, "users", sellerId));
                if (userDoc.exists()) {
                    const userData = { id: userDoc.id, ...userDoc.data() } as User;
                    setUsers(prev => {
                        if (prev.some(u => u.id === sellerId)) return prev;
                        return [...prev, userData];
                    });
                }
            } catch (error) {
                console.error(`Error lazy-fetching seller ${sellerId}:`, error);
            }
        });
    }, [boards, sellerMap, currentUser?.role]);

    const boardsWithMockPrices = useMemo(() => {
        return boards;
    }, [boards]);

    const currentUserWithMockNotifications = useMemo(() => {
        return currentUser;
    }, [currentUser]);

    const filteredBoards = useMemo(() => {
        let boardsToFilter = boardsWithMockPrices;
        if (filters.country !== 'All') {
            boardsToFilter = boardsToFilter.filter(board => {
                const seller = sellerMap.get(board.sellerId);
                return seller?.country === filters.country;
            });
        }
        let baseBoards: Surfboard[];
        if (view === 'myListings' && currentUser) baseBoards = boardsToFilter.filter(b => b.sellerId === currentUser.id);
        else if (view === 'favs' && currentUser) {
            const favIds = new Set(currentUser.favs || []);
            baseBoards = boardsToFilter.filter(me => favIds.has(me.id) && me.status === SurfboardStatus.Live);
        } else {
            baseBoards = boardsToFilter.filter(board => board.status === SurfboardStatus.Live || (currentUser && board.sellerId === currentUser.id));
        }

        const filtered = baseBoards.filter(board => {
            const seller = sellerMap.get(board.sellerId);
            if (!seller || seller.isBlocked) return false;
            const { brand, finSystem, finSetup, minLength, maxLength, minWidth, maxWidth, minThickness, maxThickness, minVolume, maxVolume, sellerId } = filters;
            if (sellerId && board.sellerId !== sellerId) return false;
            if (view === 'all' && board.status !== SurfboardStatus.Live && !sellerId) return false;
            if (brand) {
                const searchString = `${board.brand.toLowerCase()} ${board.model.toLowerCase()} ${board.description.toLowerCase()}`;
                const keywords = brand.toLowerCase().split(' ').filter(kw => kw);
                if (!keywords.every(kw => searchString.includes(kw))) return false;
            }
            if (finSystem !== 'All' && board.finSystem !== finSystem) return false;
            if (finSetup !== 'All' && board.finSetup !== finSetup) return false;
            const lengthFilterActive = minLength > SLIDER_RANGES.length.min || maxLength < SLIDER_RANGES.length.max;
            const widthFilterActive = minWidth > SLIDER_RANGES.width.min || maxWidth < SLIDER_RANGES.width.max;
            const thicknessFilterActive = minThickness > SLIDER_RANGES.thickness.min || maxThickness < SLIDER_RANGES.thickness.max;
            const volumeFilterActive = minVolume > SLIDER_RANGES.volume.min || maxVolume < SLIDER_RANGES.volume.max;
            if (lengthFilterActive || widthFilterActive || thicknessFilterActive || volumeFilterActive) {
                const matchesDimensions = board.dimensions.some(dim => {
                    if (lengthFilterActive && (dim.length < minLength || dim.length > maxLength)) return false;
                    if (widthFilterActive && (dim.width < minWidth || dim.width > maxWidth)) return false;
                    if (thicknessFilterActive && (dim.thickness < minThickness || dim.thickness > maxThickness)) return false;
                    if (volumeFilterActive && (dim.volume < minVolume || dim.volume > maxVolume)) return false;
                    return true;
                });
                if (!matchesDimensions) return false;
            }
            return true;
        });
        return [...filtered].sort((a, b) => {
            if (view === 'myListings') {
                if (a.status === SurfboardStatus.Expired && b.status !== SurfboardStatus.Expired) return -1;
                if (a.status !== SurfboardStatus.Expired && b.status === SurfboardStatus.Expired) return 1;
            }
            switch (sortOrder) {
                case 'price_asc': return a.price - b.price;
                case 'price_desc': return b.price - a.price;
                case 'date_asc': return new Date(a.listedDate).getTime() - new Date(b.listedDate).getTime();
                case 'date_desc':
                default: return new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime();
            }
        });
    }, [boardsWithMockPrices, filters, view, currentUser, users, sellerMap, sortOrder]);

    const paginatedBoards = useMemo(() => filteredBoards.slice(0, visibleListingsCount), [filteredBoards, visibleListingsCount]);
    const activeAds = useMemo(() => adminAds.filter(ad => ad.isActive), [adminAds]);

    const listItems = useMemo((): ListItem[] => {
        if (view === 'favs' || view === 'myListings') return paginatedBoards;
        const itemsWithAds: ListItem[] = [];
        const adInterval = 15;
        const adPositionInChunk = 5;
        let adIndex = adRotationOffset;
        for (let i = 0; i < paginatedBoards.length; i++) {
            itemsWithAds.push(paginatedBoards[i]);
            if ((i + 1) > 0 && (i + 1) % adInterval === adPositionInChunk) {
                if (activeAds.length > 0) {
                    const adData = activeAds[adIndex % activeAds.length];
                    itemsWithAds.push({ id: `ad-${i}`, type: 'ad', adData });
                    adIndex++;
                } else if (appSettings.adsenseCode) itemsWithAds.push({ id: `ad-${i}`, type: 'ad' });
            }
        }
        return itemsWithAds;
    }, [paginatedBoards, view, activeAds, adRotationOffset, appSettings.adsenseCode]);

    const sellerFilter = useMemo(() => {
        if (!filters.sellerId) return null;
        return users.find(u => u.id === filters.sellerId) || null;
    }, [filters.sellerId, users]);

    const isFilterActive = useMemo(() => (
        filters.brand !== initialFilters.brand ||
        filters.country !== initialFilters.country ||
        filters.finSystem !== initialFilters.finSystem ||
        filters.finSetup !== initialFilters.finSetup ||
        filters.minLength !== initialFilters.minLength ||
        filters.maxLength !== initialFilters.maxLength ||
        filters.minWidth !== initialFilters.minWidth ||
        filters.maxWidth !== initialFilters.maxWidth ||
        filters.minThickness !== initialFilters.minThickness ||
        filters.maxThickness !== initialFilters.maxThickness ||
        filters.minVolume !== initialFilters.minVolume ||
        filters.maxVolume !== initialFilters.maxVolume ||
        !!filters.sellerId
    ), [filters]);

    const selectedBoard = selectedBoardId ? boardsWithMockPrices.find(b => b.id === selectedBoardId) : null;
    const seller = selectedBoard ? users.find(u => u.id === selectedBoard.sellerId) : null;

    const pageTitle = useMemo(() => {
        if (sellerFilter) return `${sellerFilter.name}'s listings (${filteredBoards.length})`;
        if (view === 'all' && isFilterActive) return filters.brand ? `Results for '${filters.brand}' (${filteredBoards.length})` : `Listings (${filteredBoards.length})`;
        if (view === 'favs') return `My Favs (${filteredBoards.length})`;
        if (view === 'myListings') return `My Listings (${filteredBoards.length})`;
        if (currentUser) return `Welcome ${currentUser.name}`;
        return 'Signup CTA';
    }, [view, sellerFilter, currentUser, filteredBoards.length, filters.brand, isFilterActive]);

    const sortOptions: { value: SortOption, label: string }[] = [
        { value: 'date_desc', label: 'Listed: newest to oldest' },
        { value: 'date_asc', label: 'Listed: oldest to newest' },
        { value: 'price_asc', label: 'Price: low to high' },
        { value: 'price_desc', label: 'Price: high to low' },
    ];

    const totalEntries = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        return donationEntries.reduce((acc, entry) => {
            const entryDate = new Date(entry.date);
            if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) return acc + entry.entries;
            return acc;
        }, 0);
    }, [donationEntries]);

    const totalDonationsRaised = useMemo(() => donationEntries.reduce((acc, entry) => acc + entry.amount, 0), [donationEntries]);

    const titleElement = pageTitle === 'Signup CTA' ? (
        <h1 className="text-3xl font-bold text-gray-800">
            Welcome to SurfDims
        </h1>
    ) : (
        <h1 className="text-3xl font-bold text-gray-800">{pageTitle}</h1>
    );

    if (location.pathname === '/dashboard') {
        if (isAuthLoading) return <div className="flex items-center justify-center min-h-screen bg-gray-100"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && currentUser.email !== 'eyemac2@gmail.com')) return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-6">You do not have permission to view this page.</p>
                    <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Return Home</button>
                </div>
            </div>
        );
        return (
            <div className="bg-gray-100 min-h-screen font-sans">
                <Header
                    branding={branding}
                    currentUser={currentUser}
                    onListBoardClick={handleListBoardClick}
                    onLoginClick={() => { setAuthModalView('login'); setIsAuthModalOpen(true); }}
                    onLogout={handleLogout}
                    onShowFavs={() => { setView('favs'); navigate('/'); }}
                    onShowMyListings={() => { setView('myListings'); navigate('/'); }}
                    onShowAll={() => {
                        setView('all');
                        setFilters(prev => ({ ...initialFilters, country: prev.country }));
                        navigate('/');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onAccountSettingsClick={() => setIsAccountSettingsOpen(true)}
                    onCartClick={() => setIsStagedCartOpen(true)}
                    cartItemCount={stagedNewBoards.length}
                    onFaqClick={() => setIsFaqOpen(true)}
                    onContactClick={() => setIsContactOpen(true)}
                    onAboutUsClick={() => setIsAboutUsOpen(true)}
                    onAdminClick={() => setIsAdminPageOpen(true)}
                    onMyAlertsClick={() => setIsMyAlertsOpen(true)}
                    onNotificationClick={handleNotificationClick}
                    showTip={showTip}
                    onCloseTip={handleCloseTip}
                />
                <AdminPage
                    boards={boards}
                    users={users}
                    donationEntries={donationEntries}
                    branding={branding}
                    appSettings={appSettings}
                    giveawayImages={giveawayImages}
                    onAdminDeleteListing={handleAdminDeleteListing}
                    onAdminApproveListing={handleAdminApproveListing}
                    onAdminToggleUserBlock={handleAdminToggleUserBlock}
                    onAdminDeleteUser={handleAdminDeleteUser}
                    onAdminPromoteUser={handleAdminPromoteUser}
                    currentUser={currentUser!}
                    onBrandingUpdate={handleBrandingUpdate}
                    onAppSettingsUpdate={handleAppSettingsUpdate}
                    onGiveawayImagesUpdate={handleGiveawayImagesUpdate}
                    adminAds={adminAds}
                    onAdminAdsUpdate={handleAdminAdsUpdate}
                    onClose={() => navigate('/')}
                />
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView={authModalView} />
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <Header
                branding={branding}
                currentUser={currentUserWithMockNotifications}
                onListBoardClick={() => {
                    if (currentUser) {
                        if (currentUser.isVerified) setIsListingFormOpen(true);
                        else setVerificationStatus('unverified');
                    } else promptForAuth("You must be logged in to list a board.");
                }}
                onLoginClick={handleLoginClick}
                onLogout={() => signOut(auth)}
                onShowFavs={() => { setView('favs'); setFilters(initialFilters); navigate('/'); setSelectedBoardId(null); }}
                onShowMyListings={() => { setView('myListings'); setFilters(initialFilters); navigate('/'); setSelectedBoardId(null); }}
                onShowAll={() => {
                    setView('all');
                    setFilters(initialFilters);
                    navigate('/');
                    setSelectedBoardId(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onAccountSettingsClick={() => setIsAccountSettingsOpen(true)}
                onFaqClick={() => setIsFaqOpen(true)}
                onContactClick={() => setIsContactOpen(true)}
                onAboutUsClick={() => setIsAboutUsOpen(true)}
                onAdminClick={() => setIsAdminPageOpen(true)}
                onCartClick={() => setIsStagedCartOpen(true)}
                onMyAlertsClick={() => setIsMyAlertsOpen(true)}
                onNotificationClick={handleNotificationClick}
                cartItemCount={stagedNewBoards.length}
                showTip={showTip}
                onCloseTip={handleCloseTip}
            />

            {showTip && (
                <div className="md:hidden px-4 mt-4">
                    <div className="bg-[#007bff] text-white px-4 py-3 rounded-lg flex items-center justify-between shadow-sm">
                        <span className="text-sm font-bold">TIP: Tap logo to reset page</span>
                        <button onClick={handleCloseTip} className="hover:opacity-80 transition-opacity">
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {currentUser && !currentUser.isVerified && verificationStatus !== 'verifying' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && (
                <VerificationBanner onVerify={handleInitiateVerification} status={verificationStatus} />
            )}

            {isFaqOpen && (
                <FaqPage
                    onClose={() => setIsFaqOpen(false)}
                    onContactClick={handleOpenContactFromFaq}
                    onOpenLearnMore={handleOpenLearnMoreFromFaq}
                    onInstallClick={handleInstallPrompt}
                    canInstall={!!deferredInstallPrompt}
                    currentUser={currentUserWithMockNotifications}
                />
            )}
            {isContactOpen && <ContactPage onClose={() => setIsContactOpen(false)} contactEmail={appSettings.contactEmail || 'info@surfdims.com'} />}

            {selectedBoard && seller ? (
                <main className="container mx-auto p-4 lg:p-6">
                    <ListingDetail
                        board={selectedBoard}
                        seller={seller}
                        currentUser={currentUserWithMockNotifications}
                        onClose={handleCloseDetail}
                        isFavourited={currentUserWithMockNotifications?.favs.includes(selectedBoardId!) || false}
                        onToggleFavs={handleToggleFavs}
                        onViewSellerListings={handleViewSellerListings}
                        onMarkAsSold={handleMarkAsSold}
                        onRenewListing={handleRenewListing}
                        onRelistBoard={handleRelistBoard}
                        onDeleteListing={handleDeleteListing}
                        onEditListing={handleEditListing}
                        onShare={handleShare}
                        onLoginClick={() => navigate('/login')}
                    />
                </main>
            ) : (
                <main className="container mx-auto p-4 lg:p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                        <aside className={`hidden ${isFilterPanelOpen ? 'md:block' : ''} lg:block md:w-1/3 lg:w-1/4 xl:w-1/5 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto`}>
                            <FilterPanel
                                filters={filters}
                                onFilterChange={setFilters}
                                onClose={() => setIsFilterPanelOpen(false)}
                                onSaveSearch={handleSaveSearch}
                                isLoggedIn={!!currentUserWithMockNotifications}
                                isVerified={!!currentUserWithMockNotifications?.isVerified}
                                onOpenVolumeCalculator={() => setIsVolumeCalculatorOpen(true)}
                            />
                        </aside>

                        <div className="flex-1">
                            <div className={`${isFilterPanelOpen ? 'md:hidden' : 'lg:hidden'} flex justify-between items-center mb-4 gap-4`}>
                                <button onClick={() => setIsFilterPanelOpen(true)} className="flex items-center gap-2 py-2 px-4 bg-white text-gray-700 font-semibold rounded-lg shadow border border-gray-200 hover:bg-gray-50 flex-1 justify-center">
                                    <FilterIcon />
                                    <span>Filters</span>
                                </button>
                                <div className="relative" ref={mobileSortDropdownRef}>
                                    <button onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)} className="flex items-center gap-2 py-2 px-4 bg-white text-gray-700 font-semibold rounded-lg shadow border border-gray-200 hover:bg-gray-50 flex-1 justify-center">
                                        <SortIcon />
                                        <span>Sort</span>
                                    </button>
                                    {isSortDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl z-40 border border-gray-200">
                                            {sortOptions.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => { setSortOrder(option.value); setIsSortDropdownOpen(false); }}
                                                    className={`block w-full text-left px-4 py-2 text-sm ${sortOrder === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`${isFilterPanelOpen ? 'md:flex' : 'hidden lg:flex'} justify-between items-center mb-6`}>
                                <div className="flex items-center gap-4">
                                    {titleElement}
                                    {isFilterActive && (
                                        <button onClick={() => setFilters(prev => ({ ...initialFilters, country: prev.country }))} className="text-blue-600 hover:underline font-semibold text-sm flex-shrink-0">Clear</button>
                                    )}
                                </div>
                                <div className="relative" ref={isFilterPanelOpen ? mobileSortDropdownRef : desktopSortDropdownRef}>
                                    <button onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)} className="flex items-center gap-2 py-2 px-4 bg-white text-gray-700 font-semibold rounded-lg shadow border border-gray-200 hover:bg-gray-50">
                                        {isFilterPanelOpen ? (
                                            <>
                                                <SortIcon />
                                                <span>Sort</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{sortOptions.find(o => o.value === sortOrder)?.label}</span>
                                                <SortIcon />
                                            </>
                                        )}
                                    </button>
                                    {isSortDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl z-40 border border-gray-200">
                                            {sortOptions.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => { setSortOrder(option.value); setIsSortDropdownOpen(false); }}
                                                    className={`block w-full text-left px-4 py-2 text-sm ${sortOrder === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`${isFilterPanelOpen ? 'md:hidden' : 'lg:hidden'} flex justify-between items-start mb-6`}>
                                {titleElement}
                                {isFilterActive && (
                                    <button onClick={() => setFilters(prev => ({ ...initialFilters, country: prev.country }))} className="text-blue-600 hover:underline font-semibold text-sm flex-shrink-0 ml-4 mt-1">Clear</button>
                                )}
                            </div>

                            <BoardList
                                items={listItems}
                                users={users}
                                favs={currentUserWithMockNotifications?.favs || []}
                                onToggleFavs={handleToggleFavs}
                                onSelectBoard={handleSelectBoard}
                                currentUser={currentUserWithMockNotifications}
                                onShare={handleShare}
                                onOpenLearnMore={() => setIsLearnMoreOpen(true)}
                                onCreateAlert={handleSaveSearch}
                                hasMore={visibleListingsCount < filteredBoards.length}
                                onShowMore={handleShowMore}
                                appSettings={appSettings}
                                isWelcomePage={view === 'all' && !isFilterActive}
                                isFilterActive={isFilterActive}
                                isFilterOpen={isFilterPanelOpen}
                            />
                        </div>
                    </div>
                </main>
            )}

            {isFilterPanelOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsFilterPanelOpen(false)}>
                    <div className="fixed inset-y-0 left-0 w-full bg-white shadow-xl p-4 overflow-y-auto animate-slide-in-left" onClick={e => e.stopPropagation()}>
                        <FilterPanel
                            filters={filters}
                            onFilterChange={setFilters}
                            onClose={() => setIsFilterPanelOpen(false)}
                            onSaveSearch={handleSaveSearch}
                            isLoggedIn={!!currentUser}
                            isVerified={!!(currentUser != null && currentUser.isVerified)}
                            onOpenVolumeCalculator={() => setIsVolumeCalculatorOpen(true)}
                        />
                    </div>
                </div>
            )}

            {isListingFormOpen && currentUser && (
                <ListingForm
                    onClose={handleCloseListingForm}
                    onAddUsedBoard={handleAddUsedBoard}
                    onStageAndReset={handleStageAndReset}
                    onStageAndPay={handleStageAndPay}
                    onUpdateBoard={handleFormUpdateStagedBoard}
                    onDonateAndList={handleDonateAndList}
                    currentUser={currentUser}
                    editingBoard={editingBoard}
                    stagedCount={stagedNewBoards.length}
                    totalEntries={totalEntries}
                    onOpenLearnMore={() => setIsLearnMoreOpen(true)}
                    onOpenCharityModal={() => setIsCharityModalOpen(true)}
                    onOpenCart={() => setIsStagedCartOpen(true)}
                />
            )}

            {isAccountSettingsOpen && currentUser && (
                <AccountSettingsModal
                    currentUser={currentUser}
                    onClose={() => setIsAccountSettingsOpen(false)}
                    onUpdateUser={handleUpdateUser}
                    onAddAlert={handleAddAlert}
                    onDeleteAlert={handleDeleteAlert}
                />
            )}
            {isNotificationModalOpen && (
                <NotificationModal
                    board={notificationBoard || undefined}
                    searchTerm={notificationSearchTerm || undefined}
                    onClose={handleCloseNotificationModal}
                    onConfirm={handleConfirmNotification}
                />
            )}
            {isPaymentModalOpen && currentUser && (
                <PaymentModal
                    amount={paymentAmount}
                    itemDescription={paymentDescription}
                    currentUser={currentUser}
                    onClose={handlePaymentCancel}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
            {boardToShare && <ShareModal board={boardToShare} onClose={() => setBoardToShare(null)} />}
            {isLearnMoreOpen && <LearnMoreModal onClose={() => setIsLearnMoreOpen(false)} giveawayImages={giveawayImages} />}
            {isCharityModalOpen && <CharityModal onClose={() => setIsCharityModalOpen(false)} totalRaised={totalDonationsRaised} currencySymbol={getCurrencySymbol(currentUser?.country)} />}
            {isVolumeCalculatorOpen && <VolumeCalculatorModal onClose={() => setIsVolumeCalculatorOpen(false)} onApply={handleApplyVolumeRange} />}
            {isAboutUsOpen && <AboutUsPage isLoggedIn={!!currentUser} onClose={() => setIsAboutUsOpen(false)} onSignupClick={() => { setIsAboutUsOpen(false); promptForAuth("Signup for a free account!", false); }} />}
            {isMyAlertsOpen && currentUser && (
                <MyAlertsPage
                    currentUser={currentUser}
                    onClose={() => setIsMyAlertsOpen(false)}
                    onDeleteAlert={handleDeleteAlert}
                />
            )}

            <AlertCreationModal
                isOpen={isAlertCreationModalOpen}
                onClose={() => setIsAlertCreationModalOpen(false)}
                title={alertCreationTitle}
                message={alertCreationMessage}
                iconType={alertCreationIconType}
                showSureNoThanks={showSureNoThanks}
                onSure={() => { handleSureAlert(); }}
                onNoThanks={() => setIsAlertCreationModalOpen(false)}
                successMessage={alertCreationSuccessMessage}
                onViewAlerts={() => { setIsAlertCreationModalOpen(false); setIsMyAlertsOpen(true); }}
            />
            {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.email === 'eyemac2@gmail.com') && isAdminPageOpen && (
                <AdminPage
                    boards={boards}
                    users={users}
                    donationEntries={donationEntries}
                    onAdminDeleteListing={handleAdminDeleteListing}
                    onAdminApproveListing={handleAdminApproveListing}
                    onAdminToggleUserBlock={handleAdminToggleUserBlock}
                    onAdminDeleteUser={handleAdminDeleteUser}
                    onAdminPromoteUser={handleAdminPromoteUser}
                    currentUser={currentUser}
                    branding={branding}
                    onBrandingUpdate={handleBrandingUpdate}
                    appSettings={appSettings}
                    onAppSettingsUpdate={handleAppSettingsUpdate}
                    giveawayImages={giveawayImages}
                    onGiveawayImagesUpdate={handleGiveawayImagesUpdate}
                    adminAds={adminAds}
                    onAdminAdsUpdate={handleAdminAdsUpdate}
                    onClose={() => setIsAdminPageOpen(false)}
                />
            )}
            {currentUser && (
                <StagedBoardsCart
                    stagedBoards={stagedNewBoards}
                    onRemoveBoard={(idx) => setStagedNewBoards(prev => prev.filter((_, i) => i !== idx))}
                    onEditBoard={handleEditStagedBoard}
                    onClearAll={handleClearStagedBoards}
                    onProceedToPayment={handleProceedToPaymentFromCart}
                    onListAnother={handleListAnotherFromCart}
                    currencySymbol={getCurrencySymbol(currentUser.country)}
                    boardFee={getNewBoardFee(currentUser.country)}
                    isOpen={isStagedCartOpen}
                    onClose={() => setIsStagedCartOpen(false)}
                />
            )}
            {foregroundNotification && (
                <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-slate-900 border border-slate-700 text-white shadow-2xl rounded-xl p-4 animate-fade-in-down">
                    <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 text-left">
                            <h4 className="text-sm font-semibold mb-1 text-white">{foregroundNotification.title}</h4>
                            <p className="text-xs text-slate-300">{foregroundNotification.body}</p>
                        </div>
                        <button onClick={() => setForegroundNotification(null)} className="text-slate-400 hover:text-white transition group">
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView={authModalView} />
        </div>
    );
};

export default App;
