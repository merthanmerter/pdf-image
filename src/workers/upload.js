import { exec } from "child_process";
import { readdirSync, renameSync, unlinkSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { parentPort, workerData } from "worker_threads";

/**
 * Convert PDF to images using pdftoppm
 * @param {string} path - Path to the PDF file
 * @param {string} output - Path to the output folder
 * @param {string} format - Format of the output image (png or jpg)
 * @returns {Promise<void>} - A promise that resolves when the conversion is complete
 */
async function convertPdfToImages(path, output, format) {
  return new Promise((resolve, reject) => {
    const outputPattern = join(output, "page");
    if (format !== "png" && format !== "jpeg") {
      reject("Invalid format. Only PNG and JPG are supported.");
    }
    exec(
      `pdftoppm -${format} ${path} ${outputPattern}`,
      /**
       * Callback function for the exec command
       * @param {Error} error - Error object if an error occurred
       * @param {string} stdout - Standard output of the command
       * @param {string} stderr - Standard error of the command
       * @returns {void}
       */
      (error, stdout, stderr) => {
        if (stdout) console.log(stdout);
        if (error) return reject(error);
        if (stderr) return reject(stderr);
        return resolve({ stdout, stderr });
      },
    );
  });
}

/**
 * Resize and compress images in the same directory
 * @param {string} path - Path where converted images are stored
 * @param {number} width - Width for the resized images (e.g., 300px for thumbnails)
 */
async function compressImages(path, width = 300) {
  // Get all images in the path
  const images = readdirSync(path).filter((file) =>
    /\.(jpg|jpeg|png)$/i.test(file),
  );

  // Resize and compress each image in place
  await Promise.all(
    images.map(async (file) => {
      const filePath = join(path, file);
      const tempFilePath = join(path, `temp_${file}`);

      // Save resized image to a temporary file
      await sharp(filePath)
        .resize(width) // Resize to the given width, maintaining aspect ratio
        .jpeg({ quality: 80 }) // Compress and set JPEG quality
        .toFile(tempFilePath); // Save to temporary file

      // Remove the original file and rename the temp file to the original name
      unlinkSync(filePath);
      renameSync(tempFilePath, filePath);
    }),
  );
}

try {
  const { path, format, width, output } = workerData;

  await convertPdfToImages(path, output, format);
  await compressImages(output, width);

  const images = readdirSync(output);
  parentPort.postMessage(images);
} catch (error) {
  parentPort.postMessage({ error: error.message });
}
