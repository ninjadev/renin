<h1 align="center">r e n i n</h1>

<p align=center> <a href="#getting-started">Getting started</a> • <a href="#project-status">Project status</a></p>


> <sup>DISCLAIMER: This is a tool created for internal use by Ninjadev, and is open sourced to share ideas with and get
> feedback from the community. You are free to use it, according to the License, but we will not necessarily provide
> support and may at any time add, change or remove features as we require for our productions.</sup>

<pre align="center">
<img src="screenshot.png" />
</pre>

<br/><br/>

<p align="center">
Renin is a browser-based demo creation library and tool built on top of <a href="https://github.com/mrdoob/three.js/">Three.js</a> and <a href="https://vitejs.dev">Vite</a>.<br/>It is the successor to <a href="https://github.com/ninjadev/nin">nin</a>, Ninjadev's old demo tool.
</p>

<br/>

## Getting started

```shell
npx renin init mydemo
cd mydemo
yarn install
yarn run dev
```

Now visit localhost:3000 in Chrome to start renin. Try modifing the source in mydemo/src/ to get started. Happy hacking!

### First time setup for demo in new repo

If you are making or running a renin-demo from a separate repository, you will need to place your demo project/repo folder adjacent to the renin repo directory.

<details>
<summary>Folder/repo structure illustration</summary>

```
projects/
├─ renin/
|  ├─ .git/
|  ├─ renin/
|  |  ├─ node_modules/
|  |  ├─ src/
|  ├─ ...
├─ new-demo/
|  ├─ .git/
|  ├─ node_modules/
|  ├─ src/
|  ├─ ...
```
</details>
<br>

When you are setting this up for the first time, it's imortant that you restore packages for and build renin before restoring packages for your new demo.
Yarn caches somewhat agressively, and your repeated attempts to rebuild your new demo will fail untill you delte node_modules, wich basically is starting from scratch build-wise.

The setup therefore becomes

```shell
cd projects/renin/renin

yarn install
yarn build

cd projects/new-demo

yarn install
```

### Build and export demo

Once you feel that you're done, you might want to generate a version without all the tracks and debug tooling.
To achieve this, you simply need to run `yarn build` within your demo.

If you do this on a separate machine, the full path from having cloned renin and your new demo becomes like this

```shell
cd projects/renin/renin

yarn install
yarn build

cd projects/new-demo

yarn install
yarn build
```

At this point you will get a folder named "dist/" in your demo project.
It will contain an index.html file, and a directory with all needed assets.
To run it you unfortunately can't just trust the content you made yourself locally on your machine and open it in a browser directly.
You'll have to spin it up in a server and access it through localhost.
The snippet below should work reasonably well cross plattform and enable you to enjoy your work at http://localhost:3000.

```shell
cd projects/new-demo/dist
python3 -m http.server 3000
```

## Build renin 🔨🔧

```shell
cd renin
yarn build
```

On Windows, you might have to manually run the commands defined in `"build"` in package.json instead.

<br/>

## Project status

Renin is quite new and pretty rough around the edges.
Currently, basic editing, live-reloading and jogging is implemented.
Compilation/export is sort of implemented, but could use some more polish.
As such, it should be able to make a demo with this already :tada:

Rendering to video has not been implemented yet.


<br/>

## Keyboard shortcuts

| Key      | Description                                                                                                       |
|----------|-------------------------------------------------------------------------------------------------------------------|
| R (hold) | Experimental: Record a video snippet while playing. After you release the button, a .webm file will be downloaded |
| S        | Copy current step number to clipboard                                                                             |
| F        | Copy current frame number to clipboard                                                                            |
| M        | Mute/unmute music                                                                                                 |
| O        | Enabled/disable thirds overlay                                                                                    |
| Enter    | Toggle fullscreen                                                                                                 |
| Space    | Play/pause                                                                                                        |
| V        | Toggle repeat of current beat                                                                                     |
| B        | Toggle repeat of current bar                                                                                      |
| N        | Toggle repeat of current 4 bars                                                                                   |
| G        | Set cue point for loop. The first time you press it, it sets the "go back here point". Second time sets "go back
             once you reach this point". Third time removes the points.                                                        |
| shift+J  | Go back one frame                                                                                                 |
| shift+K  | Go forward one frame                                                                                              |
| shift+H  | Go to start                                                                                                       |
| L        | Go forward 4 beats                                                                                                |
| J        | Go back one beat                                                                                                  |
| K        | Go forward one beat                                                                                               |
| H        | Go back 4 beats                                                                                                   |
| 6        | Set playback rate to 0.25                                                                                         |
| 7        | Set playback rate to 0.5                                                                                          |
| 8        | Set playback rate to 2                                                                                            |
| 9        | Set playback rate to 4                                                                                            |
| 0        | Set playback rate to 1                                                                                            |

# Debugging renin

Typically, to debug renin, you need a demo using renin to mess around with.
Make sure that the demo referenes your local renin repo and files and not the published packages, or you will grow frustrated that none of you changes seem to take effect.
To use the repo, in your demos `package.json` file, in the `dependencises` section, make sure the `renin` entry refers to `file:./../renin/renin`.

See this example :

```json
{
  "...": "...",
  "dependencies": {
    "...": "...",
    "@types/three": "*",
    "renin": "file:./../renin/renin",
    "seedrandom": "^3.0.5",
    "three": "*",
    "...": "...",
  },
  "...": "...",
}
```
# Known renin demos

- [Ninjadev - The Tale of the Bluebird & the Dragon](https://www.pouet.net/prod.php?which=91820)
- [Ninjadev - Crank You Very Much](https://www.pouet.net/prod.php?which=94165)
- [Sigveseb / Ninjadev - FILL_ER](https://www.pouet.net/prod.php?which=94133)
- [NDV (닌자데브) 'We are back - JP Ver.-' Official MV](https://www.pouet.net/prod.php?which=94648)

<br/>

## How is renin different compared to nin?

- The entire UI is WebGL (threejs).
- No graph.json -- instead, the graph is implicitly defined in the code directly in the node relationships.
- New experimental visualization of nodes as layers.
- Typescript and modern tooling/imports/etc which makes the coding experience much nicer.
- It uses vite "as a backend" instead of the node backend + html frontend architecture of nin.
