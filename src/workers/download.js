import archiver from "archiver";
import { createWriteStream } from "fs";
import { parentPort, workerData } from "worker_threads";

const { output, path } = workerData;
const stream = createWriteStream(path);
const archive = archiver("zip", { zlib: { level: 9 } });

archive.pipe(stream);
archive.directory(output, false);
archive.finalize();

stream.on("close", () => {
  parentPort.postMessage(path);
});

archive.on("error", (err) => {
  throw err;
});
