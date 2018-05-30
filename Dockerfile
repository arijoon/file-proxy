FROM resin/raspberry-pi-alpine:latest

RUN apk add --update nodejs nodejs-npm

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=80

CMD [ "npm", "start" ]