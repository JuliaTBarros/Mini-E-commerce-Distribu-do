FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src/ ./src/
COPY data/ ./data/
EXPOSE 5002 5012
CMD ["npm", "start"]
