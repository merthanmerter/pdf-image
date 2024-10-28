import archiver from "archiver";
import { createWriteStream } from "fs";
import { parentPort, workerData } from "worker_threads";

const { outputPath, zipFilePath } = workerData;
const output = createWriteStream(zipFilePath);
const archive = archiver("zip", { zlib: { level: 9 } });

archive.pipe(output);
archive.directory(outputPath, false);
archive.finalize();

output.on("close", () => {
  parentPort.postMessage(zipFilePath);
});

archive.on("error", (err) => {
  throw err;
});
