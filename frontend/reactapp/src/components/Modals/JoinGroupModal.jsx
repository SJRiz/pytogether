import { Modal } from "./Modal";

export const JoinGroupModal = ({ 
  isOpen, 
  isJoining,
  onClose, 
  accessCode, 
  onAccessCodeChange, 
  onJoin 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Group">
      <input
        type="text"
        value={accessCode}
        onChange={onAccessCodeChange}
        placeholder="Enter access code"
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        onKeyPress={(e) => !isJoining && e.key === 'Enter' && onJoin()}
      />
      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onJoin}
          disabled={isJoining || !accessCode.trim()}
          className={`px-4 py-2 rounded-lg text-white transition-colors ${
            isJoining 
              ? "bg-green-400 cursor-not-allowed" 
              : "bg-green-600 hover:bg-green-500"
          }`}
        >
          {isJoining ? "Joining..." : "Join"}
        </button>
      </div>
    </Modal>
  );
};
