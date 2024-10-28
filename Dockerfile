# Start from a base Node.js image
FROM node:18

# Install ImageMagick and Poppler-utils
RUN apt-get update && \
  apt-get install -y imagemagick poppler-utils && \
  rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy app files
COPY . .

# Install dependencies
RUN npm install

# Expose port for the Express server
EXPOSE 3000

# Run the app
CMD ["node", "src/index.js"]
