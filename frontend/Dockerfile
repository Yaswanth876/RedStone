# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Install npm dependencies
COPY package*.json ./
RUN npm ci

# Copy project files
COPY . .

# Set Vite build environment variables (can be overridden via build args)
ARG VITE_API_BASE_URL=http://localhost:4000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build static assets
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built static files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
