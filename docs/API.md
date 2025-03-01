# Overview

Converts a video from an online source in **real time** to a video or image of a desired output
format.

# Features
- Support for JPG, AV1, H.264 as output formats
- Supports resizing (width, height or both)
- Supports trimming (from and/or to)
- Provides caching (once a video has been converted, it is loaded much faster as it is delivered
    directly from cache) 

# API

## Convert

### Examples

1. Simply convert to H.264:    
    `/convert?source=https://fxstr.com/out/test.mp4`
2. Convert to AV1, width 720px, trim from 1s to 3s at 20 frames per second:
    `/convert?source=https://fxstr.com/out/test.mp4&format=av1&size=720/&trim=00:00:01.000/00:00:03.000&fps=20`
3. Extract a 1080px high JPEG at 1.5 seconds:
    `/convert?source=https://fxstr.com/out/test.mp4&format=jpg&size=/1080&trim=00:00:01.500/`

### Endpoint
Call the base URL plus `/convert`, then add your parameters.

### Parameters

#### Source
Mandatory. Provide a URL starting with `http://` or `https://` that points to a video file.

Make sure to URL-encode the entire URL, e.g. by using `encodeURIComponent()` in JavaScript. Why?
If your URL contains a `&` sign, the characters following it will be interpreted by the video
optimizer, which might cause it to fail. A URL-encoded `&` will become `%26` and is safe to use.

Example: `source=https://fxstr.com/out/test.mp4` or URL-encoded:
`source=https%3A%2F%2Ffxstr.com%2Fout%2Ftest.mp4`

#### Format

Optional; defaults to `h264`. Valid values are currently
- `av1` MP4 video, AV1 encoded
- `h264` MP4 video, H.264 encoded
- `jpg` JPEG still image

Example: `format=av1`

#### Size (includes Cropping)

Optional. Resizes the video and crops it, if necessary.

Format: `{width?}/{height?}` where height or width or both can be provided. `width` and `height`
must be **even** integers (due to limitations of the underlying library).

If you provide both `width` **and** `height`, the video will be cropped around the center to fit the
dimensions. If you only provide `width` or `height`, the other dimension will be calculated
to fit the original video's aspect ratio.

Examples:
- `size=720/` for a width of 720px.
- `size=/480` for a height of 480px.
- `size=320/720` for a portrait video with a width of 320px and a height of 720px; video might be
    cropped if the original video's aspect ratio differs from the desired one.

#### Trim

Optional. Trims the video. Times must be provided in the format `hh:mm:ss.sss` (where `sss` are
milliseconds).

Format: `{from?)/{to?}`, `from` and `to` in the exact format `hh:mm:ss.sss`.

Examples: 
- `trim=00:00:01.500` to cut off the first 1.5 seconds.
- `trim=/00:00:04.200` to discard everything after 4.2 seconds.
- `trim=00:00:01.200/00:01:00.000` keep the segment between 1.2s and 60s.

#### FPS

Optional. Sets the output framerate. When not set, uses the original video's framerate. If provided,
must be a positive number.

Examples: 
- `fps=25`
- `fps=29.97`

#### Quality

Optional. Sets the output quality. If provided, must be a number between 0 and 100. 100 is the
best image/video quality (and produces the largest files).

Defaults (according to Ffmpeg):
- h264: `55`
- av1: `44`
- jpg: `80`

Examples:
- `quality=90` (for high quality and large file size output)

#### Keyframes

Optional. Defines the interval for keyframes (a value of `50` means that every 50th frame is a
keyframe/I-frame). If not set, uses the original video's keyframe interval. If provided,
must be a positive integer.

Examples:
- `keyframe=50`


## Upcoming Features
- [ ] Audio support (currently, all audio is being removed)
- [ ] Faster encoding (depending on the hardware the app is running on)
- [ ] Faster encoding for longer videos (as we split up a longer video into chunks and distribute
    the encoding of single chunks across multiple servers)
- [x] Support for more codecs
- [x] Use and propagate the `Cache-Control` headers from the original video
- [x] Support for cropping
- [x] Support for different quality encoding
- [ ] And, maybe, adaptive streaming.

<link rel="stylesheet" href="/styles/style.css">