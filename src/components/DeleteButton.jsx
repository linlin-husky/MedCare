
import React, { useState, useEffect } from 'react';

function DeleteButton({ onDelete, className = '', style = {} }) {
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (confirming) {
            const timer = setTimeout(() => setConfirming(false), 3000); // Reset after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [confirming]);

    const handleClick = (e) => {
        e.stopPropagation(); // Prevent row clicks if applicable
        if (confirming) {
            onDelete();
            setConfirming(false);
        } else {
            setConfirming(true);
        }
    };

    return (
        <button
            type="button"
            className={className}
            style={{
                ...style,
                backgroundColor: confirming ? '#ef4444' : 'transparent',
                color: confirming ? 'white' : '#ef4444',
                borderColor: '#ef4444',
                borderWidth: '1px',
                borderStyle: 'solid',
                transition: 'all 0.2s',
                minWidth: '80px'
            }}
            onClick={handleClick}
        >
            {confirming ? 'Confirm?' : 'Delete'}
        </button>
    );
}

export default DeleteButton;
