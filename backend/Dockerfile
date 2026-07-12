# Use an official PyTorch image with CUDA support
FROM pytorch/pytorch:2.2.1-cuda12.1-cudnn8-runtime

# Set working directory
WORKDIR /app

# Install system dependencies (required for OpenCV / PIL image handling under Linux)
RUN apt-get update && apt-get install -y \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python packages (filtering out pre-installed torch/torchvision from requirements.txt to save build time)
RUN sed -i '/^torch/d' requirements.txt && \
    pip install --no-cache-dir -r requirements.txt

# Copy all backend source code
COPY . .

# Expose Hugging Face Spaces port (7860 by default)
EXPOSE 7860

# Set environment variables
ENV PORT=7860
ENV PYTHONUNBUFFERED=1

# Start the Flask backend server
CMD ["python", "app.py"]
