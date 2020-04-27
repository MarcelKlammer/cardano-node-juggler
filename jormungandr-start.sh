#!/bin/sh

ulimit -n 64000 64000
echo $(ulimit -n)" processes possible."

./jormungandr $1 &
