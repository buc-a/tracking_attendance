FROM node:18

WORKDIR /app

# Copy package files first for better caching
COPY package.json ./


# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]
