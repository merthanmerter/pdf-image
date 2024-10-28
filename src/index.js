import archiver from "archiver";
import ejs from "ejs";
import express from "express";
import {
  createWriteStream,
  mkdirSync,
  readdirSync,
  rmSync,
  unlinkSync,
} from "fs";
import multer from "multer";
import { join } from "path";
import { compressImages, convertPdfToImages } from "./lib/index.js";

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

/**
 * Handle file upload
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {void}
 */
app.post("/upload", upload.single("pdf"), async (req, res) => {
  const path = req.file.path;
  const format = req.body.format;
  const width = parseInt(req.body.width);

  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });

  try {
    await convertPdfToImages(path, output, format);

    await compressImages(output, width);

    const images = readdirSync(output).map((file) => `/dist/${file}`);
    res.render("output.html", { images });
  } catch (error) {
    res.status(500).send(`Conversion error: ${error}`);
  } finally {
    unlinkSync(path);
  }
});

/**
 * Download the converted images as a ZIP file
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {void}
 */
app.get("/download-zip", (req, res) => {
  const outputPath = "/tmp/dist";
  const zipFilePath = "/tmp/dist.zip";

  const output = createWriteStream(zipFilePath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    res.download(zipFilePath, "images.zip", (err) => {
      if (err) {
        console.error("Error downloading zip file:", err);
      } else {
        unlinkSync(zipFilePath);
      }
    });
  });

  archive.on("error", (err) => {
    res.status(500).send({ error: `Error creating zip file: ${err.message}` });
  });

  archive.pipe(output);
  archive.directory(outputPath, false);
  archive.finalize();
});

/**
 * Start the server
 */
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
