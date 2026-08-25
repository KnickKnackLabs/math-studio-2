#!/usr/bin/env bats

load test_helper
bats_require_minimum_version 1.5.0

setup() {
  MOCK_DIR="$BATS_TEST_TMPDIR/mock-bin"
  BATS_LOG="$BATS_TEST_TMPDIR/bats.log"
  mkdir -p "$MOCK_DIR"
  export BATS_LOG

  cat > "$MOCK_DIR/bats" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
{
  printf 'jobs=%s\n' "${BATS_NUMBER_OF_PARALLEL_JOBS:-}"
  printf 'runner=%s\n' "${BATS_PARALLEL_BINARY_NAME:-}"
  for argument in "$@"; do printf 'arg=%s\n' "$argument"; done
} > "$BATS_LOG"
SH
  printf '#!/usr/bin/env bash\nexit 0\n' > "$MOCK_DIR/rush"
  chmod +x "$MOCK_DIR/bats" "$MOCK_DIR/rush"

  export BATS_COMMAND="$MOCK_DIR/bats"
  export RUSH_COMMAND="$MOCK_DIR/rush"
  unset BATS_NUMBER_OF_PARALLEL_JOBS BATS_PARALLEL_BINARY_NAME
}

@test "test task defaults to four Rush jobs" {
  run mim test skeleton --filter doctor
  [ "$status" -eq 0 ]
  [[ "$output" == *"4 jobs via"* ]]
  grep -Fx "jobs=4" "$BATS_LOG"
  grep -Fx "runner=$MOCK_DIR/rush" "$BATS_LOG"
  grep -Fx "arg=$REPO_DIR/test/skeleton.bats" "$BATS_LOG"
  ! grep -Fx "arg=--no-parallelize-within-files" "$BATS_LOG"
}

@test "test task supports serial debugging" {
  export RUSH_COMMAND="$MOCK_DIR/missing-rush"
  run mim test --jobs 1 skeleton
  [ "$status" -eq 0 ]
  [[ "$output" == *"BATS parallelism: serial"* ]]
}

@test "invalid parallelism fails before BATS" {
  export BATS_NUMBER_OF_PARALLEL_JOBS=lots
  run mim test skeleton
  [ "$status" -eq 2 ]
  [[ "$output" == *"must be a positive integer"* ]]
  [ ! -e "$BATS_LOG" ]
}

@test "missing parallel runner fails clearly" {
  export RUSH_COMMAND="$MOCK_DIR/missing-rush"
  run -127 mim test skeleton
  [ "$status" -eq 127 ]
  [[ "$output" == *"parallel runner"* ]]
}

@test "public test path runs tests within one BATS file concurrently" {
  probe_dir="$BATS_TEST_TMPDIR/within-file-probe"
  export PROBE_DIR="$BATS_TEST_TMPDIR/within-file-barrier"
  mkdir -p "$probe_dir" "$PROBE_DIR"

  test_keyword='@test'
  {
    printf '%s\n' '#!/usr/bin/env bats'
    printf '%s\n' "$test_keyword \"first test observes second test\" {"
    cat <<'BATS'
  touch "$PROBE_DIR/one"
  for _ in {1..50}; do
    [ ! -e "$PROBE_DIR/two" ] || return 0
    sleep 0.05
  done
  false
}
BATS
    printf '%s\n' "$test_keyword \"second test observes first test\" {"
    cat <<'BATS'
  touch "$PROBE_DIR/two"
  for _ in {1..50}; do
    [ ! -e "$PROBE_DIR/one" ] || return 0
    sleep 0.05
  done
  false
}
BATS
  } > "$probe_dir/within-file.bats"

  unset BATS_COMMAND RUSH_COMMAND
  unset BATS_NUMBER_OF_PARALLEL_JOBS BATS_PARALLEL_BINARY_NAME
  run mim test "$probe_dir"

  [ "$status" -eq 0 ]
  [[ "$output" == *"jobs via"* ]]
}
