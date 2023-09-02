import { createControlComponent } from "@react-leaflet/core";
import { Control, ControlPosition } from "leaflet";
import "leaflet.locatecontrol";
import "leaflet.locatecontrol/src/L.Control.Locate.scss";

interface LocateOptions extends Control.LocateOptions {
  position?: ControlPosition | undefined;
}

export default createControlComponent<Control.Locate, LocateOptions>(
  function createLocateControl(props) {
    return new Control.Locate(props);
  },
);
