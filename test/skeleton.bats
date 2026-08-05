#!/usr/bin/env bats

load test_helper

@test "mim repository surfaces exist" {
  for path in \
    AGENTS.md \
    README.tsx \
    README.md \
    CONTRIBUTING.md \
    package.json \
    vite.config.ts \
    src/App.svelte \
    .mise/tasks/test \
    .mise/tasks/mim/build \
    .github/workflows/test.yml
  do
    [ -e "$REPO_DIR/$path" ]
  done
}

@test "README.md is generated from README.tsx" {
  run bash -c 'cd "$REPO_DIR" && readme build --check'
  [ "$status" -eq 0 ]
}

@test "doctor reports optional pre-commit hook state" {
  run mim doctor
  [ "$status" -eq 0 ]
  [[ "$output" == *"pre-commit"* ]]
}

@test "public tasks provide examples through their real help" {
  while IFS= read -r task_file; do
    relative_path="${task_file#"$REPO_DIR/.mise/tasks/"}"
    task_name="${relative_path%/_default}"
    task_name="${task_name//\//:}"

    run mim "$task_name" --help
    [ "$status" -eq 0 ]
    [[ "$output" == *"Examples:"* ]]
  done < <(find "$REPO_DIR/.mise/tasks" -type f -print | sort)
}

@test "standalone build task reaches the package build command" {
  mock_dir="$BATS_TEST_TMPDIR/mock-bin"
  log="$BATS_TEST_TMPDIR/bun.log"
  mkdir -p "$mock_dir"
  cat > "$mock_dir/bun" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "$*" > "$BUN_LOG"
SH
  chmod +x "$mock_dir/bun"
  export BUN_LOG="$log"
  export PATH="$mock_dir:$PATH"

  run mim mim:build
  [ "$status" -eq 0 ]
  [ "$(cat "$log")" = "run build" ]
}
