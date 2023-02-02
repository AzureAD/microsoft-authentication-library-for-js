#!/bin/bash

retries="${1:-5}"
for ((i=1; i <= retries; i++))
do
    timeout=$((i * 5000))
    echo -e "Running jest: attempt=${i}, timeout=${timeout}ms"
    jest --testTimeout=$timeout && break;
done
