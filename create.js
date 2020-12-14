const chalk = require('chalk')
const { readJson, writeJson } = require('fs-extra')
const { exec } = require('child-process-promise')

const {
  RELEASE_SCRIPT_PATH,
  PACKAGE_PATH,
  validateVersion,
  logPromise,
  execRead,
  runYarnTask,
  parseParameters,
  handleError,
  execAndIgnoreError,
  getUsage
} = require('./utils')

const LERNA_CHANGELOG_BIN = './node_modules/.bin/lerna-changelog'

const runTests = async () => {
  await logPromise(runYarnTask('lint', 'Lint failed'), 'Running ESLint')
  await logPromise(
    runYarnTask('test', 'Jest failed', { CI: true }),
    'Running tests'
  )
}

const updatePackageVersion = async ({ version }) => {
  const rootPackage = await readJson(PACKAGE_PATH)
  rootPackage.version = version
  await writeJson(PACKAGE_PATH, rootPackage, { spaces: 2 })
}

const checkUncommittedChanges = async () => {
  const status = await execRead('git diff HEAD')

  if (status) {
    throw Error(
      chalk`
        Uncommitted local changes

        {white Please revert or commit all local changes before making a release.}
      `
    )
  }
}

const generateChangelog = async ({ GITHUB_API_KEY }) => {
  // generate from the first version
  await logPromise(
    exec(
      `GITHUB_AUTH=${GITHUB_API_KEY} ${LERNA_CHANGELOG_BIN} --tag-from v0.0.1 > ./CHANGELOG.md`,
      {
        cwd: RELEASE_SCRIPT_PATH
      }
    ),
    'Generating CHANGELOG.md'
  )
}

const tagVersion = async ({ version }) => {
  const tagName = 'v' + version
  await execAndIgnoreError(`git tag --delete ${tagName}`)
  await exec(`git tag -a ${tagName} -m ${tagName}`)

  await execAndIgnoreError(`git push --delete origin ${tagName}`)
  await logPromise(exec('git push --tags'), 'Tagging version')
}

const printSummary = ({ version }) => {
  console.warn(chalk`
      {green.bold Create the release successfully!}
      Next there are a couple of manual steps:

      {bold.underline Step 1: Review CHANGELOG.md}

      {bold.underline Step 2: Commit changes}
      node scripts/release/commit --version=${version}
    `)
}

const validateParameters = (params) => {
  if (!params.version) {
    console.warn(getUsage(params))
    process.exit(1)
  }
}

const paramDefinitions = [
  {
    name: 'version',
    type: String,
    alias: 'v',
    description: 'Semantic version number'
  }
]

const createNewVersion = async () => {
  try {
    const params = await parseParameters(paramDefinitions, validateParameters)

    await validateVersion(params)
    await checkUncommittedChanges(params)
    await runTests(params)
    await tagVersion(params)
    await updatePackageVersion(params)
    await generateChangelog(params)
    printSummary(params)
  } catch (error) {
    handleError(error)
  }
}

module.exports = createNewVersion
