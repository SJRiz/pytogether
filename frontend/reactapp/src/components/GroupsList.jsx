import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Edit2, Key, ChevronDown, ChevronUp, User, DoorOpen, Code, Menu, X } from "lucide-react";

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
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 left-6 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl md:hidden transition-all duration-200 active:scale-95"
          aria-label="Toggle Groups Menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        <div className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-[#0B0F17] border-r border-slate-800 z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 tracking-tight">Groups</h2>
              
              <div className="flex gap-2 mb-3">
                <button 
                  onClick={() => { onCreateGroup(); setIsOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 font-medium text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create</span>
                </button>
                
                <button 
                  onClick={() => { onJoinGroup(); setIsOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 font-medium text-sm"
                >
                  <Users className="h-4 w-4" />
                  <span>Join</span>
                </button>
              </div>

              <button 
                onClick={() => { navigate('/playground'); setIsOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700/10 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all duration-200 font-medium text-sm"
              >
                <Code className="h-4 w-4" />
                <span>Offline Playground</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
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
                  <p className="text-sm text-center">No groups yet. Create one to get started!</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {groups.map(group => (
                    <GroupItem
                      key={group.id}
                      group={group}
                      isSelected={selectedGroup?.id === group.id}
                      showMembers={membersVisible === group.id}
                      onSelect={() => { onSelectGroup(group); setIsOpen(false); }}
                      onEdit={() => onEditGroup(group)}
                      onViewAccessCode={() => onViewAccessCode(group)}
                      onViewMembers={() => onViewMembers(group)}
                      onLeave={() => onLeaveGroup(group)}
                      isMobile={true}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="w-1/4 bg-[#0B0F17]/70 border-r border-slate-800 p-6 flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4 tracking-tight">Groups</h2>
        
        <div className="flex gap-3 pb-3 border-b-0 border-gray-700">
          <button 
            onClick={onCreateGroup}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700/100 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-medium"
            title="Create Group"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Create</span>
          </button>
          
          <button 
            onClick={onJoinGroup}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-200 font-medium"
            title="Join Group"
          >
            <Users className="h-4 w-4" />
            <span className="text-sm">Join</span>
          </button>
        </div>
        
        <div className="pb-3 border-b border-gray-700">
            <button 
              onClick={() => navigate('/playground')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700/10 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-200 font-medium group"
              title="Go to Offline Playground"
            >
              <Code className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
              <span className="text-sm">Offline Playground</span>
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
            <p className="text-sm">No groups yet. Create one to get started!</p>
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
                isMobile={false}
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
  onLeave,
  isMobile = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <li 
      className={`rounded-xl transition-all duration-200 overflow-hidden ${
        isSelected 
          ? "bg-gradient-to-br from-blue-600/30 to-blue-700/20 border-2 border-blue-500/60 shadow-lg shadow-blue-500/10" 
          : "bg-gray-700/40 hover:bg-gray-700/60 border-2 border-gray-600/30 hover:border-gray-500/50"
      } ${!isMobile ? 'group' : ''}`}
    >
      <div className="p-3 md:p-4">
        <div className={`flex justify-between items-center ${isMobile || isExpanded ? 'mb-3' : 'mb-0 group-hover:mb-3'} transition-all duration-200`}>
          <span 
            onClick={onSelect}
            className={`flex-1 font-semibold truncate cursor-pointer text-sm md:text-base ${
              isSelected ? "text-white" : "text-gray-200 hover:text-white"
            } transition-colors`}
          >
            {group.group_name}
          </span>
          
          {isMobile && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="ml-2 p-1 hover:bg-gray-600/50 rounded-lg"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
        
        <div className={`flex gap-2 transition-all duration-200 ${
          isMobile 
            ? (isExpanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 overflow-hidden')
            : 'max-h-0 opacity-0 overflow-hidden group-hover:max-h-20 group-hover:opacity-100'
        }`}>
          <button 
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 md:px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 rounded-lg transition-all duration-200 text-xs font-medium"
            title="Edit Group"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button 
            onClick={onViewAccessCode}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 md:px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 rounded-lg transition-all duration-200 text-xs font-medium"
            title="View Access Code"
          >
            <Key className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Key</span>
          </button>
          <button 
            onClick={onViewMembers}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 md:px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 rounded-lg transition-all duration-200 text-xs font-medium"
            title="View Members"
          >
            {showMembers ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hide</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Members</span>
              </>
            )}
          </button>
          <button 
            onClick={onLeave}
            className="px-2 md:px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all duration-200"
            title="Leave Group"
          >
            <DoorOpen className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      {showMembers && (
        <div className="px-3 md:px-4 pb-3 md:pb-4 pt-2 bg-black/20 border-t border-gray-600/30 animate-fadeIn">
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
                <span className="text-xs md:text-sm text-gray-300 truncate">{member.email}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};