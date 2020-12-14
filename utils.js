const chalk = require("chalk");
const { dots } = require("cli-spinners");
const logUpdate = require("log-update");
const { exec } = require("child-process-promise");
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");
const figlet = require("figlet");
const semver = require("semver");
const { readJson } = require("fs-extra");
const path = require("path");

const RELEASE_SCRIPT_PATH = __dirname;
const PACKAGE_PATH = "package.json";

const execRead = async (command, options = { cwd: "." }) => {
  const { stdout } = await exec(command, options);

  return stdout.trim();
};

const logPromise = async (promise, text, completedLabel = "") => {
  const { frames, interval } = dots;

  let index = 0;
  let intervalId;

  if (!process.env.CI) {
    intervalId = setInterval(() => {
      index = ++index % frames.length;
      logUpdate(
        `${chalk.yellow(frames[index])} ${text} ${chalk.gray(
          "- this may take a few seconds"
        )}`
      );
    }, interval);
  }

  try {
    const returnValue = await promise;

    clearInterval(intervalId);

    logUpdate(`${chalk.green("✓")} ${text} ${chalk.gray(completedLabel)}`);
    logUpdate.done();

    return returnValue;
  } catch (error) {
    console.warn(error.stdout || error);
    throw error;
  }
};

const toEnv = (envVars) =>
  Object.keys(envVars)
    // filter invalid keys
    .filter((key) => envVars[key])
    .map((key) => `${key}="${envVars[key]}"`)
    .join(" ");

const getUsage = (paramDefinitions) =>
  commandLineUsage([
    {
      content: chalk.green.bold(figlet.textSync("Lite", { font: "Graffiti" })),
      raw: true,
    },
    {
      content: "Automated release script.",
    },
    {
      header: "Options",
      optionList: paramDefinitions,
    },
    {
      header: "Examples",
      content: [
        {
          desc: "1. A concise example.",
          example:
            "$ node scripts/release/yourScript [bold]{-v} [underline]{0.0.1}",
        },
      ],
    },
  ]);

const parseParameters = async (
  paramDefinitions = [],
  validateParameters = () => {}
) => {
  const cmdParams = commandLineArgs(paramDefinitions);

  validateParameters(cmdParams);

  const secretParams = loadSecretParams(cmdParams.env);

  return {
    ...cmdParams,
    ...secretParams,
  };
};

const runYarnTask = async (task, errorMessage, envVars = {}) => {
  const rootDir = path.resolve(__dirname, "../..");
  try {
    await exec(`${toEnv(envVars)} yarn run ${task}`, { cwd: rootDir });
  } catch (error) {
    throw Error(
      chalk`
      ${errorMessage}

      {white ${error.stdout || error}}
    `
    );
  }
};

const specialVersions = ["master"];

const validateVersion = async ({ version }) => {
  if (specialVersions.includes(version)) {
    return true;
  }

  if (!semver.valid(version)) {
    throw Error("Invalid version specified");
  }

  const rootPackage = await readJson(PACKAGE_PATH);

  if (!semver.gte(version, rootPackage.version)) {
    throw Error(
      chalk`Version {white ${rootPackage.version}} was already published`
    );
  }

  return true;
};

const handleError = (error) => {
  logUpdate.clear();
  const message = error.message.trim().replace(/\n +/g, "\n");
  const stack = error.stack.replace(error.message, "");

  console.warn(
    `${chalk.bgRed.white(" ERROR ")} ${chalk.red(message)}\n\n${chalk.gray(
      stack
    )}`
  );

  process.exit(1);
};

const execAndIgnoreError = async (command, options) => {
  try {
    return await exec(command, options);
  } catch (error) {
    console.warn(error.message);
  }
};

const loadSecretParams = (env) => {
  const baseFile = __dirname + "/.env";
  const dotenvFiles = [`${baseFile}.${env}`, baseFile];
  dotenvFiles.forEach((path) => {
    require("dotenv-expand")(
      require("dotenv").config({
        path,
      })
    );
  });

  const { GITHUB_API_KEY, NETLIFY_SITE_ID, NETLIFY_AUTH_TOKEN } = process.env;
  return {
    GITHUB_API_KEY,
    NETLIFY_SITE_ID,
    NETLIFY_AUTH_TOKEN,
  };
};

module.exports = {
  RELEASE_SCRIPT_PATH,
  PACKAGE_PATH,
  logPromise,
  execRead,
  toEnv,
  parseParameters,
  runYarnTask,
  validateVersion,
  handleError,
  execAndIgnoreError,
  loadSecretParams,
  getUsage,
};
