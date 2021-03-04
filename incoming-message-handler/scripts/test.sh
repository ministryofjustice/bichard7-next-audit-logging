#!/bin/bash

set -e

STYLE=$1
PARAMS=()

case $STYLE in

  "unit")
    echo "Running unit tests..."
    PARAMS+=(--watchAll --testPathIgnorePatterns=integration)
    ;;

  "integration")
    echo "Running integration tests..."
    PARAMS+=(--watchAll --testPathPattern=integration)
    ;;

  "ci")
    echo "Running CI tests..."
    JEST_JUNIT_OUTPUT_DIR=./test-results/jest
    PARAMS+=(--coverage --ci --watchAll false --runInBand --reporters=default --reporters=jest-junit --testPathIgnorePatterns=integration)
    ;;
esac

jest "${PARAMS[@]}" --testPathPattern=$TEST_PATH_PATTERN
