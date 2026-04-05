import './LoadingSpinner.css';

function LoadingSpinner() {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <p className="loading-text">Loading...</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;

