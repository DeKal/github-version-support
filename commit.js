const { exec } = require('child-process-promise')

const {
  logPromise,
  parseParameters,
  validateVersion,
  handleError,
  RELEASE_SCRIPT_PATH,
} = require('./utils')

const commit = async ({ version }) => {
  await exec('git add package.json')
  await exec(`git commit -m "Releasing v${version}"`)
  await exec('git add CHANGELOG.md')
  await exec(`git commit -m "Updating CHANGELOG.md for v${version} release"`)
  await logPromise(exec('git push'), 'Commiting to GitHub')
  await logPromise(exec(`${RELEASE_SCRIPT_PATH}/update_release_note.sh`), 'Update release note')
}

const COMMIT_PARAMETERS = [
  {
    name: 'version',
    type: String,
    alias: 'v',
    description: 'Semantic version number'
  }
]

const run = async () => {
  try {
    const params = await parseParameters(COMMIT_PARAMETERS)
    await validateVersion(params)
    await commit(params)
  } catch (error) {
    handleError(error)
  }
}

run()
