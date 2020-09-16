FROM node:latest

WORKDIR /app

COPY package-lock.json package.json /app/

RUN npm install

COPY lib/ /app/lib
COPY web/ /app/web


EXPOSE 1337

CMD npm run start
