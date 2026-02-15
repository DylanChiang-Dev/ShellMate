import React, { useState, useEffect } from 'react';
import { Command, CommandGroup } from '../types';

interface CommandModalProps {
  isOpen: boolean;
  command?: Command | null;
  groups: CommandGroup[];
  onSave: (data: Omit<Command, 'id'>) => void;
  onClose: () => void;
}

export const CommandModal: React.FC<CommandModalProps> = ({
  isOpen,
  command,
  groups,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    name: '',
    command: '',
    groupId: '',
  });

  useEffect(() => {
    if (command) {
      setFormData({
        name: command.name,
        command: command.command,
        groupId: command.groupId,
      });
    } else {
      setFormData({
        name: '',
        command: '',
        groupId: groups[0]?.id || '',
      });
    }
  }, [command, isOpen, groups]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Build tree selection (supports 2-3 levels)
  const renderGroupOptions = () => {
    const renderOptions = (parentId: string | null, level: number) => {
      const items = groups.filter(g => g.parentId === parentId);
      return items.map(group => (
        <React.Fragment key={group.id}>
          <option value={group.id}>
            {'  '.repeat(level)}{level > 0 ? '└─ ' : ''}{group.name}
          </option>
          {renderOptions(group.id, level + 1)}
        </React.Fragment>
      ));
    };

    return renderOptions(null, 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          {command ? '编辑命令' : '添加命令'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">命令名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">命令内容</label>
            <textarea
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 h-32 font-mono text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">分组</label>
            <select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
            >
              {renderGroupOptions()}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
