import { join } from "path";

/**
 * Get the path to a worker file
 * @param {string} name - Name of the worker file (without the .js extension)
 * @returns {string} - Path to the worker file
 */
function worker_path(name) {
  return join(process.cwd(), "src", "workers", `${name}.js`);
}

/**
 * Log a message to the console
 * @param {string} message - Message to log
 * @param {string} type - Type of the message (info, warning, error)
 * @returns {void}
 */
function log(message, type = "info") {
  const typeCheck = ["info", "warning", "error"].includes(type);
  return console[typeCheck ? type : "log"](message);
}

export { log, worker_path };
