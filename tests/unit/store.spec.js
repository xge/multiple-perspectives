import {expect} from "chai";
import {getters} from "@/store/getters";

describe("filteredRows", () => {
  let state;
  beforeEach(() => {
    state = {
      brushed: [],
      dataset: "data-1",
      cameraPath: "path-1",
      device: [],
      viewport: [],
      raw: [
        {id: 0, dataset: "data-1", camera_path: "path-1", device: "1", viewport: "512"},
        {id: 1, dataset: "data-1", camera_path: "path-1", device: "1", viewport: "1024"},
        {id: 2, dataset: "data-1", camera_path: "path-1", device: "2", viewport: "512"},
        {id: 3, dataset: "data-1", camera_path: "path-1", device: "2", viewport: "1024"}
      ]
    };
  });
  it("should filter rows by device", () => {
    state.device = ["1"];
    const result = getters.filteredRows(state);
    expect(result).to.deep.equal([
      {id: 0, dataset: "data-1", camera_path: "path-1", device: "1", viewport: "512"},
      {id: 1, dataset: "data-1", camera_path: "path-1", device: "1", viewport: "1024"}
    ]);
  });
  it("should filter rows by viewport", () => {
    state.viewport = ["512"];
    const result = getters.filteredRows(state);
    expect(result).to.deep.equal([
      {id: 0, dataset: "data-1", camera_path: "path-1", device: "1", viewport: "512"},
      {id: 2, dataset: "data-1", camera_path: "path-1", device: "2", viewport: "512"}
    ]);
  });
  it("should filter rows by brushed", () => {
    state.brushed = [3];
    const result = getters.filteredRows(state);
    expect(result).to.deep.equal([{id: 3, dataset: "data-1", camera_path: "path-1", device: "2", viewport: "1024"}]);
  });
  it("should filter rows by all filters", () => {
    state.device = ["1"];
    state.viewport = ["512"];
    state.brushed = [0];
    const result = getters.filteredRows(state);
    expect(result).to.deep.equal([{id: 0, dataset: "data-1", camera_path: "path-1", device: "1", viewport: "512"}]);
  });
  it("should filter rows by all filters and return empty", () => {
    state.device = ["1"];
    state.viewport = ["512"];
    state.brushed = [1];
    const result = getters.filteredRows(state);
    expect(result).to.deep.equal([]);
  });
});

describe("aggregatedSteps", () => {
  let state;
  let actual;
  beforeEach(() => {
    state = {
      brushed: [],
      dataset: "data-1",
      cameraPath: "path-1",
      device: [],
      viewport: [],
      techniques: ["t1"],
      raw: [
        {dataset: "data-1", camera_path: "path-1", device: "1", viewport: "512", camera_step: 0, t1: 0.0},
        {dataset: "data-1", camera_path: "path-1", device: "1", viewport: "1024", camera_step: 0, t1: 7.0},
        {dataset: "data-1", camera_path: "path-1", device: "1", viewport: "2048", camera_step: 0, t1: 10.0},
        {dataset: "data-1", camera_path: "path-1", device: "1", viewport: "512", camera_step: 1, t1: 10.0},
        {dataset: "data-1", camera_path: "path-1", device: "1", viewport: "1024", camera_step: 1, t1: 10.0}
      ]
    };
    actual = getters.aggregatedSteps(state, {filteredRows: getters.filteredRows(state)});
  });

  it("should produce 2 camera steps", () => {
    expect(actual.length).to.be.equal([...new Set(state.raw.map(r => r.camera_step))].length);
  });
  it("camera step: 0", () => {
    const cs0 = actual[0];
    expect(cs0.t1).to.equal(7.0);
    expect(cs0.rows).to.deep.equal([
      {dataset: "data-1", camera_path: "path-1", device: "1", viewport: "512", camera_step: 0, t1: 0.0},
      {dataset: "data-1", camera_path: "path-1", device: "1", viewport: "1024", camera_step: 0, t1: 7.0},
      {dataset: "data-1", camera_path: "path-1", device: "1", viewport: "2048", camera_step: 0, t1: 10.0}
    ]);
  });
  it("camera step: 1", () => {
    const cs1 = actual[1];
    expect(cs1.t1).to.equal(10.0);
    expect(cs1.rows).to.deep.equal([
      {dataset: "data-1", camera_path: "path-1", device: "1", viewport: "512", camera_step: 1, t1: 10.0},
      {dataset: "data-1", camera_path: "path-1", device: "1", viewport: "1024", camera_step: 1, t1: 10.0}
    ]);
  });
});

describe("segments", () => {
  let state;
  beforeEach(() => {
    state = {dataset: "streamlines", cameraPath: "spiral"};
  });
  it("should produce a single point segment", () => {
    const actual = getters.segments(state, {aggregatedSteps: [{camera_step: 0, rows: []}]});
    expect(actual.length).to.be.equal(1);
    expect(actual[0].start).to.be.equal(0);
    expect(actual[0].end).to.be.equal(0);
  });
  it("should produce single point segments", () => {
    const actual = getters.segments(state, {
      aggregatedSteps: [
        {camera_step: 0, rows: []},
        {camera_step: 1, rows: []}
      ]
    });
    expect(actual.length).to.be.equal(2);
    expect(actual[0].start).to.be.equal(0);
    expect(actual[0].end).to.be.equal(0);
    expect(actual[1].start).to.be.equal(1);
    expect(actual[1].end).to.be.equal(1);
  });
});
