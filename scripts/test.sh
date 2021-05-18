#!/bin/bash

set -e

STYLE=$1
PARAMS=()

case $STYLE in

  "unit")
    echo "Running unit tests..."
    PARAMS+=(--watchAll --testPathIgnorePatterns="integration" "e2e")
    ;;

  "integration")
    echo "Running integration tests..."
    PARAMS+=(--watchAll --testPathPattern=integration)
    ;;

  "e2e")
    echo "Running e2e tests..."
    PARAMS+=(--watchAll --testPathPattern=e2e)
    ;;

  "ci")
    echo "Running CI tests..."
    export JEST_JUNIT_OUTPUT_DIR=./test-results/jest
    PARAMS+=(--coverage --ci false --runInBand --reporters=default --reporters=jest-junit)
    ;;

    *)
    echo "Running all tests..."
    ;;
esac

jest "${PARAMS[@]}" --testPathPattern=$TEST_PATH_PATTERN --testPathIgnorePatterns="dist" "build" "cypress"
