import { FolderPlus, Edit2, Trash2, Code2, Folder } from "lucide-react";

const ProjectItem = ({ project, onEdit, onDelete, onOpen }) => {
  return (
    <li 
      className="h-[140px] overflow-hidden bg-gradient-to-br from-gray-700/40 to-gray-800/40 border-2 border-gray-600/30 
                 hover:border-gray-500/50 hover:from-gray-700/60 hover:to-gray-800/60 rounded-xl p-4 
                 transition-all duration-200 cursor-pointer group animate-fadeIn shadow-lg hover:shadow-xl"
      onClick={() => onOpen(project)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center justify-center h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex-shrink-0">
            <Folder className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-white font-semibold truncate">{project.project_name}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onEdit(project);
            }}
            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all"
            title="Edit Project"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onOpen(project); 
            }}
            className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-all"
            title="Open in IDE"
          >
            <Code2 className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onDelete(project);
            }}
            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
            title="Delete Project"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 space-y-1">
        <div className="flex items-center gap-1 pt-2">
          <span className="text-gray-500">Modified:</span>
          <span>{new Date(project.updated_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1 pt-1">
          <span className="text-gray-500">Created:</span>
          <span>{new Date(project.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </li>
  );
};

export const ProjectsList = ({ 
  selectedGroup, 
  projects,
  loading, 
  onEditProject, 
  onDeleteProject, 
  onOpenProject, 
  onCreateProject 
}) => {
  if (!selectedGroup) {
    return (
      <div className="flex-1 p-6 flex flex-col bg-gradient-to-b from-gray-950 to-gray-950 relative">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        
        <div className="mb-6 relative z-10">
          <h2 className="text-xl font-bold text-white tracking-tight"></h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4 relative z-10">
          <Folder className="h-16 w-16 opacity-50" />
          <p className="text-lg font-medium">Select a group to see projects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 flex flex-col bg-gradient-to-b from-slate-950 to-slate-950 overflow-hidden relative">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      {/* Header */}
      <div className="mb-6 flex-shrink-0 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">Projects</h2>
          <button 
            onClick={onCreateProject}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 font-medium"
          >
            <FolderPlus className="h-4 w-4" />
            <span className="text-sm">Create Project</span>
          </button>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto overflow-x-auto pr-2 custom-scrollbar relative z-10">
        {loading ? (
          <div className="flex flex-1 justify-center items-center h-full">
            <div className="relative">
              <div className="animate-spin border-4 border-gray-600 border-t-blue-500 h-12 w-12 rounded-full"></div>
              <div className="absolute inset-0 animate-ping border-4 border-blue-500/30 h-12 w-12 rounded-full"></div>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center items-center h-full text-gray-500 space-y-4">
            <FolderPlus className="h-16 w-16 opacity-50" />
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm text-gray-600">Create one to get started!</p>
          </div>
        ) : (
          <ul className="grid grid-cols-3 auto-rows-[160px] gap-4 min-w-max">
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
        )}
      </div>
    </div>
  );
};