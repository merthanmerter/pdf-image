import ejs from "ejs";
import express from "express";
import { mkdirSync, rmSync, unlinkSync } from "fs";
import multer from "multer";
import { join } from "path";
import { Worker } from "worker_threads";
import { log, worker_path } from "./lib/index.js";

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

  /**
   * Remove the output directory and create a new one
   * to store the converted images
   */
  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });

  const worker = new Worker(worker_path("upload"), {
    workerData: { path, format, width, output },
  });

  worker.on(
    "message",
    /**
     * When the worker finishes, render the output page
     * @param {string[]} images - Array of paths to the converted images
     * @returns {void}
     */
    (images) => {
      res.render("output.html", {
        images: images.map((file) => `/dist/${file}`),
      });
    },
  );

  worker.on("error", (err) => {
    res.status(500).send(`Conversion error: ${err.message}`);
  });

  worker.on("exit", (code) => {
    unlinkSync(path);
    log(`Worker stopped with exit code ${code}`, "error");
  });
});

app.get("/download-zip", (_, res) => {
  const worker = new Worker(worker_path("download"), {
    workerData: { output: "/tmp/dist", path: "/tmp/dist.zip" },
  });

  worker.on(
    "message",
    /**
     * When the worker finishes, download the zip file
     * and delete it afterwards
     * @param {string} path - Path to the zip file
     * @returns {void}
     */
    (path) => {
      res.download(path, "images.zip", (err) => {
        if (err) {
          log("Error downloading zip file:", err);
        } else {
          unlinkSync(path);
        }
      });
    },
  );

  worker.on("error", (err) => {
    res.status(500).send({ error: `Error creating zip file: ${err.message}` });
  });
});

/**
 * Start the server
 */
app.listen(3000, () => {
  log("Server running on http://localhost:3000");
});
