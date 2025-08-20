import { Modal } from "./Modal";

export const AccessCodeModal = ({ 
  isOpen, 
  onClose, 
  group 
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={`Access Code for ${group?.group_name}`}
    >
      <div className="bg-gray-700 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-white mb-2">
          {group?.access_code || "N/A"}
        </div>
        <p className="text-sm text-gray-400">
          Share this code with others to let them join your group
        </p>
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};