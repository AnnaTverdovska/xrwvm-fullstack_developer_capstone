FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY app.js review.js dealership.js inventory.js ./
COPY data ./data

EXPOSE 3030

CMD [ "node", "app.js" ]
