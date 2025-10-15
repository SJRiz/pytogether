import { useState, useEffect } from "react";
import api from "../../axiosConfig";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { MainContent } from "../components/MainContent";

// Modal components
import {
  CreateGroupModal,
  JoinGroupModal,
  EditGroupModal,
  CreateProjectModal,
  EditProjectModal,
  AccessCodeModal,
  ConfirmModal
} from "../components/Modals";

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
    const [isCreating, setIsCreating] = useState(false);

    const navigate = useNavigate();

    const handleLogout = async () => {
    try {
        // Call backend to clear refresh token cookie
        await api.post("/api/auth/logout/", {}, { withCredentials: true });

        // Clear tokens from sessionStorage
        sessionStorage.removeItem("access_token");

        // Redirect to login
        navigate("/login");
    } catch (err) {
        console.error("Logout failed", err);
    }
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
        setProjects([]);
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
        setIsCreating(true);
        try {
        const res = await api.post("/groups/create/", { group_name: newGroupName.trim() });
        const newGroup = res.data;
        setGroups(prev => [...prev, newGroup]);
        setNewGroupName("");
        setShowCreateGroupModal(false);
        } catch (err) {
        console.error(err);
        } finally {
        setIsCreating(false);
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

    // Project operations
    const createProject = async () => {
        if (!newProjectName.trim() || !selectedGroup) return;
        setIsCreating(true);
        try {
        const res = await api.post(`/groups/${selectedGroup.id}/projects/create/`, { 
            project_name: newProjectName.trim() 
        });
        setProjects(prev => [...prev, res.data]);
        setNewProjectName("");
        setShowCreateProjectModal(false);
        } catch (err) {
        console.error(err);
        } finally {
        setIsCreating(false);
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

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
        {/* Header */}
        <div className="border-b border-gray-700 bg-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <img
                    src="/pytog.png"
                    alt="Code Icon"
                    className="h-10 w-11"
                />
                <h1 className="text-xl font-semibold text-white">PyTogether</h1>
            </div>
            
            <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-red-500 transition-colors duration-200"
            >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
            </button>
            </div>
        </div>

        <MainContent
        groups={groups}
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        membersVisible={membersVisible}
        setMembersVisible={setMembersVisible}
        setShowCreateGroupModal={setShowCreateGroupModal}
        setShowJoinGroupModal={setShowJoinGroupModal}
        setEditGroupName={setEditGroupName}
        setShowEditGroupModal={setShowEditGroupModal}
        setShowAccessCodeModal={setShowAccessCodeModal}
        setShowConfirmModal={setShowConfirmModal}
        projects={projects}
        setEditProjectName={setEditProjectName}
        setShowEditProjectModal={setShowEditProjectModal}
        setShowCreateProjectModal={setShowCreateProjectModal}
        openProject={openProject}
        />

        {/* Modals */}
        <CreateGroupModal
        isOpen={showCreateGroupModal}
        isCreating={isCreating}
        onClose={() => setShowCreateGroupModal(false)}
        groupName={newGroupName}
        onGroupNameChange={(e) => setNewGroupName(e.target.value)}
        onCreate={createGroup}
        />

        <JoinGroupModal
        isOpen={showJoinGroupModal}
        onClose={() => setShowJoinGroupModal(false)}
        accessCode={accessCode}
        onAccessCodeChange={(e) => setAccessCode(e.target.value)}
        onJoin={joinGroup}
        />

        <EditGroupModal
        isOpen={!!showEditGroupModal}
        onClose={() => setShowEditGroupModal(null)}
        groupName={editGroupName}
        onGroupNameChange={(e) => setEditGroupName(e.target.value)}
        onSave={editGroup}
        group={showEditGroupModal}
        />

        <CreateProjectModal
        isOpen={showCreateProjectModal}
        isCreating={isCreating}
        onClose={() => setShowCreateProjectModal(false)}
        projectName={newProjectName}
        onProjectNameChange={(e) => setNewProjectName(e.target.value)}
        onCreate={createProject}
        />

        <EditProjectModal
        isOpen={!!showEditProjectModal}
        onClose={() => setShowEditProjectModal(null)}
        projectName={editProjectName}
        onProjectNameChange={(e) => setEditProjectName(e.target.value)}
        onSave={editProject}
        project={showEditProjectModal}
        />

        <AccessCodeModal
        isOpen={!!showAccessCodeModal}
        onClose={() => setShowAccessCodeModal(null)}
        group={showAccessCodeModal}
        />

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