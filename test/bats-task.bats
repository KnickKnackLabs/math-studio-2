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

@test "bats task defaults to four Rush jobs" {
  run mim bats skeleton --filter doctor
  [ "$status" -eq 0 ]
  [[ "$output" == *"4 jobs via"* ]]
  grep -Fx "jobs=4" "$BATS_LOG"
  grep -Fx "runner=$MOCK_DIR/rush" "$BATS_LOG"
  grep -Fx "arg=$REPO_DIR/test/skeleton.bats" "$BATS_LOG"
}

@test "bats task supports serial debugging" {
  export RUSH_COMMAND="$MOCK_DIR/missing-rush"
  run mim bats --jobs 1 skeleton
  [ "$status" -eq 0 ]
  [[ "$output" == *"BATS parallelism: serial"* ]]
}

@test "invalid parallelism fails before BATS" {
  export BATS_NUMBER_OF_PARALLEL_JOBS=lots
  run mim bats skeleton
  [ "$status" -eq 2 ]
  [[ "$output" == *"must be a positive integer"* ]]
  [ ! -e "$BATS_LOG" ]
}

@test "missing parallel runner fails clearly" {
  export RUSH_COMMAND="$MOCK_DIR/missing-rush"
  run -127 mim bats skeleton
  [ "$status" -eq 127 ]
  [[ "$output" == *"parallel runner"* ]]
}
