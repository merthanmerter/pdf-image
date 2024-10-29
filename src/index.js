import ejs from "ejs";
import express from "express";
import { mkdirSync, rmSync, unlinkSync } from "fs";
import multer from "multer";
import { join } from "path";
import { Worker } from "worker_threads";

/**
 * Create and configure the Express app
 */
const app = express();
const upload = multer({ dest: "/tmp/uploads/" });
const output = "/tmp/dist";

/**
 * Configure view engine
 */
app.set("view engine", "ejs");
app.engine("html", ejs.renderFile);
app.set("views", join(process.cwd(), "src", "views"));
app.use(express.static(join(process.cwd(), "src", "public")));
app.use("/dist", express.static(output));

/**
 * Render the index page
 */
app.get("/", (req, res) => {
  res.render("index.html");
});

app.post("/upload", upload.single("pdf"), (req, res) => {
  const path = req.file.path;
  const format = req.body.format;
  const width = parseInt(req.body.width);

  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });

  const workerPath = join(process.cwd(), "src", "workers", "upload.js");
  const worker = new Worker(workerPath, {
    workerData: { path, format, width, output },
  });

  worker.on("message", (images) => {
    res.render("output.html", {
      images: images.map((file) => `/dist/${file}`),
    });
  });

  worker.on("error", (err) => {
    res.status(500).send(`Conversion error: ${err.message}`);
  });

  worker.on("exit", (code) => {
    unlinkSync(path);
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });
});

app.get("/download-zip", (_, res) => {
  const workerPath = join(process.cwd(), "src", "workers", "download.js");
  const worker = new Worker(workerPath, {
    workerData: { outputPath: "/tmp/dist", zipFilePath: "/tmp/dist.zip" },
  });

  worker.on("message", (zipFilePath) => {
    res.download(zipFilePath, "images.zip", (err) => {
      if (err) {
        console.error("Error downloading zip file:", err);
      } else {
        unlinkSync(zipFilePath);
      }
    });
  });

  worker.on("error", (err) => {
    res.status(500).send({ error: `Error creating zip file: ${err.message}` });
  });
});

/**
 * Start the server
 */
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
