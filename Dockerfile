# --- Step 1: BUILD ---
FROM --platform=linux/amd64 node:20-alpine As development

# Working directory
WORKDIR /usr/src/app

# Copy dependencies and install them
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Compile the application (generates the /dist folder)
RUN npm run build

# --- Step 2: Production (RUN) ---
# Here we also force the platform for the final container
FROM --platform=linux/amd64 node:20-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

# Install ONLY production dependencies (lighter and safer)
RUN npm install --only=production

# Copy only the compiled files from the previous stage
COPY --from=development /usr/src/app/dist ./dist

# Expose the port the app runs on
ENV PORT=3000
EXPOSE ${PORT}

# Command to run the application
CMD ["node", "dist/main"]