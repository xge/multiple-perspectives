import {extent, median} from "d3";
import {constants} from "@/utils/const";

const dotp = function (x, y) {
  function dotp_sum(a, b) {
    return a + b;
  }
  function dotp_times(a, i) {
    return x[i] * y[i];
  }
  return x.map(dotp_times).reduce(dotp_sum, 0);
};

const cosineDistance = function (A, B) {
  return 1 - dotp(A, B) / (Math.sqrt(dotp(A, A)) * Math.sqrt(dotp(B, B)));
};

const filteredRows = state => {
  let rows = state.raw;

  if (state.brushed.length > 0) {
    rows = rows.filter(r => state.brushed.includes(r.id));
  }

  if (state.device.length > 0) {
    rows = rows.filter(r => state.device.includes(r.device));
  }

  if (state.viewport.length > 0) {
    rows = rows.filter(r => state.viewport.includes(r.viewport));
  }

  return rows;
};

const aggregatedSteps = (state, getters) => {
  let rows = getters.filteredRows;

  const results = [];

  let currentStep = 0;
  let currentStepRows = [];
  /**
   * Iterate over all rows in the current filter.
   * First gather all rows of one camera step then compute techique-wise medians.
   */
  for (let i = 0; i < rows.length; i++) {
    const nextRow = rows[i + 1];
    const nextStep = nextRow !== undefined ? nextRow.camera_step : currentStep + 1;
    currentStepRows.push(rows[i]);
    if (currentStep !== nextStep) {
      if (currentStepRows.length > 1) {
        const aggregatedRow = {camera_step: currentStep, rows: currentStepRows};
        state.techniques.map(t => {
          const values = median(currentStepRows.map(r => r[t]));
          aggregatedRow[t] = values;
        });
        results.push(aggregatedRow);
      } else {
        results.push({...currentStepRows[0], rows: currentStepRows});
      }
      currentStep = nextStep;
      currentStepRows = [];
    }
  }

  return results;
};
const mediansExtent = (state, getters) => {
  return extent(state.techniques.map(t => getters.aggregatedSteps.map(s => s[t])).flat());
};
const segments = (state, getters) => {
  let results = [];
  const steps = getters.aggregatedSteps;

  // We realistically only have more than 11 samples in the densely samped OSPRAY path `spiral-zoom`.
  if (steps.length > 11) {
    // calculate distances
    let distances = [];
    steps.forEach((s, i) => {
      if (i + 1 < steps.length) {
        const currentMetrics = state.techniques.map(t => s[t]);
        const nextMetrics = state.techniques.map(t => steps[i + 1][t]);
        distances.push({
          idx: i, // index in steps array. links distance to a step
          distance: cosineDistance(currentMetrics, nextMetrics)
        });
      }
    });
    // sort by distances
    distances.sort((a, b) => b.distance - a.distance);

    // find N with START < N < END, where START = 11 and END = 30
    const START = 11;
    const END = steps.length - START > 30 ? 30 : steps.length - START; // Especially in brushed cases it is possible that we have more than 11 rows, but less than 30.
    const deltas = distances.slice(START, END + 1).map((d, i) => {
      const curr = d;
      const next = distances[START + i + 1];
      return next.distance - curr.distance;
    });
    const N = deltas.indexOf(Math.max(...deltas)) + START;

    // take top n elements
    distances = distances.slice(0, N);
    // sort in order of steps
    distances.sort((a, b) => a.idx - b.idx);

    let start = distances[0].idx;
    distances.forEach(d => {
      results.push({
        start: steps[start].camera_step,
        end: steps[d.idx].camera_step,
        rows: steps
          .slice(start, d.idx + 1)
          .map(s => s.rows)
          .flat()
      });
      start = d.idx + 1;
    });
  } else {
    // This block controls sampling for sparsely sampled paths (Trrojan+OSPRay) and brushed dense paths.
    steps.forEach((s, i) => {
      // Trrojan and OSPRay Application Examples use different indexing.
      // For OSPRay the camera step works as an array index.
      // For Trrojan the step index must be used.
      const EXAMPLE = constants.folders[state.dataset][state.cameraPath];

      if (EXAMPLE.ae === constants.OSPRAY) {
        results.push({
          start: s.camera_step,
          end: s.camera_step,
          rows: s.rows
        });
      }

      if (EXAMPLE.ae === constants.TRROJAN) {
        results.push({
          start: i,
          end: i,
          rows: s.rows
        });
      }
    });
  }
  return results;
};

export const getters = {
  filteredRows,
  aggregatedSteps,
  mediansExtent,
  segments
};
