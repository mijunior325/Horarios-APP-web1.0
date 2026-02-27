# Use the official Node.js image as the base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

#Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Verify that Vite is installed correctly
RUN ls -l node_modules/.bin && npx vite --version

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that the application will run on
EXPOSE 5173

# Start the applicationCMD ["npm", "run", "dev"]
CMD ["npm", "run", "dev"]