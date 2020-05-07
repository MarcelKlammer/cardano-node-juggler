#!/bin/sh

ulimit -n 49152 49152

echo $(ulimit -n)" processes possible."

DIR="/Users/marcelklammer/Documents/workspaces/github/cardano-node-juggler"

echo "cd ${DIR}; ./jormungandr-start-sh.sh ${1}" > "${DIR}"/tmp.sh ; chmod +x "${DIR}"/tmp.sh ; open -a Terminal "${DIR}"/tmp.sh ;

#rm "${DIR}"/tmp.sh

#./jormungandr $1 &
