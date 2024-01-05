FROM node:alpine as base

ENTRYPOINT [ "npm" ]

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

CMD ["start"]
