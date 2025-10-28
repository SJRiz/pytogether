import { Plus, Users, Edit2, Key, ChevronDown, ChevronUp, User, DoorOpen } from "lucide-react";

export const GroupsList = ({ 
  groups, 
  selectedGroup, 
  onSelectGroup,
  loading, 
  membersVisible, 
  onViewMembers, 
  onEditGroup, 
  onViewAccessCode, 
  onLeaveGroup, 
  onCreateGroup, 
  onJoinGroup 
}) => {
  return (
    <div className="w-1/4 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700/50 p-6 flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4 tracking-tight">Groups</h2>
        <div className="flex gap-3 pb-3 border-b-1 border-gray-700">
          <button 
            onClick={onCreateGroup}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 font-medium"
            title="Create Group"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Create</span>
          </button>
          <button 
            onClick={onJoinGroup}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-500 hover:to-green-400 transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 font-medium"
            title="Join Group"
          >
            <Users className="h-4 w-4" />
            <span className="text-sm">Join</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar relative">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="relative">
              <div className="animate-spin border-4 border-gray-600 border-t-blue-500 h-12 w-12 rounded-full"></div>
              <div className="absolute inset-0 animate-ping border-4 border-blue-500/30 h-12 w-12 rounded-full"></div>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
            <Users className="h-12 w-12 opacity-50" />
            <p className="text-sm">No groups yet</p>
          </div>
        ) : (
          <ul className="space-y-3 min-w-max pr-2">
            {groups.map(group => (
              <GroupItem
                key={group.id}
                group={group}
                isSelected={selectedGroup?.id === group.id}
                showMembers={membersVisible === group.id}
                onSelect={() => onSelectGroup(group)}
                onEdit={() => onEditGroup(group)}
                onViewAccessCode={() => onViewAccessCode(group)}
                onViewMembers={() => onViewMembers(group)}
                onLeave={() => onLeaveGroup(group)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const GroupItem = ({ 
  group, 
  isSelected, 
  showMembers, 
  onSelect, 
  onEdit, 
  onViewAccessCode, 
  onViewMembers, 
  onLeave 
}) => {
  return (
    <li 
      className={`rounded-xl transition-all duration-200 overflow-hidden ${
        isSelected 
          ? "bg-gradient-to-br from-blue-600/30 to-blue-700/20 border-2 border-blue-500/60 shadow-lg shadow-blue-500/10" 
          : "bg-gray-700/40 hover:bg-gray-700/60 border-2 border-gray-600/30 hover:border-gray-500/50"
      }`}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span 
            onClick={onSelect}
            className={`flex-1 font-semibold truncate cursor-pointer ${
              isSelected ? "text-white" : "text-gray-200 hover:text-white"
            } transition-colors`}
          >
            {group.group_name}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 rounded-lg transition-all duration-200 text-xs font-medium"
            title="Edit Group"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>
          <button 
            onClick={onViewAccessCode}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 rounded-lg transition-all duration-200 text-xs font-medium"
            title="View Access Code"
          >
            <Key className="h-3.5 w-3.5" />
            <span>Key</span>
          </button>
          <button 
            onClick={onViewMembers}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 rounded-lg transition-all duration-200 text-xs font-medium"
            title="View Members"
          >
            {showMembers ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Members</span>
              </>
            )}
          </button>
          <button 
            onClick={onLeave}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all duration-200"
            title="Leave Group"
          >
            <DoorOpen className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      {showMembers && (
        <div className="px-4 pb-4 pt-2 bg-black/20 border-t border-gray-600/30 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-gray-400" />
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Members ({group.group_members.length})
            </h4>
          </div>
          <ul className="space-y-2">
            {group.group_members.map((member) => (
              <li key={member.id} className="flex items-center gap-2.5 p-2 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-center h-7 w-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-gray-300 truncate">{member.email}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};