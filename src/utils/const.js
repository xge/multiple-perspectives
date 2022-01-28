const OSPRAY = "ospray";
const TRROJAN = "trrojan";

const folders = {
  "vdb-volume": {
    "spiral-zoom": {
      ae: OSPRAY,
      folder: "ospray-dense"
    },
    "orbit-y": {
      ae: OSPRAY,
      folder: "ospray-volume"
    }
  },
  streamlines: {
    spiral: {
      ae: OSPRAY,
      folder: "ospray-streamlines-spiral"
    },
    "spiral-zoom": {
      ae: OSPRAY,
      folder: "ospray-streamlines-spiralzoom"
    }
  },
  "liquid formation": {
    path_siny: {
      ae: TRROJAN,
      folder: "trrojan-liquid"
    }
  }
};

export const constants = {
  OSPRAY,
  TRROJAN,
  folders
};
