FROM node:22-alpine
WORKDIR /app
COPY . .

# For Alpine, use apk instead of apt:
RUN apk update 

# Using ffmpeg-static instead of ffmpeg leads to difficulties with resolving host names (on Alpine)
# and corrupted installations (on Ubuntu). Use regular ffmpeg installation instead which is more
# up-to-date and performant.
RUN apk add ffmpeg

# Install dependencies in a separate step, to avoid rebuilding the entire image when only code
# was changed
COPY package.json package-lock.json ./
RUN npm i

COPY . .

CMD ["node", "dist/index.js"]
EXPOSE 3000