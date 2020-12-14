const core = require("@actions/core");
const fs = require("fs");
const { Toolkit } = require("actions-toolkit");

const GH_USERNAME = core.getInput("GH_USERNAME");
const COMMIT_MSG = core.getInput("COMMIT_MSG");
const MAX_LINES = core.getInput("MAX_LINES");

Toolkit.run(
  async (tools) => {
    // return tools.exit.failure(
    //   `Couldn't find the <!--START_SECTION:activity--> comment. Exiting!`
    // );

    // tools.exit.success("No changes detected");

    // Commit to the remote repository

    tools.exit.success("Init");
  },
  {
    event: ["schedule", "workflow_dispatch"],
    secrets: ["GITHUB_TOKEN"],
  }
);
