import { Modal } from "./Modal";

export const CreateProjectModal = ({ 
  isOpen,
  isCreating, 
  onClose, 
  projectName, 
  onProjectNameChange, 
  onCreate 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <input
        type="text"
        value={projectName}
        onChange={onProjectNameChange}
        placeholder="Enter project name"
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onKeyPress={(e) => e.key === 'Enter' && onCreate()}
      />
      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onCreate}
          disabled={isCreating || !projectName.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors 
          hover:bg-blue-500
          disabled:bg-blue-900 disabled:cursor-not-allowed"
        >
          Create
        </button>
      </div>
    </Modal>
  );
};