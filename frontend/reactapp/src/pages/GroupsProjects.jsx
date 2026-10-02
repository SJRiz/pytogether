import { useState, useEffect } from "react";
import api from "../../axiosConfig";
import { useNavigate } from "react-router-dom";
import { LogOut, Coffee, Github, Mail, Search, Folder, ArrowRight, X } from "lucide-react";
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
import FeedbackModal from "../components/FeedbackModal";

import { useMsal } from "@azure/msal-react";

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
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState({ show: false, type: '', data: null });
    const [newGroupName, setNewGroupName] = useState("");
    const [editGroupName, setEditGroupName] = useState("");
    const [accessCode, setAccessCode] = useState("");
    const [newProjectName, setNewProjectName] = useState("");
    const [template, setTemplate] = useState("none");
    const [editProjectName, setEditProjectName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [loadingGroups, setIsLoadingGroups] = useState(false);
    const [loadingProjects, setIsLoadingProjects] = useState(false);

    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const [globalSearchResults, setGlobalSearchResults] = useState([]);
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const navigate = useNavigate();
    const { instance } = useMsal();

    document.title = 'PyTogether';

    const handleLogout = async () => {
        try {
            await api.post("/api/auth/logout/", {}, { withCredentials: true });
        } catch (err) {
            console.error("Logout failed", err);
        } finally {
            sessionStorage.removeItem("access_token");
            
            // Check if user is logged in via Microsoft, if so, log them out there too
            const accounts = instance.getAllAccounts();
            if (accounts.length > 0) {
                instance.logoutRedirect({
                    postLogoutRedirectUri: window.location.origin + "/login"
                });
            } else {
                navigate("/login");
            }
        }
    };

    // Fetch all groups
    const fetchGroups = async () => {
        setIsLoadingGroups(true);
        try {
            const res = await api.get("/groups/");
            setGroups(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingGroups(false);
        }
    };

    // Fetch projects for selected group
    const fetchProjects = async (groupId) => {
        setIsLoadingProjects(true);
        setProjects([]);
        try {
            const res = await api.get(`/groups/${groupId}/projects/`);
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    // Random feedback popup logic
    useEffect(() => {
        const hasSubmitted = localStorage.getItem('pytogether_feedback_submitted');

        let visits = parseInt(localStorage.getItem('pytogether_dashboard_visits') || '0', 10);
        visits += 1;
        localStorage.setItem('pytogether_dashboard_visits', visits.toString());

        const hasBeenPrompted = sessionStorage.getItem('pytogether_feedback_prompted');

        // Only consider prompting if they've visited > 2 times, haven't submitted, and haven't been prompted this session
        if (visits > 2 && !hasSubmitted && !hasBeenPrompted) {
            sessionStorage.setItem('pytogether_feedback_prompted', 'true');
            if (Math.random() < 0.4) {
                const timer = setTimeout(() => {
                    setShowFeedbackModal(true);
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchProjects(selectedGroup.id);
        } else {
            setProjects([]);
        }
    }, [selectedGroup]);

    useEffect(() => {
        if (!globalSearchQuery.trim()) {
            setGlobalSearchResults([]);
            setIsSearchingGlobal(false);
            setIsSearchOpen(false);
            return;
        }

        setIsSearchOpen(true);
        setIsSearchingGlobal(true);
        const timeoutId = setTimeout(async () => {
            try {
                const res = await api.get(`/groups/projects/search/?q=${encodeURIComponent(globalSearchQuery)}`);
                setGlobalSearchResults(res.data);
            } catch (err) {
                console.error("Global search failed:", err);
            } finally {
                setIsSearchingGlobal(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [globalSearchQuery]);

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
        setIsCreating(true);
        if (!accessCode.trim()) return;
        try {
            const res = await api.put("/groups/join/", { access_code: accessCode.trim() });
            const joinedGroup = res.data;
            setGroups(prev => [...prev, joinedGroup]);
            setAccessCode("");
            setShowJoinGroupModal(false);
        } catch (err) {
            console.error(err);
            alert("Invalid code")
        } finally {
            setIsCreating(false);
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
        setIsCreating(true);
        try {
            await api.put("/groups/edit/", { id: group.id, group_name: editGroupName.trim() });
            setGroups(prev => prev.map(g => g.id === group.id ? { ...g, group_name: editGroupName.trim() } : g));
            if (selectedGroup?.id === group.id) setSelectedGroup(prev => ({ ...prev, group_name: editGroupName.trim() }));
            setEditGroupName("");
            setShowEditGroupModal(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    // Project operations
    const createProject = async () => {
        if (!newProjectName.trim() || !selectedGroup) return;
        setIsCreating(true);
        try {
            const res = await api.post(`/groups/${selectedGroup.id}/projects/create/`, {
                project_name: newProjectName.trim(),
                template: template
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

        const projectData = {
            groupId: selectedGroup.id,
            projectId: project.id,
            projectName: project.project_name
        };

        localStorage.setItem('previousProjectData', JSON.stringify(projectData));

        navigate(`/groups/${selectedGroup.id}/projects/${project.id}`, {
            state: { projectName: project.project_name },
        });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col relative">
            {/* Subtle grid overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Global Search Overlay (Dims background when searching) */}
            {isSearchOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity cursor-pointer"
                    onClick={() => setIsSearchOpen(false)}
                ></div>
            )}

            {/* Header */}
            <div className="border-b border-gray-800 bg-[#0e1421] px-6 py-2 shadow-lg relative z-50">
                <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-15"></div>
                            <div className="relative bg-gray-800 p-1 rounded-xl border border-gray-700/50">
                                <img
                                    src="/pytog.png"
                                    alt="Code Icon"
                                    className="h-8 w-8"
                                />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold pl-2 bg-clip-text">
                                PyTogether
                            </h1>
                        </div>

                        <div className="hidden md:flex items-center ml-4 pl-4 border-l border-gray-700 h-8">
                            <button
                                onClick={() => setShowFeedbackModal(true)}
                                className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors text-sm font-medium"
                                title="Send Feedback"
                            >
                                <Mail className="w-4 h-4" />
                                <span className="hidden lg:inline">Feedback</span>
                            </button>
                        </div>
                    </div>

                    {/* Global Search Bar in Header */}
                    <div className="hidden md:flex flex-1 max-w-md mx-8 relative z-50">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search all projects..."
                                value={globalSearchQuery}
                                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                onFocus={() => {
                                    if (globalSearchQuery.trim()) {
                                        setIsSearchOpen(true);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsSearchOpen(false);
                                    }
                                }}
                                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-9 pr-9 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500"
                            />
                            {globalSearchQuery && !isSearchingGlobal && (
                                <button
                                    onClick={() => {
                                        setGlobalSearchQuery("");
                                        setGlobalSearchResults([]);
                                        setIsSearchOpen(false);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-0.5 rounded-full hover:bg-gray-700"
                                    title="Clear Search"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                            {isSearchingGlobal && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin h-3.5 w-3.5 border-2 border-gray-400 border-t-blue-500 rounded-full"></div>
                                </div>
                            )}
                        </div>

                        {isSearchOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                                {isSearchingGlobal && globalSearchResults.length === 0 ? (
                                    <div className="p-3 text-center text-gray-400 text-sm">Searching...</div>
                                ) : globalSearchResults.length === 0 ? (
                                    <div className="p-3 text-center text-gray-400 text-sm">No projects found.</div>
                                ) : (
                                    <ul className="divide-y divide-gray-700">
                                        {globalSearchResults.map((proj) => (
                                            <li
                                                key={proj.id}
                                                onClick={() => {
                                                    setGlobalSearchQuery("");
                                                    const projectData = {
                                                        groupId: proj.group_id,
                                                        projectId: proj.id,
                                                        projectName: proj.project_name
                                                    };
                                                    localStorage.setItem('previousProjectData', JSON.stringify(projectData));
                                                    navigate(`/groups/${proj.group_id}/projects/${proj.id}`, {
                                                        state: { projectName: proj.project_name }
                                                    });
                                                }}
                                                className="p-3 hover:bg-gray-700/50 cursor-pointer transition-colors group flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Folder className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                    <div className="min-w-0 flex flex-col">
                                                        <span className="text-white text-sm font-medium truncate">{proj.project_name}</span>
                                                        <span className="text-xs text-gray-400 truncate">{proj.group_name}</span>
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-3.5 w-3.5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 ml-3" />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="https://buymeacoffee.com/sjriz"
                            target="_blank"
                            rel="noreferrer"
                            className="hidden md:flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium mr-3"
                        >
                            <Coffee className="w-4 h-4" />
                        </a>

                        <a href="https://github.com/SJRiz/pytogether" target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mr-3">
                            <Github className="w-4 h-4" />
                        </a>

                        

                        <button onClick={handleLogout} className="bg-white text-black hover:bg-slate-200 px-4 py-2 rounded-full text-sm font-bold transition-colors">
                            Sign Out
                            <LogOut className="inline-block w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow">
                <MainContent
                    groups={groups}
                    selectedGroup={selectedGroup}
                    setSelectedGroup={setSelectedGroup}
                    loadingGroups={loadingGroups}
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
                    loadingProjects={loadingProjects}
                    setShowEditProjectModal={setShowEditProjectModal}
                    setShowCreateProjectModal={setShowCreateProjectModal}
                    openProject={openProject}
                />
            </div>

            {/* Footer Section */}
            <footer className="w-full border-t border-gray-800 bg-[#0e1421] py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        &copy; {new Date().getFullYear()} PyTogether. All rights reserved.
                    </p>

                    {/* Footer Links */}
                    <div className="flex gap-6 text-sm text-gray-400">
                        <a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
                        <a href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</a>
                        <a href="mailto:contact@pytogether.org" className="hover:text-blue-400 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>

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
                isJoining={isCreating}
                onClose={() => setShowJoinGroupModal(false)}
                accessCode={accessCode}
                onAccessCodeChange={(e) => setAccessCode(e.target.value)}
                onJoin={joinGroup}
            />

            <EditGroupModal
                isOpen={!!showEditGroupModal}
                isEditing={isCreating}
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
                template={template}
                setTemplate={setTemplate}
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

            <FeedbackModal
                isOpen={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
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
