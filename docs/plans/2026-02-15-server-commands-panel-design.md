# 服务器和命令面板功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 将SSH终端应用从左右布局改为三栏布局（服务器 | 终端 | 命令），并添加右键菜单、服务器分组展开收起、命令分组等功能。

**Architecture:**
- 左侧服务器面板：支持分组展开/收起，右键菜单（连接/编辑/删除），弹窗添加编辑服务器
- 中间终端区域：保持现有终端功能
- 右侧命令面板：支持2-3层分组展开/收起，左键执行命令，右键菜单（执行/编辑/删除），弹窗添加编辑命令

**Tech Stack:** React 18, TypeScript, Tailwind CSS, @xterm/xterm, Monaco Editor

---

### Task 1: 创建 Worktree 并设置开发环境

**Files:**
- 创建: `.worktrees/feature-server-commands-panel`
- 修改: `.gitignore`

**Step 1: 创建 worktree**

```bash
git worktree add .worktrees/feature-server-commands-panel -b feature/server-commands-panel
cd .worktrees/feature-server-commands-panel
npm install
```

**Step 2: 验证项目运行**

```bash
npm run dev
```

Expected: 项目正常启动，无报错

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add worktree directory to gitignore"
```

---

### Task 2: 修改 TypeScript 类型定义

**Files:**
- 修改: `client/src/types/index.ts`

**Step 1: 添加服务器分组和命令分组类型**

```typescript
// 在现有类型后添加

// 服务器分组
export interface ServerGroup {
  id: string;
  name: string;
  expanded: boolean;
}

// 服务器（更新现有类型）
export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'key';
  password?: string;
  privateKey?: string;
  groupId: string;
}

// 命令分组（支持2-3层）
export interface CommandGroup {
  id: string;
  name: string;
  parentId: string | null;  // null 表示顶级分组
  expanded: boolean;
}

// 命令
export interface Command {
  id: string;
  name: string;
  command: string;
  groupId: string;
}
```

**Step 2: Commit**

```bash
git add client/src/types/index.ts
git commit -feat: add server group and command group types
```

---

### Task 3: 更新后端 API - 服务器分组

**Files:**
- 修改: `server/src/data/servers.json` - 添加分组数据结构
- 修改: `server/src/routes/servers.js` - 添加分组 CRUD API

**Step 1: 更新 servers.json 数据结构**

```json
{
  "groups": [
    { "id": "default", "name": "未分组", "expanded": true }
  ],
  "servers": []
}
```

**Step 2: 添加分组 API 路由**

```javascript
// server/src/routes/servers.js 添加

// GET /api/servers/groups - 获取所有分组
router.get('/groups', (req, res) => {
  const data = loadData();
  res.json(data.groups);
});

// POST /api/servers/groups - 创建分组
router.post('/groups', (req, res) => {
  const { name } = req.body;
  const groups = loadData().groups;
  const newGroup = { id: uuidv4(), name, expanded: true };
  groups.push(newGroup);
  saveData({ groups, servers: loadData().servers });
  res.json(newGroup);
});

// PUT /api/servers/groups/:id - 更新分组
router.put('/groups/:id', (req, res) => {
  const { id } = req.params;
  const { name, expanded } = req.body;
  const data = loadData();
  const group = data.groups.find(g => g.id === id);
  if (group) {
    if (name !== undefined) group.name = name;
    if (expanded !== undefined) group.expanded = expanded;
    saveData(data);
    res.json(group);
  } else {
    res.status(404).json({ error: 'Group not found' });
  }
});

