FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all other frontend source code (including .env.local)
COPY . .

# Build the Next.js production application
# Next.js will automatically find and read the .env.local file during this build step!
RUN npm run build

# Expose port 3000 for the frontend
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "run", "start"]
