# FROM mongo:4.4
# WORKDIR /app
# RUN mongo mydb --eval 'db.createCollection("campus-connect")'

# Use an official Node.js runtime as the base image
FROM node:21-slim

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy the rest of the application to the working directory
COPY . .

# Make ports available to the world outside the container
EXPOSE 3000
EXPOSE 3030

# Define the command to run the application
# CMD [ "node", "server.js" ]
CMD ["npm", "run", "dev"]