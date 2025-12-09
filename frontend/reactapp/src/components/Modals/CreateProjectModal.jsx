import { Modal } from "./Modal";
import { Beaker, BarChart2, FileCode } from "lucide-react";

export const CreateProjectModal = ({ 
  isOpen,
  isCreating, 
  template,
  setTemplate,
  onClose, 
  projectName, 
  onProjectNameChange, 
  onCreate 
}) => {
  
  const templates = [
    {
      id: "none",
      title: "None (Default)",
      desc: "Normal Python script",
      icon: <FileCode size={20} />
    },
    {
      id: "pytest",
      title: "PyTest",
      desc: "Unit testing suite setup",
      icon: <Beaker size={20} />
    },
    {
      id: "plt",
      title: "Matplotlib",
      desc: "Data visualization setup",
      icon: <BarChart2 size={20} />
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Project Name
        </label>
        <input
          type="text"
          value={projectName}
          onChange={onProjectNameChange}
          placeholder="Enter project name"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && onCreate()}
          autoFocus
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Choose Template
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200
                ${template === t.id 
                  ? 'bg-blue-500/20 border-blue-500 ring-1 ring-blue-500' 
                  : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                }`}
            >
              <div className={`mb-2 ${template === t.id ? 'text-blue-400' : 'text-gray-400'}`}>
                {t.icon}
              </div>
              <span className="text-sm font-medium text-white">{t.title}</span>
              <span className="text-xs text-gray-400 text-center mt-1">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-700">
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
          disabled:bg-blue-900 disabled:cursor-not-allowed font-medium"
        >
          {isCreating ? "Creating..." : "Create Project"}
        </button>
      </div>
    </Modal>
  );
};