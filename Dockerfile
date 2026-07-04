FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all other frontend source code
COPY . .

# Next.js requires environment variables at BUILD time to bake them into the JS
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Build the Next.js production application
RUN npm run build

# Expose port 3000 for the frontend
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "run", "start"]
