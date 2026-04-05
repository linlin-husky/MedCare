import { useEffect } from 'react';
import warningIcon from '../assets/icons/warning.svg';
import './Messages.css';

function ErrorMessage({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="message-toast error-toast">
      <div className="toast-content">
        <span className="toast-icon"><img src={warningIcon} alt="" /></span>
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
}

export default ErrorMessage;
