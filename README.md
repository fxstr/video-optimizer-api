# Intro

Basically makes [FFmpeg](https://www.ffmpeg.org/) easily accessible through a URL-based interface
and transcodes videos from a provided source in real time.

Example URL: `http://localhost:1234/convert?source=https://example.com/video.mov&format=av1&size=720/`.

# Setup

## Run it

Run locally: `npm i`, then `npm start`.

Docker:
- `docker build -t video-optimizer .`
- `docker run -d -p 1234:3000 video-optimizer` to expose it on `localhost:1234`

## Deploy it

[Install fly](https://fly.io/docs/flyctl/install/), create an account, login, then:

### Production
Create: `fly apps create video-optimizer-production --org video-optimizer`
Deploy: `flyctl deploy -c fly.production.toml`

### Staging
Create: `fly apps create video-optimizer-staging --org video-optimizer`
Deploy: `flyctl deploy -c fly.staging.toml`

## Test it

`npm test` or `npm run test:watch`

To test a single file: `npm test:watch -- path/to-file.ts`. 

To run a single test: `npm test:watch -t "name of the test"`.

# API

See the [API docs](docs/API.md).

- We do not use aliases to facilitate caching.
- We try to keep parameters easily understandable and easy to use (one parameter with multiple
values instead of multiple parameters with one value).
- We do not shorten parameters as their size (a few bytes) is negligible compared to the video's
size.
- As parameter names we use property, not function names (e.g. time instead of trim). Why? Because
URLs are resource locators that return a response for the properties provided.