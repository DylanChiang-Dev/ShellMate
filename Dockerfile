FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY server/src ./src
COPY server/src/data ./src/data

COPY client/package*.json ./client/
COPY client ./client
RUN npm ci --prefix client
RUN npm run build --prefix client

COPY client/dist ./client/dist

EXPOSE 3000

CMD ["node", "src/index.js"]
