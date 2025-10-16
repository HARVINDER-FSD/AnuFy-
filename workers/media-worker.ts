import { mediaProcessingQueue } from "../lib/queue"
import { storageService } from "../services/storage"
import sharp from "sharp"
import ffmpeg from "fluent-ffmpeg"

// Process image optimization
mediaProcessingQueue.process("optimize-image", 5, async (job) => {
  const { imageUrl, sizes, quality = 80 } = job.data

  try {
    const optimizedImages = []

    for (const size of sizes) {
      const optimized = await sharp(imageUrl)
        .resize(size.width, size.height, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality })
        .toBuffer()

      const optimizedUrl = await storageService.uploadBuffer(
        optimized,
        `optimized/${size.width}x${size.height}_${Date.now()}.jpg`,
        "image/jpeg",
      )

      optimizedImages.push({
        size: `${size.width}x${size.height}`,
        url: optimizedUrl,
      })
    }

    job.progress(100)
    return { optimizedImages }
  } catch (error) {
    console.error("Error optimizing image:", error)
    throw error
  }
})

// Process video transcoding
mediaProcessingQueue.process("transcode-video", 2, async (job) => {
  const { videoUrl, formats } = job.data

  try {
    const transcodedVideos = []

    for (let i = 0; i < formats.length; i++) {
      const format = formats[i]

      const outputPath = `/tmp/transcoded_${Date.now()}_${format.quality}.mp4`

      await new Promise((resolve, reject) => {
        ffmpeg(videoUrl)
          .videoCodec("libx264")
          .audioCodec("aac")
          .size(format.resolution)
          .videoBitrate(format.bitrate)
          .output(outputPath)
          .on("end", resolve)
          .on("error", reject)
          .run()
      })

      const transcodedUrl = await storageService.uploadFile(
        outputPath,
        `transcoded/${format.quality}_${Date.now()}.mp4`,
        "video/mp4",
      )

      transcodedVideos.push({
        quality: format.quality,
        resolution: format.resolution,
        url: transcodedUrl,
      })

      // Update progress
      job.progress(Math.round(((i + 1) / formats.length) * 100))
    }

    return { transcodedVideos }
  } catch (error) {
    console.error("Error transcoding video:", error)
    throw error
  }
})

// Generate video thumbnails
mediaProcessingQueue.process("generate-thumbnail", 10, async (job) => {
  const { videoUrl, timestamps = [1, 5, 10] } = job.data

  try {
    const thumbnails = []

    for (const timestamp of timestamps) {
      const thumbnailPath = `/tmp/thumbnail_${Date.now()}_${timestamp}.jpg`

      await new Promise((resolve, reject) => {
        ffmpeg(videoUrl)
          .screenshots({
            timestamps: [timestamp],
            filename: `thumbnail_${timestamp}.jpg`,
            folder: "/tmp",
            size: "320x240",
          })
          .on("end", resolve)
          .on("error", reject)
      })

      const thumbnailUrl = await storageService.uploadFile(
        thumbnailPath,
        `thumbnails/${timestamp}_${Date.now()}.jpg`,
        "image/jpeg",
      )

      thumbnails.push({
        timestamp,
        url: thumbnailUrl,
      })
    }

    job.progress(100)
    return { thumbnails }
  } catch (error) {
    console.error("Error generating thumbnails:", error)
    throw error
  }
})

console.log("Media processing worker started")
