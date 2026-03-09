import React from 'react';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f09433" />
                <stop offset="25%" stopColor="#e6683c" />
                <stop offset="50%" stopColor="#dc2743" />
                <stop offset="75%" stopColor="#cc2366" />
                <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
        </defs>
        <rect width="24" height="24" rx="5" fill="url(#instagram-gradient)" />
        <path d="M12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7ZM12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12C15.5 13.933 13.933 15.5 12 15.5ZM17.25 7.5C17.25 8.05228 16.8023 8.5 16.25 8.5C15.6977 8.5 15.25 8.05228 15.25 7.5C15.25 6.94772 15.6977 6.5 16.25 6.5C16.8023 6.5 17.25 6.94772 17.25 7.5Z" fill="white" />
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="white" strokeWidth="1.5" />
    </svg>
);

export default InstagramIcon;
