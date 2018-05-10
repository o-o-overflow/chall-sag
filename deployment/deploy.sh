#!/bin/sh
cd ../src/
truffle migrate
mv hallofframe.js hallofframe.`date +%s`.js
# node ./sagd.js $( address of SagFactory )
