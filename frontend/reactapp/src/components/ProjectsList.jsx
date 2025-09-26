import { FolderPlus, Edit2, Trash2, Code2 } from "lucide-react";

const ProjectItem = ({ project, onEdit, onDelete, onOpen }) => {
  return (
    <li 
      className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4 hover:bg-gray-700 transition-all duration-200 cursor-pointer group animate-fadeIn"
      onClick={() => onOpen(project)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-white font-medium truncate flex-1">{project.project_name}</h3>
        <div className="flex space-x-1 opacity-50 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onEdit(project);
            }}
            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
            title="Edit Project"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onDelete(project);
            }}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            title="Delete Project"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onOpen(project); 
            }}
            className="p-1 text-green-400 hover:text-green-300 transition-colors"
            title="Open in IDE"
          >
            <Code2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-400">
        Last modified: {new Date(project.updated_at).toLocaleDateString()}
        <br/>
        Created: {new Date(project.created_at).toLocaleDateString()}
      </div>
    </li>
  );
};

export const ProjectsList = ({ 
  selectedGroup, 
  projects, 
  onEditProject, 
  onDeleteProject, 
  onOpenProject, 
  onCreateProject 
}) => {
  if (!selectedGroup) {
    return (
      <div className="flex-1 p-4 flex flex-col bg-gray-850">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <h2 className="text-lg font-semibold text-white">Projects</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-lg">Select a group to see projects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 flex flex-col bg-gray-850">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <h2 className="text-lg font-semibold text-white">Projects</h2>
        <button 
          onClick={onCreateProject}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          <FolderPlus className="h-4 w-4" />
          <span>Create Project</span>
        </button>
      </div>
      
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <ProjectItem
            key={project.id}
            project={project}
            onEdit={onEditProject}
            onDelete={onDeleteProject}
            onOpen={onOpenProject}
          />
        ))}
      </ul>
    </div>
  );
};