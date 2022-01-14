#!/bin/bash

packages=$(find . -name package-lock.json | grep -v node_modules)

md5="md5"
if ! command -v $md5 &> /dev/null
then
    md5="md5sum"
fi

for p in ${packages}; do
  echo "Hashing package lock for $p"
  $md5 $p > $p.md5
done
