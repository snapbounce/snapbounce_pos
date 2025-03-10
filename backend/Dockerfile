FROM node:18-alpine

# Set timezone
RUN apk add --no-cache tzdata
ENV TZ=Asia/Singapore

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Create volume for persistent data
VOLUME /usr/src/app/data

EXPOSE 3000

CMD ["node", "src/index.js"]
