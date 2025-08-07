FROM python:3.12-slim

# Install Node.js and nginx
RUN apt-get update && apt-get install -y curl nginx && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install backend
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ backend/

# Copy and build frontend
COPY frontend/package*.json frontend/
WORKDIR /app/frontend
RUN npm install
COPY frontend/ .
RUN npm run build

# Setup nginx to serve frontend and proxy /api to backend
RUN echo 'server { \n\
    listen 3000; \n\
    location / { \n\
        root /app/frontend/dist; \n\
        try_files $uri /index.html; \n\
    } \n\
    location /api { \n\
        proxy_pass http://localhost:8000; \n\
    } \n\
}' > /etc/nginx/sites-available/default

WORKDIR /app

EXPOSE 3000

# Fix: cd into backend directory before running uvicorn
CMD cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 & \
    nginx -g 'daemon off;'