#!/bin/sh

ulimit -n 49152 49152

echo $(ulimit -n)" processes possible."

echo "${0}"
echo "${1} ${2}"
echo "${3} ${4}"
echo "${5} ${6}"

cd /Users/marcelklammer/Documents/workspaces/github/cardano-node-juggler/

./jormungandr $1 $2 $3 $4 $5 $6
