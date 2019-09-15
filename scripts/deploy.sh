#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# Setup SSH keys

mkdir -p ~/.ssh
chmod 700 ~/.ssh

tar -xvzf deploy-keys.tar.gz -C ~/.ssh
chmod 700 ~/.ssh/deploy-keys
chmod 400 ~/.ssh/deploy-keys/*

touch ~/.ssh/config
chmod 600 ~/.ssh/config
cat <<CONFIG >> ~/.ssh/config
Host guides-source
  HostName github.com
  User git
  IdentityFile ~/.ssh/deploy-keys/guides-source
Host super-rentals
  HostName github.com
  User git
  IdentityFile ~/.ssh/deploy-keys/super-rentals
CONFIG

# Setup tmpdir

mkdir -p tmp
pushd tmp

# Setup commit message

if [[ "$TRAVIS_EVENT_TYPE" == "cron" ]]; then
  COMMIT_TITLE="[CRON] $(date +"%A %b %d, %Y")"
else
  COMMIT_TITLE="$(
    echo -n "$TRAVIS_COMMIT_MESSAGE" | \
    sed -E "s|^Merge pull request #(.+) from .+$|Merge $TRAVIS_REPO_SLUG#\1|"
  )"
fi

COMMIT_MESSAGE="$COMMIT_TITLE

---

Commit:  $TRAVIS_REPO_SLUG@$TRAVIS_COMMIT
Script:  https://github.com/$TRAVIS_REPO_SLUG/blob/$TRAVIS_COMMIT/$0
Logs:    $TRAVIS_JOB_WEB_URL"

# Guides

if git clone guides-source:ember-learn/guides-source --depth 1 -b super-rentals-tutorial; then
  pushd guides-source
else
  git clone guides-source:ember-learn/guides-source --depth 1 -b octane
  pushd guides-source
  git checkout -b super-rentals-tutorial
fi
mkdir -p guides/release/tutorial/
rm -rf guides/release/tutorial/*
cp -r ../../dist/chapters/* guides/release/tutorial/
git add guides/release/tutorial
rm -rf public/downloads/*
cp -r ../../dist/assets/downloads/* public/downloads/
pushd public/downloads/data/
zip -r current.zip .
popd
if ! (git checkout -- public/downloads/data.zip 2>&1 && zipcmp public/downloads/data.zip public/downloads/data/current.zip); then
  mv public/downloads/data/current.zip public/downloads/data.zip
  advzip -z -q -4 public/downloads/data.zip
fi
rm -rf public/downloads/data
rm -rf public/screenshots
find ../../dist/assets/screenshots -type f -name "*.png" | xargs -n 1 ../../scripts/optimize-screenshot.sh
git add public
if git diff --cached --exit-code; then
  echo "Nothing to push"
else
  git commit -m "$COMMIT_MESSAGE"
  git push -u origin super-rentals-tutorial
fi
popd

# Code (with history)

pushd ../dist/code/super-rentals
git clean -dfx
git commit --allow-empty -m "$COMMIT_MESSAGE"
git remote add super-rentals super-rentals:ember-learn/super-rentals
git push -f super-rentals master:super-rentals-tutorial-output
popd

# Code (without history)

git clone super-rentals:ember-learn/super-rentals --depth 1 -b super-rentals-tutorial
pushd super-rentals
git rm -rf '*'
git commit --allow-empty -m "$COMMIT_MESSAGE"
git remote add dist ../../dist/code/super-rentals
git fetch dist
git merge --squash --no-commit --allow-unrelated-histories dist/master
git commit --allow-empty --amend --no-edit
if git diff --exit-code origin/super-rentals-tutorial; then
  echo "Nothing to push"
else
  git push
fi
popd

# Cleanup

popd

rm -rf tmp
rm -rf ~/.ssh/deploy-keys
