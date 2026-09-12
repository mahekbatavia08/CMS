FROM node:20-bookworm

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy application source code
COPY . .



# Expose the server port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
