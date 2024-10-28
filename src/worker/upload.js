import { readdirSync } from "fs";
import { parentPort, workerData } from "worker_threads";
import { compressImages, convertPdfToImages } from "../lib/index.js";

async function processPdf() {
  try {
    const { path, format, width, output } = workerData;

    await convertPdfToImages(path, output, format);
    await compressImages(output, width);

    const images = readdirSync(output);
    parentPort.postMessage(images);
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
}

processPdf();
