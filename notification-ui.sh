#!/bin/sh

F=$(readlink -f $(which notification-ui))
D=$(dirname "${F}")

for s in "html/index.html" \
         "../notification-ui/html/index.html" \
         "../share/notification-ui/html/index.html"; do
  P="${D}/${s}"

  if [ -e "${P}" ]; then
    exec "$F" "file://${P}" "$@"
  fi
done

exit 1
