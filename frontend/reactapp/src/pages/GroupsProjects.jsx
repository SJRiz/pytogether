import { useState, useEffect } from "react";
import api from "../../axiosConfig";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, 
  Plus, 
  Users, 
  Key, 
  Edit2, 
  Trash2, 
  Code2, 
  X, 
  ChevronDown, 
  ChevronUp,
  User,
  DoorOpen,
  FolderPlus
} from "lucide-react";

export default function GroupsAndProjectsPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [projects, setProjects] = useState([]);
  const [membersVisible, setMembersVisible] = useState(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(null);
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState({ show: false, type: '', data: null });
  const [newGroupName, setNewGroupName] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    sessionStorage.clear();
    navigate("/login");
  };

  // Fetch all groups
  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups/");
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch projects for selected group
  const fetchProjects = async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}/projects/`);
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchProjects(selectedGroup.id);
    } else {
      setProjects([]);
    }
  }, [selectedGroup]);

  // Group operations
  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await api.post("/groups/create/", { group_name: newGroupName.trim() });
      const newGroup = res.data;
      setGroups(prev => [...prev, newGroup]);
      setNewGroupName("");
      setShowCreateGroupModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const joinGroup = async () => {
    if (!accessCode.trim()) return;
    try {
      const res = await api.put("/groups/join/", { access_code: accessCode.trim() });
      const joinedGroup = res.data;
      setGroups(prev => [...prev, joinedGroup]);
      setAccessCode("");
      setShowJoinGroupModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const leaveGroup = async (group) => {
    try {
      await api.delete("/groups/leave/", { data: { id: group.id, group_name: group.group_name } });
      setGroups(prev => prev.filter(g => g.id !== group.id));
      if (selectedGroup?.id === group.id) setSelectedGroup(null);
      setShowConfirmModal({ show: false, type: '', data: null });
    } catch (err) {
      console.error(err);
    }
  };

  const editGroup = async (group) => {
    if (!editGroupName.trim()) return;
    try {
      await api.put("/groups/edit/", { id: group.id, group_name: editGroupName.trim() });
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, group_name: editGroupName.trim() } : g));
      if (selectedGroup?.id === group.id) setSelectedGroup(prev => ({ ...prev, group_name: editGroupName.trim() }));
      setEditGroupName("");
      setShowEditGroupModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const viewAccessCode = (group) => {
    setShowAccessCodeModal(group);
  };

  const viewMembers = (group) => {
    setMembersVisible(prev => prev === group.id ? null : group.id);
  };

  // Project operations
  const createProject = async () => {
    if (!newProjectName.trim() || !selectedGroup) return;
    try {
      const res = await api.post(`/groups/${selectedGroup.id}/projects/create/`, { 
        project_name: newProjectName.trim() 
      });
      setProjects(prev => [...prev, res.data]);
      setNewProjectName("");
      setShowCreateProjectModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const editProject = async (project) => {
    if (!editProjectName.trim() || !selectedGroup) return;
    try {
      await api.put(`/groups/${selectedGroup.id}/projects/${project.id}/edit/`, { 
        project_name: editProjectName.trim() 
      });
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, project_name: editProjectName.trim() } : p));
      setEditProjectName("");
      setShowEditProjectModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProject = async (project) => {
    try {
      await api.delete(`/groups/${selectedGroup.id}/projects/${project.id}/delete/`);
      setProjects(prev => prev.filter(p => p.id !== project.id));
      setShowConfirmModal({ show: false, type: '', data: null });
    } catch (err) {
      console.error(err);
    }
  };

  const openProject = (project) => {
    if (!selectedGroup) return;
    navigate("/ide", {
      state: {
        groupId: selectedGroup.id,
        projectId: project.id,
        projectName: project.project_name
      },
    });
  };

  // Modal components
  const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-300 mb-6">{message}</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Code2 className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-semibold text-white">PyTogether</h1>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Groups List */}
        <div className="w-1/4 bg-gray-800 border-r border-gray-700 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Groups</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowCreateGroupModal(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                title="Create Group"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setShowJoinGroupModal(true)}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                title="Join Group"
              >
                <Users className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <ul className="flex-1 overflow-y-auto space-y-2">
            {groups.map(group => (
              <li 
                key={group.id} 
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedGroup?.id === group.id 
                    ? "bg-blue-600/20 border border-blue-500/50" 
                    : "bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span 
                    onClick={() => setSelectedGroup(group)}
                    className="flex-1 text-white font-medium truncate"
                  >
                    {group.group_name}
                  </span>
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => {
                        setEditGroupName(group.group_name);
                        setShowEditGroupModal(group);
                      }}
                      className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit Group"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => viewAccessCode(group)}
                      className="p-1 text-orange-400 hover:text-orange-300 transition-colors"
                      title="View Access Code"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => viewMembers(group)}
                      className="p-1 text-purple-400 hover:text-purple-300 transition-colors"
                      title="View Members"
                    >
                      {membersVisible === group.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => setShowConfirmModal({ 
                        show: true, 
                        type: 'leaveGroup', 
                        data: group 
                      })}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      title="Leave Group"
                    >
                      <DoorOpen className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {membersVisible === group.id && (
                  <div className="mt-3 pl-2 border-t border-gray-600/50 pt-2 animate-fadeIn">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Members:</h4>
                    <ul className="space-y-1">
                      {group.group_members.map((member) => (
                        <li key={member.id} className="flex items-center space-x-2 text-sm text-gray-300">
                          <User className="h-3 w-3" />
                          <span>{member.email}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Projects List */}
        <div className="flex-1 p-4 flex flex-col bg-gray-850">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Projects</h2>
            {selectedGroup && (
              <button 
                onClick={() => setShowCreateProjectModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                <FolderPlus className="h-4 w-4" />
                <span>Create Project</span>
              </button>
            )}
          </div>
          
          {!selectedGroup ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400 text-lg">Select a group to see projects</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => (
                <li 
                  key={project.id} 
                  className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4 hover:bg-gray-700 transition-all duration-200 cursor-pointer group animate-fadeIn"
                  onClick={() => openProject(project)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-white font-medium truncate flex-1">{project.project_name}</h3>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setEditProjectName(project.project_name);
                          setShowEditProjectModal(project);
                        }}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setShowConfirmModal({ 
                            show: true, 
                            type: 'deleteProject', 
                            data: project 
                          });
                        }}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          openProject(project); 
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
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* Create Group Modal */}
      <Modal 
        isOpen={showCreateGroupModal} 
        onClose={() => setShowCreateGroupModal(false)}
        title="Create New Group"
      >
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Enter group name"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && createGroup()}
        />
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={() => setShowCreateGroupModal(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={createGroup}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Create
          </button>
        </div>
      </Modal>

      {/* Join Group Modal */}
      <Modal 
        isOpen={showJoinGroupModal} 
        onClose={() => setShowJoinGroupModal(false)}
        title="Join Group"
      >
        <input
          type="text"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="Enter access code"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          onKeyPress={(e) => e.key === 'Enter' && joinGroup()}
        />
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={() => setShowJoinGroupModal(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={joinGroup}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
          >
            Join
          </button>
        </div>
      </Modal>

      {/* Edit Group Modal */}
      <Modal 
        isOpen={!!showEditGroupModal} 
        onClose={() => setShowEditGroupModal(null)}
        title="Edit Group"
      >
        <input
          type="text"
          value={editGroupName}
          onChange={(e) => setEditGroupName(e.target.value)}
          placeholder="Enter group name"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && editGroup(showEditGroupModal)}
        />
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={() => setShowEditGroupModal(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => editGroup(showEditGroupModal)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* Create Project Modal */}
      <Modal 
        isOpen={showCreateProjectModal} 
        onClose={() => setShowCreateProjectModal(false)}
        title="Create New Project"
      >
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="Enter project name"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && createProject()}
        />
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={() => setShowCreateProjectModal(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={createProject}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Create
          </button>
        </div>
      </Modal>

      {/* Edit Project Modal */}
      <Modal 
        isOpen={!!showEditProjectModal} 
        onClose={() => setShowEditProjectModal(null)}
        title="Edit Project"
      >
        <input
          type="text"
          value={editProjectName}
          onChange={(e) => setEditProjectName(e.target.value)}
          placeholder="Enter project name"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && editProject(showEditProjectModal)}
        />
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={() => setShowEditProjectModal(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => editProject(showEditProjectModal)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* Access Code Modal */}
      <Modal 
        isOpen={!!showAccessCodeModal} 
        onClose={() => setShowAccessCodeModal(null)}
        title={`Access Code for ${showAccessCodeModal?.group_name}`}
      >
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-white mb-2">
            {showAccessCodeModal?.access_code || "N/A"}
          </div>
          <p className="text-sm text-gray-400">
            Share this code with others to let them join your group
          </p>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setShowAccessCodeModal(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal.show}
        onClose={() => setShowConfirmModal({ show: false, type: '', data: null })}
        onConfirm={() => {
          if (showConfirmModal.type === 'leaveGroup') {
            leaveGroup(showConfirmModal.data);
          } else if (showConfirmModal.type === 'deleteProject') {
            deleteProject(showConfirmModal.data);
          }
        }}
        title={
          showConfirmModal.type === 'leaveGroup' 
            ? `Leave ${showConfirmModal.data?.group_name}?` 
            : `Delete ${showConfirmModal.data?.project_name}?`
        }
        message={
          showConfirmModal.type === 'leaveGroup'
            ? "Are you sure you want to leave this group? This action cannot be undone."
            : "Are you sure you want to delete this project? This action cannot be undone."
        }
      />

      {/* Animation styles */}
      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}