import { GroupsList } from "./GroupsList";
import { ProjectsList } from "./ProjectsList";

export const MainContent = ({
  groups,
  selectedGroup,
  setSelectedGroup,
  membersVisible,
  setMembersVisible,
  setShowCreateGroupModal,
  setShowJoinGroupModal,
  setEditGroupName,
  setShowEditGroupModal,
  setShowAccessCodeModal,
  setShowConfirmModal,
  projects,
  setEditProjectName,
  setShowEditProjectModal,
  setShowCreateProjectModal,
  openProject
}) => {
  const handleViewMembers = (group) => {
    setMembersVisible(prev => prev === group.id ? null : group.id);
  };

  const handleEditGroup = (group) => {
    setEditGroupName(group.group_name);
    setShowEditGroupModal(group);
  };

  const handleLeaveGroup = (group) => {
    setShowConfirmModal({ 
      show: true, 
      type: 'leaveGroup', 
      data: group 
    });
  };

  const handleEditProject = (project) => {
    setEditProjectName(project.project_name);
    setShowEditProjectModal(project);
  };

  const handleDeleteProject = (project) => {
    setShowConfirmModal({ 
      show: true, 
      type: 'deleteProject', 
      data: project 
    });
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <GroupsList
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
        membersVisible={membersVisible}
        onViewMembers={handleViewMembers}
        onEditGroup={handleEditGroup}
        onViewAccessCode={setShowAccessCodeModal}
        onLeaveGroup={handleLeaveGroup}
        onCreateGroup={() => setShowCreateGroupModal(true)}
        onJoinGroup={() => setShowJoinGroupModal(true)}
      />

      <ProjectsList
        selectedGroup={selectedGroup}
        projects={projects}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        onOpenProject={openProject}
        onCreateProject={() => setShowCreateProjectModal(true)}
      />
    </div>
  );
};