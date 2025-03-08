FROM node:18-alpine

# Set timezone
RUN apk add --no-cache tzdata
ENV TZ=Asia/Singapore

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
