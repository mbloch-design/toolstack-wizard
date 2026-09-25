#!/bin/bash
# Vercel "Ignored Build Step" (vercel.json ignoreCommand).
# Exit 0 = skip the build, exit 1 = build.
#
# A push that only touches research/ or docs/ (cloud research sessions,
# to-do updates) changes nothing on the site, so it is skipped. Anything
# else builds. When the comparison cannot be made (shallow clone without the
# previous deployed commit), we build rather than fail: the first version of
# this rule ran `git diff` directly, and a missing commit made Vercel report
# an Error on every research push.

base="${VERCEL_GIT_PREVIOUS_SHA:-}"

has_commit() { git cat-file -e "$1^{commit}" 2>/dev/null; }

if [ -n "$base" ] && ! has_commit "$base"; then
  git fetch --quiet --depth=100 origin "${VERCEL_GIT_COMMIT_REF:-main}" 2>/dev/null || true
fi
# No reliable base: comparing with HEAD^ alone could skip a site change
# pushed earlier in the same push, so build instead.
if [ -z "$base" ] || ! has_commit "$base"; then
  echo "Previous deployed commit not available: building."
  exit 1
fi

git diff --quiet "$base" HEAD -- . ':(exclude)research' ':(exclude)docs'
status=$?
if [ "$status" -eq 0 ]; then
  echo "Only research/ or docs/ changed since $base: skipping the build."
  exit 0
fi
echo "Site files changed since $base (or diff failed with $status): building."
exit 1
