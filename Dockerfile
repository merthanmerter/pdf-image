# Start from a base Node.js image
FROM node:18

# Install ImageMagick and Poppler-utils for image and PDF processing
RUN apt-get update && \
  apt-get install -y imagemagick poppler-utils && \
  rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy application files (including workers) to the container
COPY . .

# Install dependencies
RUN npm install

# Expose the port for the Express server
EXPOSE 3000

# Start the app
CMD ["node", "src/index.js"]
