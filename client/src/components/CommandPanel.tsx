import React, { useState, useEffect, useRef } from 'react';
import { Command, CommandGroup } from '../types';
import { ContextMenu } from './ContextMenu';
import { CommandModal } from './CommandModal';
import { commandGroups, commands } from '../services/api';

interface CommandPanelProps {
  onExecute: (command: string) => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({ onExecute }) => {
  const [groups, setGroups] = useState<CommandGroup[]>([]);
  const [commandsList, setCommandsList] = useState<Command[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; command: Command } | null>(null);
  const [groupContextMenu, setGroupContextMenu] = useState<{ x: number; y: number; group: CommandGroup } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all'); // 'all' or group id
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [groupsData, commandsData] = await Promise.all([
      commandGroups.getAll(),
      commands.getAll(),
    ]);
    setGroups(groupsData);
    setCommandsList(commandsData);
  };

  const handleContextMenu = (e: React.MouseEvent, command: Command) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, command });
  };

  const handleGroupContextMenu = (e: React.MouseEvent, group: CommandGroup) => {
    e.preventDefault();
    setGroupContextMenu({ x: e.clientX, y: e.clientY, group });
  };

  const handleTabDoubleClick = (groupId: string, groupName: string) => {
    setEditingTabId(groupId);
    setEditingTabName(groupName);
  };

  const handleTabEditSave = async () => {
    if (editingTabId && editingTabName.trim()) {
      await commandGroups.update(editingTabId, { name: editingTabName.trim() });
      loadData();
    }
    setEditingTabId(null);
    setEditingTabName('');
  };

  const handleTabEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTabEditSave();
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
      setEditingTabName('');
    }
  };

  const handleDeleteGroup = async () => {
    if (groupContextMenu && confirm('确定要删除这个分组吗？分组内的命令将被一并删除。')) {
      await commandGroups.delete(groupContextMenu.group.id);
      loadData();
      if (activeTab === groupContextMenu.group.id) {
        setActiveTab('all');
      }
      setGroupContextMenu(null);
    }
  };

  const handleAddGroup = () => {
    const name = prompt('请输入分组名称:');
    if (name?.trim()) {
      commandGroups.create(name.trim(), null).then(() => loadData());
    }
  };

  const handleExecute = () => {
    if (contextMenu) {
      onExecute(contextMenu.command.command);
      setContextMenu(null);
    }
  };

  const handleEdit = () => {
    if (contextMenu) {
      setEditingCommand(contextMenu.command);
      setModalOpen(true);
      setContextMenu(null);
    }
  };

  const handleDelete = async () => {
    if (contextMenu && confirm('确定要删除这个命令吗？')) {
      await commands.delete(contextMenu.command.id);
      loadData();
      setContextMenu(null);
    }
  };

  const handleSave = async (data: Omit<Command, 'id'>) => {
    if (editingCommand) {
      await commands.update(editingCommand.id, data);
    } else {
      await commands.create(data);
    }
    setModalOpen(false);
    setEditingCommand(null);
    loadData();
  };

  // Get commands based on active tab
  const getFilteredCommands = () => {
    if (activeTab === 'all') {
      return commandsList;
    }
    return commandsList.filter(c => c.groupId === activeTab);
  };

  const renderTabs = () => (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-700 overflow-x-auto" ref={tabsRef}>
      {/* All tab */}
      <button
        onClick={() => setActiveTab('all')}
        className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
          activeTab === 'all'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
      >
        全部
      </button>

      {/* Group tabs */}
      {groups.map(group => (
        editingTabId === group.id ? (
          <input
            key={group.id}
            type="text"
            value={editingTabName}
            onChange={(e) => setEditingTabName(e.target.value)}
            onBlur={handleTabEditSave}
            onKeyDown={handleTabEditKeyDown}
            className="px-2 py-0.5 text-sm bg-gray-700 text-white rounded border border-blue-500 outline-none w-20"
            autoFocus
          />
        ) : (
          <button
            key={group.id}
            onClick={() => setActiveTab(group.id)}
            onDoubleClick={() => handleTabDoubleClick(group.id, group.name)}
            onContextMenu={(e) => handleGroupContextMenu(e, group)}
            className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
              activeTab === group.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {group.name}
          </button>
        )
      ))}

      {/* Add group button */}
      <button
        onClick={handleAddGroup}
        className="px-2 py-1 text-gray-400 hover:text-white text-sm"
        title="添加分组"
      >
        +
      </button>
    </div>
  );

  const renderCommands = () => {
    const filteredCommands = getFilteredCommands();

    if (filteredCommands.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          {activeTab === 'all' ? '暂无命令，点击"添加"创建' : '该分组暂无命令'}
        </div>
      );
    }

    return filteredCommands.map(cmd => (
      <div
        key={cmd.id}
        className="px-3 py-2 rounded hover:bg-gray-700 cursor-pointer flex items-center justify-between"
        onClick={() => onExecute(cmd.command)}
        onContextMenu={(e) => handleContextMenu(e, cmd)}
      >
        <span className="truncate">{cmd.name}</span>
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
        <h2 className="font-semibold">命令</h2>
        <button
          onClick={() => { setEditingCommand(null); setModalOpen(true); }}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          + 添加
        </button>
      </div>

      {/* Tab bar */}
      {renderTabs()}

      {/* Commands list */}
      <div className="flex-1 overflow-y-auto p-2">
        {renderCommands()}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            { label: '执行', onClick: handleExecute },
            { label: '编辑', onClick: handleEdit },
            { label: '删除', onClick: handleDelete, danger: true },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {groupContextMenu && (
        <ContextMenu
          x={groupContextMenu.x}
          y={groupContextMenu.y}
          items={[
            { label: '删除分组', onClick: handleDeleteGroup, danger: true },
          ]}
          onClose={() => setGroupContextMenu(null)}
        />
      )}

      <CommandModal
        isOpen={modalOpen}
        command={editingCommand}
        groups={groups}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditingCommand(null); }}
      />
    </div>
  );
};
