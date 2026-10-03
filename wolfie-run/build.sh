#!/bin/sh
# Wraps index.html (written as a page fragment) in a full HTML document for static hosting.
# Cloudflare Pages: build command "sh wolfie-run/build.sh", output directory "wolfie-run/dist".
set -e
cd "$(dirname "$0")"
mkdir -p dist
{
  printf '<!doctype html>\n<html lang="en-GB">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<meta name="description" content="Wolfie Run: an unofficial rugby league endless runner. Tap or press Space to jump.">\n'
  printf '<meta name="theme-color" content="#0a1328">\n'
  printf '<meta property="og:title" content="Wolfie Run">\n'
  printf '<meta property="og:description" content="Hurdle tackle bags, dodge defenders and score tries in an unofficial rugby league endless runner. How far can you get?">\n'
  printf '<meta property="og:url" content="https://wolfie.jamieclarke.online">\n'
  printf '<meta property="og:type" content="website">\n'
  printf '<meta name="author" content="Jamie Clarke">\n'
  printf '<link rel="icon" href="data:image/svg+xml,%%3Csvg xmlns=%%27http://www.w3.org/2000/svg%%27 viewBox=%%270 0 64 64%%27%%3E%%3Crect width=%%2764%%27 height=%%2764%%27 rx=%%2712%%27 fill=%%27%%231d4ea3%%27/%%3E%%3Cpath d=%%27M14 18l18 18 18-18%%27 stroke=%%27%%23f2df6b%%27 stroke-width=%%278%%27 fill=%%27none%%27/%%3E%%3C/svg%%3E">\n'
  printf '<!-- Fathom - beautiful, simple website analytics -->\n'
  printf '<script src="https://cdn.usefathom.com/script.js" data-site="MZDNVPSG" defer></script>\n'
  printf '<!-- / Fathom -->\n'
  printf '<style>body{margin:0}</style>\n</head>\n<body>\n'
  cat index.html
  printf '\n</body>\n</html>\n'
} > dist/index.html
echo "Built $(pwd)/dist/index.html"
