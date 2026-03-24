
export enum FinSystem {
    FCS = 'FCS',
    FCS2 = 'FCS II',
    Futures = 'Futures',
    GlassOn = 'Glass On',
    Other = 'Other'
}

export enum FinSetup {
    Single = 'Single',
    Twin = 'Twin',
    Thruster = 'Thruster',
    Quad = 'Quad',
    Bonzer = 'Bonzer',
    Other = 'Other'
}

export enum Condition {
    New = 'New',
    Used = 'Used'
}

export enum SurfboardStatus {
    Live = 'Live',
    Expired = 'Expired',
    Sold = 'Sold',
    PendingVerification = 'PendingVerification',
    PaymentFailed = 'PaymentFailed'
}

export interface Dimension {
    length: number; // in feet
    width: number; // in inches
    thickness: number; // in inches
    volume: number; // in litres
}

export interface Surfboard {
    id: string;
    type: 'board';
    sellerId: string;
    brand: string;
    model: string;
    dimensions: Dimension[];
    finSystem: FinSystem;
    finSetup: FinSetup;
    condition: Condition;
    price: number;
    originalPrice?: number;
    description: string;
    images: string[];
    listedDate: string;
    firstListedDate?: string;
    expiresAt?: string;
    isPaid?: boolean;
    discountCodeId?: string;
    status: SurfboardStatus;
    website?: string;
    // Backend Schema Compliance
    ownerId?: string;
    listingType?: 'used' | 'new';
    lifecycleStatus?: 'active' | 'inactive';
    createdAt?: any; // ServerTimestamp
    inactiveAt?: string | null;
    storagePath?: string;
    thumbnails?: string[];  // Optimized WebP thumbnails
    paymentIntentId?: string;
    paymentVerified?: boolean;
}

export interface FilterState {
    brand: string;
    country: string;
    finSystem: FinSystem | 'All';
    finSetup: FinSetup | 'All';
    condition: Condition | 'All';
    minLength: number;
    maxLength: number;
    minWidth: number;
    maxWidth: number;
    minThickness: number;
    maxThickness: number;
    minVolume: number;
    maxVolume: number;
    sellerId?: string;
}

export interface Alert {
    id: string;
    type?: 'brand' | 'keyword';
    brand: string;
    model: string;
    volumeMin: number;
    volumeMax: number;
    lengthMin: number;
    lengthMax: number;
    widthMin: number;
    widthMax: number;
    thicknessMin: number;
    thicknessMax: number;
    finSetup: FinSetup | 'All';
    finSystem: FinSystem | 'All';
    createdAt: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location: string;
    country: string; // e.g., 'NZ', 'AU', 'US'
    avatar: string;
    favs: string[]; // Array of surfboard IDs
    alerts: Alert[];
    notifications: AppNotification[];
    isBlocked: boolean;
    isVerified: boolean;
    role?: 'superadmin' | 'admin' | 'user';
    createdAt: string;
}

export interface AdminAd {
    id: string;
    name: string;
    imageUrl: string;
    linkUrl: string;
    isActive: boolean;
}

export interface Advertisement {
    id: string;
    type: 'ad';
    adData?: AdminAd;
}

export type ListItem = Surfboard | Advertisement;

export type SortOption = 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc';

export type VerificationFlowStatus = 'unverified' | 'pending' | 'verifying';

export interface BrandingState {
    desktopLogo: string;
    mobileLogo: string | null;
}

export enum NotificationType {
    ExpiredListing = 'Expired Listing',
    AlertMatch = 'Alert Match',
    PriceDrop = 'Price Drop'
}

export interface AppNotification {
    id: string;
    type: NotificationType;
    message: string;
    boardId?: string;
    isRead: boolean;
    createdAt: string;
}

export interface AppSettingsState {
    mailchimpApiKey: string;
    adsenseCode: string;
    contactEmail: string;
}

export interface DonationEntry {
    id: string;
    userId: string;
    userEmail: string;
    entries: number;
    amount: number;
    date: string;
}

export interface DiscountCode {
    id: string;
    name: string;
    percentageOff: number;
    appliesTo: 'Used' | 'New';
    country: string; // 'All' or specific country code
    expiryDate: string;
    usageLimit?: number;
    usageCount: number;
    createdAt: string;
}
