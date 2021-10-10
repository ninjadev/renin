import { renin } from "./renin";
import { SpinningCube } from "./SpinningCube";
import "./style.css";

renin.loop();

renin.register(new SpinningCube());