// DELETE /api/servers/groups/:id - 删除分组
router.delete('/groups/:id', (req, res) => {
  const { id } = req.params;
  const data = loadData();
  data.groups = data.groups.filter(g => g.id !== id);
  // 该分组下的服务器移到默认分组
  data.servers = data.servers.map(s =>
    s.groupId === id ? { ...s, groupId: 'default' } : s
  );
  saveData(data);
  res.json({ success: true });
});
```

**Step 3: Commit**

```bash
git add server/src/data/servers.json server/src/routes/servers.js
git commit - "feat: add server groups API endpoints"
```

---

### Task 4: 更新后端 API - 命令分组

**Files:**
- 修改: `server/src/data/snippets.json` - 添加分组数据结构
- 修改: `server/src/routes/snippets.js` - 添加分组 CRUD API

**Step 1: 更新 snippets.json 数据结构**

```json
{
  "groups": [
    { "id": "system", "name": "系统", "parentId": null, "expanded": true },
    { "id": "system-process", "name": "进程相关", "parentId": "system", "expanded": true },
    { "id": "system-network", "name": "网络相关", "parentId": "system", "expanded": true },
    { "id": "docker", "name": "Docker", "parentId": null, "expanded": true },
    { "id": "git", "name": "Git", "parentId": null, "expanded": true }
  ],
  "snippets": []
}
```

**Step 2: 添加分组 API 路由**

```javascript
// server/src/routes/snippets.js 添加

// GET /api/snippets/groups - 获取所有分组
router.get('/groups', (req, res) => {
  const data = loadData();
  res.json(data.groups);
});

// POST /api/snippets/groups - 创建分组
router.post('/groups', (req, res) => {
  const { name, parentId } = req.body;
  const data = loadData();
  const newGroup = { id: uuidv4(), name, parentId: parentId || null, expanded: true };
  data.groups.push(newGroup);
  saveData(data);
  res.json(newGroup);
});

// PUT /api/snippets/groups/:id - 更新分组
router.put('/groups/:id', (req, res) => {
  const { id } = req.params;
  const { name, parentId, expanded } = req.body;
  const data = loadData();
  const group = data.groups.find(g => g.id === id);
  if (group) {
    if (name !== undefined) group.name = name;
    if (parentId !== undefined) group.parentId = parentId;
    if (expanded !== undefined) group.expanded = expanded;
    saveData(data);
    res.json(group);
  } else {
    res.status(404).json({ error: 'Group not found' });
  }
});

// DELETE /api/snippets/groups/:id - 删除分组
router.delete('/groups/:id', (req, res) => {
  const { id } = req.params;
  const data = loadData();
  // 递归删除子分组
  const getAllChildGroupIds = (parentId) => {
    const children = data.groups.filter(g => g.parentId === parentId);
    return [parentId, ...children.flatMap(c => getAllChildGroupIds(c.id))];
  };
  const idsToDelete = getAllChildGroupIds(id);
  data.groups = data.groups.filter(g => !idsToDelete.includes(g.id));
  data.snippets = data.snippets.filter(s => !idsToDelete.includes(s.groupId));
  saveData(data);
  res.json({ success: true });
});
```

**Step 3: Commit**

```bash
git add server/src/data/snippets.json server/src/routes/snippets.js
git commit - "feat: add command groups API with 2-3 level support"
```

---

### Task 5: 更新前端 API 服务

**Files:**
- 修改: `client/src/services/api.ts` - 添加分组 API 调用

**Step 1: 添加服务器分组 API**

```typescript
// 服务器分组
export const serverGroups = {
  getAll: () => api.get<ServerGroup[]>('/servers/groups'),
  create: (name: string) => api.post<ServerGroup>('/servers/groups', { name }),
  update: (id: string, data: Partial<ServerGroup>) => api.put<ServerGroup>(`/servers/groups/${id}`, data),
  delete: (id: string) => api.delete(`/servers/groups/${id}`),
};

// 服务器（更新以支持 groupId）
export const servers = {
  getAll: () => api.get<Server[]>('/servers'),
  create: (data: Omit<Server, 'id'>) => api.post<Server>('/servers', data),
  update: (id: string, data: Partial<Server>) => api.put<Server>(`/servers/${id}`, data),
  delete: (id: string) => api.delete(`/servers/${id}`),
};
```

**Step 2: 添加命令分组 API**

```typescript
// 命令分组
export const commandGroups = {
  getAll: () => api.get<CommandGroup[]>('/snippets/groups'),
  create: (name: string, parentId: string | null) =>
    api.post<CommandGroup>('/snippets/groups', { name, parentId }),
  update: (id: string, data: Partial<CommandGroup>) =>
    api.put<CommandGroup>(`/snippets/groups/${id}`, data),
  delete: (id: string) => api.delete(`/snippets/groups/${id}`),
};

