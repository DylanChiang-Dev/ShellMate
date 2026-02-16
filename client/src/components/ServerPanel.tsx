import React, { useState, useEffect } from 'react';
import { Server, ServerGroup } from '../types';
import { ContextMenu } from './ContextMenu';
import { ServerModal } from './ServerModal';
import { GroupModal } from './GroupModal';
import { serverGroups, servers } from '../services/api';

interface ServerPanelProps {
  onConnect: (server: Server) => void;
}

export const ServerPanel: React.FC<ServerPanelProps> = ({ onConnect }) => {
  const [groups, setGroups] = useState<ServerGroup[]>([]);
  const [serversList, setServersList] = useState<Server[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; server: Server } | null>(null);
  const [groupContextMenu, setGroupContextMenu] = useState<{ x: number; y: number; group: ServerGroup } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ServerGroup | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [groupsData, serversData] = await Promise.all([
      serverGroups.getAll(),
      servers.getAll(),
    ]);
    setGroups(groupsData);
    setServersList(serversData);
  };

  const toggleGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      await serverGroups.update(groupId, { expanded: !group.expanded });
      loadData();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, server: Server) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, server });
  };

  const handleGroupContextMenu = (e: React.MouseEvent, group: ServerGroup) => {
    e.preventDefault();
    e.stopPropagation();
    setGroupContextMenu({ x: e.clientX, y: e.clientY, group });
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupModalOpen(true);
    setGroupContextMenu(null);
  };

  const handleEditGroup = () => {
    if (groupContextMenu) {
      setEditingGroup(groupContextMenu.group);
      setGroupModalOpen(true);
      setGroupContextMenu(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (groupContextMenu && confirm('确定要删除这个分组吗？分组内的服务器将移至未分组。')) {
      await serverGroups.delete(groupContextMenu.group.id);
      loadData();
      setGroupContextMenu(null);
    }
  };

  const handleSaveGroup = async (name: string) => {
    if (editingGroup) {
      await serverGroups.update(editingGroup.id, { name });
    } else {
      await serverGroups.create(name);
    }
    setGroupModalOpen(false);
    setEditingGroup(null);
    loadData();
  };

  const handleConnect = () => {
    if (contextMenu) {
      onConnect(contextMenu.server);
      setContextMenu(null);
    }
  };

  const handleEdit = () => {
    if (contextMenu) {
      setEditingServer(contextMenu.server);
      setModalOpen(true);
      setContextMenu(null);
    }
  };

  const handleDelete = async () => {
    if (contextMenu && confirm('确定要删除这个服务器吗？')) {
      await servers.delete(contextMenu.server.id);
      loadData();
      setContextMenu(null);
    }
  };

  const handleSave = async (data: Omit<Server, 'id'>) => {
    if (editingServer) {
      await servers.update(editingServer.id, data);
    } else {
      await servers.create(data);
    }
    setModalOpen(false);
    setEditingServer(null);
    loadData();
  };

  const getServersByGroup = (groupId: string) =>
    serversList.filter(s => s.groupId === groupId);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
        <h2 className="font-semibold">服务器</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingGroup(null); setGroupModalOpen(true); }}
            className="text-blue-400 hover:text-blue-300 text-sm"
            title="添加分组"
          >
            + 分组
          </button>
          <button
            onClick={() => { setEditingServer(null); setModalOpen(true); }}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            + 添加
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {groups.map(group => (
          <div key={group.id} className="mb-2">
            <div
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700/50 cursor-pointer"
              onClick={() => toggleGroup(group.id)}
              onContextMenu={(e) => handleGroupContextMenu(e, group)}
            >
              <span className="text-gray-400">
                {group.expanded ? '▼' : '▶'}
              </span>
              <span className="font-medium">{group.name}</span>
              <span className="text-gray-500 text-sm">
                ({getServersByGroup(group.id).length})
              </span>
            </div>

            {group.expanded && (
              <div className="ml-4">
                {getServersByGroup(group.id).map(server => (
                  <div
                    key={server.id}
                    className="px-3 py-2 rounded hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                    onContextMenu={(e) => handleContextMenu(e, server)}
                    onClick={() => onConnect(server)}
                  >
                    <div>
                      <div className="font-medium">{server.name}</div>
                      <div className="text-xs text-gray-400">
                        {server.username}@{server.host}:{server.port}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            { label: '连接', onClick: handleConnect },
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
            { label: '添加分组', onClick: handleAddGroup },
            { label: '编辑分组', onClick: handleEditGroup },
            { label: '删除分组', onClick: handleDeleteGroup, danger: true },
          ]}
          onClose={() => setGroupContextMenu(null)}
        />
      )}

      <ServerModal
        isOpen={modalOpen}
        server={editingServer}
        groups={groups}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditingServer(null); }}
      />

      <GroupModal
        isOpen={groupModalOpen}
        type="server"
        groups={groups}
        editingGroup={editingGroup}
        onSave={handleSaveGroup}
        onClose={() => { setGroupModalOpen(false); setEditingGroup(null); }}
      />
    </div>
  );
};
