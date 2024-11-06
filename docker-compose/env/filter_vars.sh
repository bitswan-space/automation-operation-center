#!/bin/bash

# Check for the correct number of arguments
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <env file> <vars file> <output file>"
    exit 1
fi

env_file="$1"
vars_file="$2"
out_file="$3"

# Create/clear the output file
> "$out_file"

# Iterate over each variable in the vars file
while IFS= read -r var; do
    # Search for the variable in the env file and append to the output file
    grep "^$var=" "$env_file" >> "$out_file"
done < "$vars_file"
