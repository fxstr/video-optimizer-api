# Overview

Converts a video from an online source in **real time** to a video or image of a desired output format.

# Features
- Support for JPG, AV1, H.264 as output formats
- Supports resizing (width or height)
- Supports trimming (from and/or to)
- Provides caching (once a video has been converted, it is loaded much faster as it is delivered directly from cache) 

# API

## Convert

### Examples

1. Simply convert to H.264:    
    `/convert?source=https://fxstr.com/out/test.mp4`
2. Convert to AV1, width 720px, trim from 1s to 3s:
    `/convert?source=https://fxstr.com/out/test.mp4&format=av1&size=720/&trim=00:00:01.000/00:00:03.000`
3. Extract a 1080px high JPEG at 1.5 seconds:
    `/convert?source=https://fxstr.com/out/test.mp4&format=jpg&size=/1080&trim=00:00:01.500/`

### Endpoint
Call the base URL plus `/convert`, then add your parameters.

### Parameters

#### Source
Mandatory. Provide a URL starting with `http://` or `https://` that points to a video file.

Example: `source=https://fxstr.com/out/test.mp4`

#### Format

Optional; defaults to `h264`. Valid values are currently
- `av1` MP4 video, AV1 encoded
- `h264` MP4 video, H.264 encoded
- `jpg` JPEG still image

Example: `format=av1`

#### Size

Optional. Resizes the video. Currently, cropping is not supported, therefore you may only provide a value for height **or** width.

Format: `{width?}/{height?}` where height **or** width can be provided, both must be even integers
(due to limitations of the underlying library).

Examples:
- `size=720/` for a width of 720px.
- `size=/480` for a height of 480px.

#### Trim

Optional. Trims the video. Times must be provided in the format `hh:mm:ss.sss` (where `sss` are milliseconds).

Format: `{from?)/{to?}`, `from`and `to` in the exact format `hh:mm:ss.sss`.

Examples: 
- `trim=00:00:01.500` to cut of the first 1.5 seconds.
- `trim=/00:00:04.200` to discard everything after 4.2 seconds.
- `trim=00:00:01.200/00:01:00.000` keep the segment between 1.2s and 60s.

#### FPS

Optional. Sets the output framerate. When not set, uses the original vide's framerate. If provided,
must be a number.

Examples: 
- `fps=25`
- `fps=29.97`

#### Quality

Optional. Sets the output quality. If provided, must be a number between 1 and 100. 100 is the
best imaage/video quality, but the biggest file size. To ffmpeg's default values.

Examples: 
- `quality=90`


## Upcoming Features
- [ ] Audio support (currently, all audio is being removed)
- [ ] Faster encoding (depending on the hardware the app is running on)
- [ ] Faster encoding for longer videos (as we split up a longer video into chunks and distribute the encoding of single chunks across multiple servers)
- [ ] Support for more codecs
- [ ] Use and propagate the cache headers from the original video
- [ ] Support for cropping
- [ ] Support for different quality encoding
- [ ] And, maybe, adaptive streaming.

<link rel="stylesheet" href="/styles/style.css">