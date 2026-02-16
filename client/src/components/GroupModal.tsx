import React, { useState, useEffect } from 'react';
import { ServerGroup, CommandGroup } from '../types';

interface GroupModalProps {
  isOpen: boolean;
  type: 'server' | 'command';
  groups: ServerGroup[] | CommandGroup[];
  editingGroup?: ServerGroup | CommandGroup | null;
  parentId?: string | null;
  onSave: (name: string, parentId?: string | null) => void;
  onClose: () => void;
}

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen, type, groups, editingGroup, parentId, onSave, onClose
}) => {
  const [name, setName] = useState('');
  const [selectedParent, setSelectedParent] = useState<string>('');

  useEffect(() => {
    if (editingGroup) {
      setName(editingGroup.name);
      // For CommandGroup, use parentId property
      const parentIdValue = 'parentId' in editingGroup ? editingGroup.parentId : null;
      setSelectedParent(parentIdValue || '');
    } else {
      setName('');
      setSelectedParent(parentId || '');
    }
  }, [editingGroup, parentId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name, selectedParent || null);
  };

  // For command groups, show parent selection
  const showParentSelect = type === 'command';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 rounded-lg w-full max-w-sm p-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingGroup ? '编辑分组' : '添加分组'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">分组名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
              required
            />
          </div>

          {showParentSelect && (
            <div>
              <label className="block text-sm font-medium mb-1">父级分组</label>
              <select
                value={selectedParent}
                onChange={(e) => setSelectedParent(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
              >
                <option value="">无（顶级分组）</option>
                {(groups as CommandGroup[]).filter(g => g.parentId === null).map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300">
              取消
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
