# Renin

Renin is the successor to [nin](https://github.com/ninjadev/nin), Ninjadev's old demo tool.

Renin is a browser-based demo creation library and tool built on top of [Three.js](https://github.com/mrdoob/three.js/) and [Vite](https://vite.dev).

To use Renin, you need to set up a Vite project that uses renin as a dependency.
There is an example project in this repo that shows how it can be set up.
In the future, there will probably be some sort of `npx create-renin-app` or something available.

## Project status

Renin is quite new and pretty rough around the edges.
Currently, basic editing, live-reloading and jogging is implemented.
Compilation/export is sort of implemented, but could use some more polish.
As such, it should be able to make a demo with this already :tada:

Rendering to video has not been implemented yet.

## How is renin different compared to nin?

- The entire UI is WebGL (threejs).
- No graph.json -- instead, the graph is implicitly defined in the code directly in the node relationships.
- New experimental visualization of nodes as layers.
- Typescript and modern tooling/imports/etc which makes the coding experience much nicer.
- It uses vite "as a backend" instead of the node backend + html frontend architecture of nin.
