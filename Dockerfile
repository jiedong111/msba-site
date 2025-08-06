FROM python:3.12-slim

# Install Node
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app

# Copy everything
COPY . .

# Install Python deps
RUN pip install -r backend/requirements.txt

# Install Node deps and build frontend  
RUN cd frontend && npm install && npm run build

# Start both
CMD cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 & \
    cd frontend && npx serve -s dist -l 3000