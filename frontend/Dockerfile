FROM node:20-alpine as build

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài đặt tất cả dependencies (bao gồm devDependencies)
RUN npm install

# Copy source code
COPY . .

# Build ứng dụng
RUN npm run build

# Stage 2: Nginx để serve static files
FROM nginx:alpine

# Copy built files từ stage trước
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]