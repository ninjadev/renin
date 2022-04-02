# Renin

Renin is nin 2.0.

For now, renin itself lives in src/renin, in the middle of a renin example project (i.e., a demo).
In the future, renin will probably be a separate package that you would install as a package in your demo project.

## Project status

Renin is quite new and pretty rough around the edges.
Currently, basic editing, live-reloading and jogging is implemented.
Compilation/export is not implemented yet.
As such, it should be able to make a demo with this already, but you need to implement some sort of compile/export in order to submit it to a compo.
(Or, maybe you could just deliver the demo inside renin and ask the compo organizers to run renin in fullscreen).

## Development

You need node and yarn.

To setup:

```shell
make
```

To run:

```shell
make run
```

## How is renin different compared to nin?

- The entire UI is WebGL (threejs).
- No graph.json -- instead, the graph is implicitly defined in the code directly in the node relationships.
- New experimental visualization of nodes as layers.
- Typescript and modern tooling/imports/etc which the coding experience much nicer.
- It uses vite "as a backend" instead of the node backend + html frontend architecture of nin.
