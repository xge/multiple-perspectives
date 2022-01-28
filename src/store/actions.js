import {autoType, csv, max} from "d3";
import {constants} from "@/utils/const";

function init({commit, state}) {
  const EXAMPLE = constants.folders[state.dataset][state.cameraPath];
  console.log(EXAMPLE);
  Promise.all([
    csv(`${EXAMPLE.folder}/bb2d.csv`, autoType),
    csv(`${EXAMPLE.folder}/cp2d.csv`, autoType),
    csv(`${EXAMPLE.folder}/rows.csv`, autoType)
  ]).then(data => {
    const bbox = data[0][0];
    bbox.coords = JSON.parse(bbox.coords);

    const maxPoint = max([
      ...data[1].map(c => [Math.abs(c.pos_y), Math.abs(c.view_y), Math.abs(c.pos_x), Math.abs(c.view_x)]).flat(),
      0.5 // we have to add 0.5 here, to make sure the dataset's bounding box will fit
    ]);
    const domain = [-maxPoint, maxPoint]; // square domains for both axis

    commit("setPathDomain", domain);
    commit("setBbox", bbox);
    commit("setCp", data[1]);

    const rows = data[2];
    rows.sort((a, b) => a.camera_step - b.camera_step);
    rows.forEach((r, i) => (r.id = i));
    commit("setRaw", rows);
    commit("setCameraPaths", [...new Set(rows.map(r => r.camera_path))]);
    commit("setDatasets", [...new Set(rows.map(r => r.dataset))]);
    commit("setDevices", [...new Set(rows.map(r => r.device))]);
    commit("setViewports", [...new Set(rows.map(r => r.viewport))]);

    commit("setTechniques", EXAMPLE.ae === constants.OSPRAY ? state.techniquesOspray : state.techniquesTrrojan);
    commit("setTechniqueX", state.techniques[0]);
    commit("setTechniqueY", state.techniques[1]);
    commit("setTechniqueExtent", [0, max(rows.map(r => max(state.techniques.map(t => r[t]))))]);

    // finish initialization
    commit("setInitialized", true);
  });
}

export const actions = {
  init
};
