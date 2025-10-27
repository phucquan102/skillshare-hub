FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy .env file nếu có
COPY .env ./

COPY . .

EXPOSE 3004

CMD ["npm", "start"]