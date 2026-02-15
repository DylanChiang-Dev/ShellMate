import React, { useState, useEffect } from 'react';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);

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
        <button
          onClick={() => { setEditingCommand(null); setModalOpen(true); }}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          + 添加
        </button>
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
