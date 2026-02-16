import React, { useState, useEffect } from 'react';
import { Command, CommandGroup } from '../types';
import { ContextMenu } from './ContextMenu';
import { CommandModal } from './CommandModal';
import { GroupModal } from './GroupModal';
import { commandGroups, commands } from '../services/api';

interface CommandPanelProps {
  onExecute: (command: string) => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({ onExecute }) => {
  const [groups, setGroups] = useState<CommandGroup[]>([]);
  const [commandsList, setCommandsList] = useState<Command[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; command: Command } | null>(null);
  const [groupContextMenu, setGroupContextMenu] = useState<{ x: number; y: number; group: CommandGroup; parentId: string | null } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CommandGroup | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

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

  const toggleGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      await commandGroups.update(groupId, { expanded: !group.expanded });
      loadData();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, command: Command) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, command });
  };

  const handleGroupContextMenu = (e: React.MouseEvent, group: CommandGroup, parentId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setGroupContextMenu({ x: e.clientX, y: e.clientY, group, parentId });
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setSelectedParentId(groupContextMenu?.parentId || null);
    setGroupModalOpen(true);
    setGroupContextMenu(null);
  };

  const handleEditGroup = () => {
    if (groupContextMenu) {
      setEditingGroup(groupContextMenu.group);
      setSelectedParentId(groupContextMenu.parentId);
      setGroupModalOpen(true);
      setGroupContextMenu(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (groupContextMenu && confirm('确定要删除这个分组吗？子分组和命令将被一并删除。')) {
      await commandGroups.delete(groupContextMenu.group.id);
      loadData();
      setGroupContextMenu(null);
    }
  };

  const handleSaveGroup = async (name: string, parentId?: string | null) => {
    if (editingGroup) {
      await commandGroups.update(editingGroup.id, { name, parentId: parentId || null });
    } else {
      await commandGroups.create(name, parentId || null);
    }
    setGroupModalOpen(false);
    setEditingGroup(null);
    setSelectedParentId(null);
    loadData();
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

  // Build tree structure
  const getChildGroups = (parentId: string | null) =>
    groups.filter(g => g.parentId === parentId);

  const getCommandsByGroup = (groupId: string) =>
    commandsList.filter(c => c.groupId === groupId);

  const renderGroup = (parentId: string | null, level: number = 0) => {
    const childGroups = getChildGroups(parentId);

    return childGroups.map(group => {
      const hasChildren = getChildGroups(group.id).length > 0 || getCommandsByGroup(group.id).length > 0;

      return (
        <div key={group.id} className={level > 0 ? 'ml-4' : ''}>
          <div
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700/50 cursor-pointer"
            onClick={() => hasChildren && toggleGroup(group.id)}
            onContextMenu={(e) => handleGroupContextMenu(e, group, parentId)}
          >
            {hasChildren && (
              <span className="text-gray-400">
                {group.expanded ? '▼' : '▶'}
              </span>
            )}
            {!hasChildren && <span className="w-4" />}
            <span className="font-medium">{group.name}</span>
          </div>

          {group.expanded && (
            <>
              {renderGroup(group.id, level + 1)}
              {getCommandsByGroup(group.id).map(cmd => (
                <div
                  key={cmd.id}
                  className="ml-4 px-3 py-1.5 rounded hover:bg-gray-700 cursor-pointer flex items-center justify-between text-sm"
                  onClick={() => onExecute(cmd.command)}
                  onContextMenu={(e) => handleContextMenu(e, cmd)}
                >
                  <span className="truncate">{cmd.name}</span>
                </div>
              ))}
            </>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
        <h2 className="font-semibold">命令</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingGroup(null); setSelectedParentId(null); setGroupModalOpen(true); }}
            className="text-blue-400 hover:text-blue-300 text-sm"
            title="添加分组"
          >
            + 分组
          </button>
          <button
            onClick={() => { setEditingCommand(null); setModalOpen(true); }}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            + 添加
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {renderGroup(null)}
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
            { label: '添加子分组', onClick: handleAddGroup },
            { label: '编辑分组', onClick: handleEditGroup },
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

      <GroupModal
        isOpen={groupModalOpen}
        type="command"
        groups={groups}
        editingGroup={editingGroup}
        parentId={selectedParentId}
        onSave={handleSaveGroup}
        onClose={() => { setGroupModalOpen(false); setEditingGroup(null); setSelectedParentId(null); }}
      />
    </div>
  );
};
