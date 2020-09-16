FROM node:12.18.3

WORKDIR /recipeSearchServer

ENV NODE_ENV=production

COPY ./ ./

RUN npm install
RUN npm run build

CMD ["npm", "start"]