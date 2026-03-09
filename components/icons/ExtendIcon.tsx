import React from 'react';

const ExtendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {/* Clock circle with gap in top-right (12 to 3 o'clock) */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 12 A10 10 0 1 1 12 2" />
        {/* Clock hands at 12 and 3 */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5h5" />
        {/* Plus sign in the top-right gap */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 5h6M19 2v6" />
    </svg>
);

export default ExtendIcon;
