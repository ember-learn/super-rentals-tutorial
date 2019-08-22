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

# Guides

git clone guides-source:ember-learn/guides-source --depth 1 -b super-rentals-tutorial
pushd guides-source
mkdir -p guides/release/tutorial/
rm -rf guides/release/tutorial/*
cp -r ../../dist/chapters/* guides/release/tutorial/
git add guides/release/tutorial
cp -r ../../dist/assets/* public/
git add public
cat <<COMMIT | git commit --allow-empty -F -
Built from ember-learn/super-rentals-tutorial@$TRAVIS_COMMIT

$TRAVIS_COMMIT_MESSAGE
COMMIT
git push
popd

# Code (with history)

pushd ../dist/code/super-rentals
git clean -dfx
cat <<COMMIT | git commit --allow-empty -F -
Built from ember-learn/super-rentals-tutorial@$TRAVIS_COMMIT

$TRAVIS_COMMIT_MESSAGE
COMMIT
git remote add super-rentals super-rentals:ember-learn/super-rentals
git push -f super-rentals master:super-rentals-tutorial-output
popd

# Code (without history)

git clone super-rentals:ember-learn/super-rentals --depth 1 -b super-rentals-tutorial
pushd super-rentals
git rm -rf '*'
cat <<COMMIT | git commit --allow-empty -F -
Built from ember-learn/super-rentals-tutorial@$TRAVIS_COMMIT

$TRAVIS_COMMIT_MESSAGE
COMMIT
git remote add dist ../../dist/code/super-rentals
git fetch dist
git merge --squash --no-commit --allow-unrelated-histories dist/master
git commit --allow-empty --amend --no-edit
git push
popd

# Cleanup

popd

rm -rf tmp
rm -rf ~/.ssh/deploy-keys
