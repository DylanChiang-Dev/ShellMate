import React, { useState, useEffect } from 'react';
import { Server, ServerGroup } from '../types';

interface ServerModalProps {
  isOpen: boolean;
  server?: Server | null;
  groups: ServerGroup[];
  onSave: (data: Omit<Server, 'id'>) => void;
  onClose: () => void;
}

export const ServerModal: React.FC<ServerModalProps> = ({
  isOpen,
  server,
  groups,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    authType: 'password' as 'password' | 'key',
    password: '',
    privateKey: '',
    groupId: 'default',
  });

  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name,
        host: server.host,
        port: server.port,
        username: server.username,
        authType: server.authType,
        password: server.password || '',
        privateKey: server.privateKey || '',
        groupId: server.groupId,
      });
    } else {
      setFormData({
        name: '',
        host: '',
        port: 22,
        username: '',
        authType: 'password',
        password: '',
        privateKey: '',
        groupId: 'default',
      });
    }
  }, [server, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          {server ? '编辑服务器' : '添加服务器'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">服务器名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">主机地址</label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">端口</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">用户名</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">认证方式</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.authType === 'password'}
                  onChange={() => setFormData({ ...formData, authType: 'password' })}
                />
                密码
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.authType === 'key'}
                  onChange={() => setFormData({ ...formData, authType: 'key' })}
                />
                密钥
              </label>
            </div>
          </div>

          {formData.authType === 'password' ? (
            <div>
              <label className="block text-sm font-medium mb-1">密码</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">私钥</label>
              <textarea
                value={formData.privateKey}
                onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 h-24 font-mono text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">分组</label>
            <select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
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
