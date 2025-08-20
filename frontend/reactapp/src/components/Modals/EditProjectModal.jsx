import { Modal } from "./Modal";

export const EditProjectModal = ({ 
  isOpen, 
  onClose, 
  projectName, 
  onProjectNameChange, 
  onSave,
  project 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project">
      <input
        type="text"
        value={projectName}
        onChange={onProjectNameChange}
        placeholder="Enter project name"
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onKeyPress={(e) => e.key === 'Enter' && onSave(project)}
      />
      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(project)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          Save
        </button>
      </div>
    </Modal>
  );
};