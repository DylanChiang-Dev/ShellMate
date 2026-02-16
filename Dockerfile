FROM node:20-alpine

WORKDIR /app

# 安装 server 依赖
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# 安装 client 依赖并构建
COPY client/package*.json ./client/
COPY client/vite.config.ts ./client/
COPY client/tsconfig*.json ./client/
COPY client/postcss.config.js ./client/
COPY client/tailwind.config.js ./client/
WORKDIR /app/client
RUN npm ci
RUN npm run build

# 回到根目录
WORKDIR /app

# 复制源码
COPY server/src ./server/src

# 复制前端构建产物
COPY client/dist ./client/dist

EXPOSE 3000

CMD ["node", "server/src/index.js"]
