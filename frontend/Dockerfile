# Dockerfile cho Frontend (./frontend/Dockerfile)
FROM node:18-alpine as build

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Thiết lập npm cache và cài đặt dependencies
RUN npm config set cache /tmp/.npm && \
    npm ci --only=production --silent

# Copy source code
COPY . .

# Build ứng dụng
RUN npm run build

# Stage 2: Nginx để serve static files
FROM nginx:alpine

# Copy built files từ stage trước
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config nếu có
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]