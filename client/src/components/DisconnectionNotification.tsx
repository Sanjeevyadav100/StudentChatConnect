interface DisconnectionNotificationProps {
  isVisible: boolean;
  onDismiss: () => void;
}

const DisconnectionNotification = ({
  isVisible,
  onDismiss,
}: DisconnectionNotificationProps) => {
  return (
    <div
      className={`absolute top-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-xs transform transition-transform duration-300 ${
        isVisible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 text-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-800 dark:text-white">
            Disconnected
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your chat partner has disconnected.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="ml-auto bg-transparent text-gray-400 hover:text-gray-500"
          aria-label="Close notification"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DisconnectionNotification;
