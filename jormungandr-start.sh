#!/bin/sh

ulimit -n 122880 122880
echo $(ulimit -n)" processes possible."

./jormungandr $1 &
