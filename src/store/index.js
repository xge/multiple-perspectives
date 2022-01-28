import Vue from "vue";
import Vuex from "vuex";
import {actions} from "./actions";
import {getters} from "./getters";

Vue.use(Vuex);

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== "production",
  state: {
    bbox: {},
    brushed: [],
    cameraPath: undefined,
    cameraPaths: undefined,
    cp: [],
    coloringMode: undefined,
    coloringModes: ["Device", "Viewport"],
    dataset: undefined,
    datasets: undefined,
    device: [],
    devices: undefined,
    displayedMax: 0,
    initialized: false,
    labels: {
      stpa: "Screen-aligned Quad",
      geo_quad: "Ray-aligned Quad Geometry",
      quad_inst: "Instanced Quad",
      quad_tess: "Ray-aligned Quad Tesselation",
      poly_tess: "Ray-aligned Polygon Tesselation",
      "ao-NA-1-NA": "LQ Ambient Occlusion",
      "ao-NA-5-NA": "HQ Ambient Occlusion",
      "pathtracer-NA-NA-10": "HQ Pathtracer",
      "pathtracer-NA-NA-5": "LQ Pathtracer",
      "scivis-false-1-NA": "LQ SciVis without Shadows",
      "scivis-false-5-NA": "HQ SciVis without Shadows",
      "scivis-true-1-NA": "LQ SciVis with Shadows",
      "scivis-true-5-NA": "HQ SciVis with Shadows"
    },
    pathDomain: [],
    raw: [],
    scaleMode: "linear",
    scaleModeOptions: ["linear", "squared", "cubic", "sqrt"],
    techniquesOspray: [
      "scivis-false-1-NA",
      "scivis-false-5-NA",
      "scivis-true-1-NA",
      "scivis-true-5-NA",
      "ao-NA-1-NA",
      "ao-NA-5-NA",
      "pathtracer-NA-NA-5",
      "pathtracer-NA-NA-10"
    ],
    techniquesTrrojan: ["quad_tess", "geo_quad", "stpa", "quad_inst", "poly_tess"],
    techniques: [],
    techniqueX: undefined,
    techniqueY: undefined,
    techniqueExtent: [],
    viewport: [],
    viewports: undefined
  },
  mutations: {
    setBbox(state, payload) {
      state.bbox = payload;
    },
    setBrushed(state, payload) {
      state.brushed = payload;
    },
    setCameraPath(state, payload) {
      state.cameraPath = payload;
    },
    setCameraPaths(state, payload) {
      state.cameraPaths = payload;
    },
    setCp(state, payload) {
      state.cp = payload;
    },
    setColoringMode(state, payload) {
      state.coloringMode = payload;
    },
    setColoringModes(state, payload) {
      state.coloringModes = payload;
    },
    setDataset(state, payload) {
      state.dataset = payload;
    },
    setDatasets(state, payload) {
      state.datasets = payload;
    },
    setDevice(state, payload) {
      state.device = payload;
    },
    setDevices(state, payload) {
      state.devices = payload;
    },
    setDisplayedMax(state, payload) {
      state.displayedMax = payload;
    },
    setInitialized(state, payload) {
      state.initialized = payload;
    },
    setPathDomain(state, payload) {
      state.pathDomain = payload;
    },
    setRaw(state, payload) {
      state.raw = payload;
    },
    setScaleMode(state, payload) {
      state.scaleMode = payload;
    },
    setTechniques(state, payload) {
      state.techniques = payload;
    },
    setTechniqueX(state, payload) {
      state.techniqueX = payload;
    },
    setTechniqueY(state, payload) {
      state.techniqueY = payload;
    },
    setTechniqueExtent(state, payload) {
      state.techniqueExtent = payload;
    },
    setViewport(state, payload) {
      state.viewport = payload;
    },
    setViewports(state, payload) {
      state.viewports = payload;
    }
  },
  actions: actions,
  getters: getters
});
