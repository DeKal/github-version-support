const core = require("@actions/core");
const fs = require("fs");
const { Toolkit } = require("actions-toolkit");
const commitVersion = require("./commit");
const createNewVersion = require("./create");

const GH_USERNAME = core.getInput("GH_USERNAME");
const COMMIT_MSG = core.getInput("COMMIT_MSG");
const MAX_LINES = core.getInput("MAX_LINES");

Toolkit.run(
  async (tools) => {
    try {
      await createNewVersion();
      await commitVersion();
      tools.exit.success("Update version sucessfully.");
    } catch (err) {
      return tools.exit.failure(`Couldn't update version for this repository.`);
    }
  },
  {
    event: ["schedule", "workflow_dispatch"],
    secrets: ["GITHUB_TOKEN"],
  }
);
