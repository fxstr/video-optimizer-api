FROM node:22-alpine
WORKDIR /app
COPY . .
RUN rm -rf node_modules
# For Alpine, use apk instead of apt:
RUN apk update 
# Using ffmpeg-static instead of ffmpeg leads to difficulties with resolving host names (on Alpine)
# and corrupted installations (on Ubuntu). Use regular ffmpeg installation instead which is more
# up-to-date and performant.
RUN apk add ffmpeg nsd
# RUN apt-get update
# RUN apt-get install -y ffmpeg
RUN npm i
CMD ["node", "dist/index.js"]
EXPOSE 3000