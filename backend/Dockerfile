# Use the official Python 3.11 slim image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Gunicorn for production-grade serving
RUN pip install --no-cache-dir gunicorn

# Copy the rest of the backend source code
COPY . .

# Expose port 8000
EXPOSE 8000

# Run FastAPI with Gunicorn and Uvicorn workers for high performance
CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
