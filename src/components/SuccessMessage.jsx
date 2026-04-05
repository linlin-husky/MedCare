import { useEffect } from 'react';
import checkCircleIcon from '../assets/icons/check-circle.svg';
import './Messages.css';

function SuccessMessage({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="message-toast success-toast">
      <div className="toast-content">
        <span className="toast-icon"><img src={checkCircleIcon} alt="" /></span>
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
}

export default SuccessMessage;
