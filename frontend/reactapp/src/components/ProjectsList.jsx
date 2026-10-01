import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderPlus, Edit2, Trash2, Code2, Folder, ArrowRight, History, Users, X } from "lucide-react";

const ProjectItem = ({ project, onEdit, onDelete, onOpen }) => {
  const activeCount = project.active_users || 0;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (activeCount > 0) {
      alert(`Cannot delete "${project.project_name}" while ${activeCount} users are active.`);
      return;
    }
    onDelete(project);
  };

  return (
    <li
      className="h-[140px] w-full bg-gradient-to-br from-gray-700/40 to-gray-800/40 border-2 border-gray-600/30 
                 hover:border-gray-500/50 hover:from-gray-700/60 hover:to-gray-800/60 rounded-xl p-4 
                 transition-all duration-200 cursor-pointer group animate-fadeIn shadow-lg hover:shadow-xl 
                 relative flex flex-col justify-between overflow-hidden"
      onClick={() => onOpen(project)}
    >
      <div className="flex gap-3 items-start min-w-0">
        <div className="flex items-center justify-center h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex-shrink-0 mt-0.5">
          <Folder className="h-4 w-4 text-white" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <h3 className="text-white font-semibold leading-tight line-clamp-2 break-all pr-10">
            {project.project_name}
          </h3>

          {activeCount > 0 ? (
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>{activeCount} Live</span>
            </div>
          ) : (
            <div className="h-4" />
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 bg-gray-900/80 backdrop-blur-md rounded-lg p-1 border border-gray-500/20 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(project); }}
            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-md"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleDeleteClick}
            disabled={activeCount > 0}
            className={`p-1.5 rounded-md transition-all ${activeCount > 0
              ? "text-gray-600 cursor-not-allowed"
              : "text-red-400 hover:text-red-300 hover:bg-red-500/20"
              }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end border-t border-gray-600/20 pt-2 mt-auto">
        <div className="text-[9px] text-gray-500 flex flex-col uppercase tracking-tighter gap-0.5">
          <div className="flex items-center gap-1">
            <span className="text-gray-600 font-bold">Modified:</span>
            <span>{new Date(project.updated_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600 font-bold">Created:</span>
            <span>{new Date(project.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        {activeCount === 0 && (
          <Users className="h-3 w-3 text-gray-700" />
        )}
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
  onCreateProject,
  groups,
  onSelectGroup
}) => {
  const navigate = useNavigate();
  const [lastSession, setLastSession] = useState(null);
  const [lastGroup, setLastGroup] = useState(null);

  const sortedProjects = [...projects].sort((a, b) => {
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  // Check local storage on mount
  useEffect(() => {
    const storedProject = localStorage.getItem('previousProjectData');
    if (storedProject) {
      try {
        setLastSession(JSON.parse(storedProject));
      } catch (e) {
        console.error("Failed to parse project data", e);
      }
    }

    const storedGroup = localStorage.getItem('previousGroupData');
    if (storedGroup) {
      try {
        setLastGroup(JSON.parse(storedGroup));
      } catch (e) {
        console.error("Failed to parse group data", e);
      }
    }
  }, []);

  const handleContinueSession = () => {
    if (lastSession) {
      const { groupId, projectId, projectName, shareToken } = lastSession;

      let path = `/groups/${groupId}/projects/${projectId}`;

      // Append the shareToken as a query param if the user was a guest
      if (shareToken) {
        path += `?shareToken=${shareToken}`;
      }

      navigate(path, {
        state: { projectName: projectName, shareToken: shareToken }
      });
    }
  };

  const handleContinueGroup = () => {
    if (lastGroup && onSelectGroup) {
      const fullGroup = groups?.find(g => g.id === lastGroup.groupId);
      if (fullGroup) {
        onSelectGroup(fullGroup);
      } else {
        onSelectGroup({ id: lastGroup.groupId, group_name: lastGroup.groupName });
      }
    }
  };

  const handleClearSession = (e) => {
    e.stopPropagation();
    localStorage.removeItem('previousProjectData');
    setLastSession(null);
  };

  const handleClearGroup = (e) => {
    e.stopPropagation();
    localStorage.removeItem('previousGroupData');
    setLastGroup(null);
  };

  if (!selectedGroup) {
    return (
      <div className="flex-1 p-6 flex flex-col bg-gray-900 relative">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

        <div className="mb-6 relative z-10">
          <h2 className="text-xl font-bold text-white tracking-tight"></h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10">

          {lastSession || lastGroup ? (
            <div className="w-full max-w-md animate-fadeIn">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Welcome Back!</h3>
                <p className="text-gray-400">Ready to continue where you left off?</p>
              </div>

              <div className="space-y-4">
                {lastSession && (
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm relative">
                    <button
                      onClick={handleClearSession}
                      className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Clear history"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <History className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-lg break-words">{lastSession.projectName}</h4>
                        <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full border border-blue-400/20">
                          Last Active Session
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleContinueSession}
                      className="w-full group flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                    >
                      <span>Continue Coding</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}

                {lastSession && lastGroup && (
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-gray-700/50"></div>
                    <span className="text-xs text-gray-500 font-medium">or</span>
                    <div className="flex-1 h-px bg-gray-700/50"></div>
                  </div>
                )}

                {lastGroup && (
                  <div className="relative group/wrapper">
                    <div
                      onClick={handleContinueGroup}
                      className="bg-gray-700/40 hover:bg-gray-700/60 border-2 border-gray-600/30 hover:border-gray-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer group flex justify-between items-center pr-12"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-semibold text-gray-200 group-hover:text-white transition-colors text-base truncate">
                          {lastGroup.groupName}
                        </span>
                        <span className="flex-shrink-0 text-[10px] text-gray-400 bg-gray-800/50 px-2 py-0.5 rounded border border-gray-600/30 uppercase tracking-wider font-medium">
                          Last Active Group
                        </span>
                      </div>

                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 ml-3" />
                    </div>
                    <button
                      onClick={handleClearGroup}
                      className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors z-10"
                      title="Clear history"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-center text-gray-600 text-sm mt-8">
                Or select a group from the sidebar to view other projects
              </p>
            </div>
          ) : (
            <div className="text-gray-500 space-y-4 flex flex-col items-center">
              <Folder className="h-16 w-16 opacity-50" />
              <p className="text-lg font-medium">Select a group to see projects</p>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 flex flex-col bg-gray-900 overflow-hidden relative">
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
        ) : sortedProjects.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center items-center h-full text-gray-500 space-y-4">
            <FolderPlus className="h-16 w-16 opacity-50" />
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm text-gray-600">Create one to get started!</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {sortedProjects.map(project => (
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
