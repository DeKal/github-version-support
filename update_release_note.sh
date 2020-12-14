#!/bin/bash

create_release() {
  local GITHUB_TOKEN=$1
  local RELEASE_VERSION=$2
  local CHANGELOG=$3
  POST_DATA=$(cat <<EOF
{
  "tag_name": "$RELEASE_VERSION",
  "target_commitish": "master",
  "name": "$RELEASE_VERSION",
  "body": "$CHANGELOG",
  "draft": false,
  "prerelease": false
}
EOF
)

  curl 2>/dev/null --data "$POST_DATA" -X POST "https://api.github.com/repos/BootCareer/job-seeker-dashboard/releases?access_token=$GITHUB_TOKEN" | jq
}

get_previous_release() {
  git tag -l | tail -n2 | head -n1
}

get_active_release() {
  git tag -l | tail -n1
}

eval $(cat $(dirname "$0")/.env)

RELEASE_VERSION=$(get_active_release)
PREVIOUS_RELEASE=$(get_previous_release)

echo "Getting PRs from $PREVIOUS_RELEASE to $RELEASE_VERSION"
PRS=$(git log $PREVIOUS_RELEASE...$RELEASE_VERSION --merges --pretty=format:'{ <>pr<>: <>%s<>, <>name<>: <>%b<>}' | sed 's/"/\\"/g' | sed 's/<>/"/g' | sed -E 's/"Merge pull request #([0-9]+)[^"]*"/"\1"/g')
PRS_IN_MARKDOWN=$(echo $PRS | jq -s '.[] | "- #" + .pr + " " + .name' | jq -s '. | join("\\n")' | jq -r)

echo -e "$PRS_IN_MARKDOWN"

echo "Updating release note"
CHANGELOG="#### Pull requests\n$PRS_IN_MARKDOWN"
create_release $GITHUB_API_KEY $RELEASE_VERSION "$CHANGELOG"

echo "Done"
