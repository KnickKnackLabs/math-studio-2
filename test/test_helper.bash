#!/usr/bin/env bash
# Shared fixtures for mim task-boundary tests.

mim() {
  cd "$REPO_DIR" && mise run -q "$@"
}
export -f mim
