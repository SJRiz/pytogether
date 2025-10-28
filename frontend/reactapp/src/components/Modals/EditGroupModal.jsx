import { Modal } from "./Modal";

export const EditGroupModal = ({ 
  isOpen,
  isEditing,
  onClose,
  groupName, 
  onGroupNameChange, 
  onSave,
  group 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Group">
      <input
        type="text"
        value={groupName}
        onChange={onGroupNameChange}
        placeholder="Enter group name"
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onKeyPress={(e) => e.key === 'Enter' && onSave(group)}
      />
      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(group)}
          disabled={isEditing || !groupName.trim()}
          className={`px-4 py-2 rounded-lg text-white transition-colors ${
            isEditing 
              ? "bg-blue-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          Save
        </button>
      </div>
    </Modal>
  );
};