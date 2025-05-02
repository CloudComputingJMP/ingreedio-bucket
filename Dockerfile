FROM node:22.12

WORKDIR /code

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm","run","dev"]