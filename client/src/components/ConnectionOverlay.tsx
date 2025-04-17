import { ConnectionStatus } from "@shared/schema";

interface ConnectionOverlayProps {
  isVisible: boolean;
  status: ConnectionStatus;
}

const ConnectionOverlay = ({ isVisible, status }: ConnectionOverlayProps) => {
  const getMessage = () => {
    switch (status) {
      case "connecting":
        return "Connecting to server...";
      case "waiting":
        return "Finding a chat partner...";
      default:
        return "Please wait...";
    }
  };

  const getDescription = () => {
    switch (status) {
      case "connecting":
        return "Please wait while we connect to the server.";
      case "waiting":
        return "Please wait while we connect you with another student.";
      default:
        return "Please wait...";
    }
  };

  return (
    <div
      className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-xl">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-primary animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          {getMessage()}
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          {getDescription()}
        </p>
      </div>
    </div>
  );
};

export default ConnectionOverlay;
