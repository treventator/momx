# Use an official Node runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app/backend

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Make port 4455 available to the world outside this container
EXPOSE 4455

# Define environment variable (optional, can be set in docker-compose)
# ENV NODE_ENV production

# Run server.js when the container launches
CMD [ "npm", "start" ] 