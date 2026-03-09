import React from 'react';

interface CartIconProps {
    className?: string;
}

const CartIcon: React.FC<CartIconProps> = ({ className = 'w-5 h-5' }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={className}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h3l1 8h10l1-8H7" />
            <circle cx="9" cy="19" r="1" fill="currentColor" />
            <circle cx="16" cy="19" r="1" fill="currentColor" />
        </svg>
    );
};

export default CartIcon;
