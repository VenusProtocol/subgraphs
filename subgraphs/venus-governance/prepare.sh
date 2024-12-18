#!/bin/bash
# Install from root
cd ../..

git pull

YARN_ENABLE_IMMUTABLE_INSTALLS=true yarn
