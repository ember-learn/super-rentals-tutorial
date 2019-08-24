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

if echo -n "$TRAVIS_COMMIT_MESSAGE" | head -n 1 | grep -E "^Merge pull request #"; then
  COMMIT_MESSAGE="Merge pull request $TRAVIS_REPO_SLUG#${TRAVIS_COMMIT_MESSAGE:20}"
else
  COMMIT_MESSAGE="$TRAVIS_COMMIT_MESSAGE"
fi

COMMIT_MESSAGE="$COMMIT_MESSAGE\n\nCommit: $TRAVIS_REPO_SLUG@$TRAVIS_COMMIT\n\nLogs: $TRAVIS_JOB_WEB_URL"

# Guides

git clone guides-source:ember-learn/guides-source --depth 1 -b super-rentals-tutorial
pushd guides-source
mkdir -p guides/release/tutorial/
rm -rf guides/release/tutorial/*
cp -r ../../dist/chapters/* guides/release/tutorial/
git add guides/release/tutorial
cp -r ../../dist/assets/* public/
git add public
if git diff --cached --exit-code; then
  echo "Nothing to push"
else
  git commit -m "$COMMIT_MESSAGE"
  git push
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
