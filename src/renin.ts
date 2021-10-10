import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";

export interface ReninNode {
  id: string;
  update?: () => void;
  render?: (renderer: WebGLRenderer) => void;
}

export const nodeRegistry: { [key: string]: ReninNode } = {};

class Renin {
  audioBar: Mesh<BoxGeometry, MeshBasicMaterial>;
  register(node: ReninNode) {
    nodeRegistry[node.id] = node;
  }
  renderer = new WebGLRenderer();
  demoRenderTarget = new WebGLRenderTarget(640, 360);
  screen = new Mesh(
    new BoxGeometry(),
    new MeshBasicMaterial({ color: "white" })
  );
  nodes: Node[] = [];
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1);
  id: number;

  constructor() {
    this.id = Math.random();
    const body = document.getElementsByTagName("body")[0];
    body.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.position = "fixed";
    this.renderer.domElement.style.top = "0px";
    this.renderer.domElement.style.left = "0px";
    this.renderer.domElement.style.right = "0px";
    this.renderer.domElement.style.bottom = "0px";
    this.scene.add(this.screen);
    this.scene.add(this.camera);
    this.screen.scale.x = 640;
    this.screen.scale.y = 360;

    this.audioBar = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    this.scene.add(this.audioBar);

    this.camera.position.z = 10;
    this.resize(window.innerWidth, window.innerHeight);

    document.addEventListener("resize", () => {
      this.resize(window.innerWidth, window.innerHeight);
    });
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height);
    this.camera.left = -width / 2;

    this.camera.right = width / 2;
    this.camera.top = width / 2;
    this.camera.bottom = -width / 2;
    this.camera.updateProjectionMatrix();
  }

  loop = () => {
    console.log("loop for", this.id);
    requestAnimationFrame(this.loop);
    this.update();
    this.render();
  };

  update() {
    for (const node of Object.values(nodeRegistry)) {
      node.update?.();
    }
  }

  render() {
    for (const node of Object.values(nodeRegistry)) {
      node.render?.(this.renderer);
    }
    if (nodeRegistry.spinningcube) {
      //@ts-expect-error
      const texture = nodeRegistry.spinningcube.renderTarget.texture;
      this.screen.material.map = texture;
      this.screen.material.needsUpdate = true;
    }
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }
}

export const renin = new Renin();
