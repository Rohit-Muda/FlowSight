FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# Must match server.js: process.env.PORT || 5000
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]