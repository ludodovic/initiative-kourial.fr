# Development image only; it is not intended for production deployment.
FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

EXPOSE 4200

# Keep installed dependencies available when the project directory is bind-mounted.
VOLUME ["/app/node_modules"]

CMD ["npm", "run", "start:docker", "--", "--host", "0.0.0.0", "--poll", "1000"]
