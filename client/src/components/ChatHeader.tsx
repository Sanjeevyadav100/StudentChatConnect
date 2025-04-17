import { ConnectionStatus } from "@shared/schema";

interface ChatHeaderProps {
  connectionStatus: ConnectionStatus;
  partnerInfo: string;
  onNextClick: () => void;
  onToggleDarkMode: () => void;
  darkMode: boolean;
}

const ChatHeader = ({
  connectionStatus,
  partnerInfo,
  onNextClick,
  onToggleDarkMode,
  darkMode,
}: ChatHeaderProps) => {
  // Determine the connection status indicator color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500";
      case "waiting":
        return "bg-yellow-500";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-red-500";
    }
  };

  // Get the connection status text
  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "waiting":
        return "Waiting";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
      default:
        return "Disconnected";
    }
  };

  return (
    <div className="bg-primary dark:bg-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-white">Campus Connect</h1>
          <div className="ml-2 flex items-center">
            <span className="flex h-3 w-3 relative">
              <span
                className={`${
                  connectionStatus === "connected" ? "animate-ping" : ""
                } absolute inline-flex h-full w-full rounded-full ${getStatusColor()} opacity-75`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${getStatusColor()}`}
              ></span>
            </span>
            <span className="ml-2 text-sm font-medium text-white">
              {getStatusText()}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            className="text-white p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
          <button
            className="bg-white text-primary hover:bg-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 flex items-center transition-colors"
            onClick={onNextClick}
            disabled={connectionStatus === "connecting"}
            aria-label="Find new partner"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            Next
          </button>
        </div>
      </div>
      <div className="mt-2 text-xs text-white text-opacity-80">
        {partnerInfo}
      </div>
    </div>
  );
};

export default ChatHeader;
