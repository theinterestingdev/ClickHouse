FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .

# Install Python dependencies in a single layer to reduce image size
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create data directory if it doesn't exist
RUN mkdir -p /app/data

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Run the application
CMD ["python", "app.py"] 