// 命令（更新以支持 groupId）
export const commands = {
  getAll: () => api.get<Command[]>('/snippets'),
  create: (data: Omit<Command, 'id'>) => api.post<Command>('/snippets', data),
  update: (id: string, data: Partial<Command>) => api.put<Command>(`/snippets/${id}`, data),
  delete: (id: string) => api.delete(`/snippets/${id}`),
};
```

**Step 3: Commit**

```bash
git add client/src/services/api.ts
git commit - "feat: add groups API to frontend service"
```

---

### Task 6: 创建右键菜单组件

**Files:**
- 创建: `client/src/components/ContextMenu.tsx`

**Step 1: 创建 ContextMenu 组件**

```tsx
import React, { useState, useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position if menu would go off screen
  const [position, setPosition] = useState({ x, y });
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const newX = Math.min(x, window.innerWidth - rect.width - 10);
      const newY = Math.min(y, window.innerHeight - rect.height - 10);
      setPosition({ x: newX, y: newY });
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-40"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          className={`w-full px-4 py-2 text-left text-sm ${
            item.danger
              ? 'text-red-400 hover:bg-red-900/30'
              : 'text-gray-200 hover:bg-gray-700'
          }`}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add client/src/components/ContextMenu.tsx
git commit - "feat: create ContextMenu component"
```

---

### Task 7: 创建服务器添加/编辑弹窗组件

**Files:**
- 创建: `client/src/components/ServerModal.tsx`

**Step 1: 创建 ServerModal 组件**

```tsx
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
```

**Step 2: Commit**

```bash
git add client/src/components/ServerModal.tsx
git commit - "feat: create ServerModal component"
```

---

### Task 8: 创建命令添加/编辑弹窗组件

**Files:**
- 创建: `client/src/components/CommandModal.tsx`

**Step 1: 创建 CommandModal 组件**

```tsx
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

  // 构建树形选择（支持2-3层）
  const renderGroupOptions = () => {
    const topLevel = groups.filter(g => g.parentId === null);

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
```

**Step 2: Commit**

```bash
git add client/src/components/CommandModal.tsx
git commit - "feat: create CommandModal component"
```

---

### Task 9: 创建服务器面板组件（支持分组和右键菜单）

**Files:**
- 修改: `client/src/components/Dashboard.tsx` - 提取服务器面板部分为独立组件
- 创建: `client/src/components/ServerPanel.tsx`

**Step 1: 创建 ServerPanel 组件**

```tsx
import React, { useState, useEffect } from 'react';
import { Server, ServerGroup } from '../types';
import { ContextMenu } from './ContextMenu';
import { ServerModal } from './ServerModal';
import { serverGroups, servers } from '../services/api';

interface ServerPanelProps {
  onConnect: (server: Server) => void;
}

export const ServerPanel: React.FC<ServerPanelProps> = ({ onConnect }) => {
  const [groups, setGroups] = useState<ServerGroup[]>([]);
  const [serversList, setServersList] = useState<Server[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; server: Server } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);

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
        <button
          onClick={() => { setEditingServer(null); setModalOpen(true); }}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          + 添加
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {groups.map(group => (
          <div key={group.id} className="mb-2">
            <div
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700/50 cursor-pointer"
              onClick={() => toggleGroup(group.id)}
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

      <ServerModal
        isOpen={modalOpen}
        server={editingServer}
        groups={groups}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditingServer(null); }}
      />
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add client/src/components/ServerPanel.tsx
git commit - "feat: create ServerPanel with groups and context menu"
```

---

### Task 10: 创建命令面板组件（支持分组和右键菜单）

**Files:**
- 创建: `client/src/components/CommandPanel.tsx`

**Step 1: 创建 CommandPanel 组件**

```tsx
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

  // 构建树形结构
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
```

**Step 2: Commit**

```bash
git add client/src/components/CommandPanel.tsx
git commit - "feat: create CommandPanel with 2-3 level groups"
```

---

### Task 11: 更新 Dashboard 布局为三栏

**Files:**
- 修改: `client/src/components/Dashboard.tsx`

**Step 1: 更新 Dashboard 布局**

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { Server, Terminal as TerminalType } from '../types';
import { Terminal } from './Terminal';
import { ServerPanel } from './ServerPanel';
import { CommandPanel } from './CommandPanel';
import { auth, servers } from '../services/api';
// ... 其他 imports

