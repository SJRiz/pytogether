import { Plus, Users, Edit2, Key, ChevronDown, ChevronUp, User, DoorOpen } from "lucide-react";

export const GroupsList = ({ 
  groups, 
  selectedGroup, 
  onSelectGroup, 
  membersVisible, 
  onViewMembers, 
  onEditGroup, 
  onViewAccessCode, 
  onLeaveGroup, 
  onCreateGroup, 
  onJoinGroup 
}) => {
  return (
    <div className="w-1/4 bg-gray-800 border-r border-gray-700 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <h2 className="text-lg font-semibold text-white">Groups</h2>
        <div className="flex space-x-2">
          <button 
            onClick={onCreateGroup}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            title="Create Group"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button 
            onClick={onJoinGroup}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
            title="Join Group"
          >
            <Users className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <ul className="flex-1 overflow-y-auto space-y-2">
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
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected 
          ? "bg-blue-600/20 border border-blue-500/50" 
          : "bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50"
      }`}
    >
      <div className="flex justify-between items-center">
        <span 
          onClick={onSelect}
          className="flex-1 text-white font-medium truncate"
        >
          {group.group_name}
        </span>
        <div className="flex space-x-1">
          <button 
            onClick={onEdit}
            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
            title="Edit Group"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={onViewAccessCode}
            className="p-1 text-orange-400 hover:text-orange-300 transition-colors"
            title="View Access Code"
          >
            <Key className="h-4 w-4" />
          </button>
          <button 
            onClick={onViewMembers}
            className="p-1 text-purple-400 hover:text-purple-300 transition-colors"
            title="View Members"
          >
            {showMembers ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <button 
            onClick={onLeave}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            title="Leave Group"
          >
            <DoorOpen className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {showMembers && (
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
  );
};