export const Dashboard: React.FC = () => {
  // ... 现有状态
  const [commandWs, setCommandWs] = useState<WebSocket | null>(null);
  const terminalRef = useRef<any>(null);

  // ... 现有函数

  const handleExecuteCommand = (command: string) => {
    if (commandWs && commandWs.readyState === WebSocket.OPEN) {
      commandWs.send(JSON.stringify({ type: 'command', data: command }));
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <h1 className="text-lg font-semibold">SSH Terminal</h1>
        <div className="flex items-center gap-4">
          <span>{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white">
            退出
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Server Panel (250px) */}
        <div className="w-64 border-r border-gray-700 bg-gray-800">
          <ServerPanel onConnect={handleConnect} />
        </div>

        {/* Center: Terminal Area (flex-1) */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="h-9 bg-gray-800 border-b border-gray-700 flex items-center">
            {/* ... 现有 tabs 代码 */}
          </div>

          {/* Terminal */}
          <div className="flex-1 bg-black">
            <Terminal
              ref={terminalRef}
              server={currentServer}
              onConnect={handleConnect}
            />
          </div>
        </div>

        {/* Right: Command Panel (250px) */}
        <div className="w-64 border-l border-gray-700 bg-gray-800">
          <CommandPanel onExecute={handleExecuteCommand} />
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add client/src/components/Dashboard.tsx
git commit - "feat: update Dashboard to three-column layout"
```

---

### Task 12: 添加分组管理功能

**Files:**
- 修改: `ServerPanel.tsx` - 添加分组管理按钮
- 修改: `CommandPanel.tsx` - 添加分组管理按钮
- 创建: `GroupModal.tsx` - 分组编辑弹窗（可复用）

**Step 1: 创建分组管理弹窗**

```tsx
import React, { useState, useEffect } from 'react';
import { ServerGroup } from '../types';

interface GroupModalProps {
  isOpen: boolean;
  type: 'server' | 'command';
  groups: ServerGroup[];
  editingGroup?: ServerGroup | null;
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
      setSelectedParent(editingGroup.parentId || '');
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

          {type === 'command' && (
            <div>
              <label className="block text-sm font-medium mb-1">父级分组</label>
              <select
                value={selectedParent}
                onChange={(e) => setSelectedParent(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600"
              >
                <option value="">无（顶级分组）</option>
                {groups.filter(g => g.parentId === null).map(group => (
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
```

**Step 2: 在 ServerPanel 和 CommandPanel 添加分组管理按钮和逻辑**

（代码略，需要在现有组件中添加右键菜单选项"添加分组/编辑分组/删除分组"）

**Step 3: Commit**

```bash
git add client/src/components/GroupModal.tsx client/src/components/ServerPanel.tsx client/src/components/CommandPanel.tsx
git commit - "feat: add group management functionality"
```

---

### Task 13: 测试和修复

**Step 1: 运行项目测试**

```bash
npm run dev
```

测试以下功能：
1. 服务器面板显示，展开/收起分组
2. 右键服务器菜单，连接/编辑/删除
3. 添加服务器弹窗，填写信息并保存
4. 编辑服务器弹窗，修改信息
5. 命令面板显示2-3层分组
6. 左键点击命令发送到终端
7. 右键命令菜单，执行/编辑/删除
8. 添加命令弹窗，选择分组
9. 三栏布局正常显示

**Step 2: 修复发现的问题**

**Step 3: Commit**

```bash
git add .
git commit - "fix: resolve issues found during testing"
```

---

### Task 14: 最终提交和清理

**Step 1: 合并 worktree 到主分支或提交 PR**

```bash
git checkout main
git pull
git merge feature/server-commands-panel
git push
```

或者如果使用 PR：
```bash
git push -u origin feature/server-commands-panel
gh pr create --title "feat: add server groups and command panel with three-column layout" --body "..."
```

**Step 2: 删除 worktree**

```bash
git worktree remove .worktrees/feature-server-commands-panel
```

**Step 3: Commit 清理**

```bash
git commit - "chore: merge server-commands-panel feature"
```

---

## 执行选项

**Plan complete and saved to `docs/plans/2026-02-15-server-commands-panel-design.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
