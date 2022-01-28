<template>
  <JsPanel :options="options" :visible="show">
    <div>
      <table>
        <tbody>
          <tr v-for="(tX, i) in techniques" :key="`row-${i}`">
            <td
              v-for="(tY, j) in techniques"
              :key="`cell-${i}-${j}`"
              class="corrmat-cell"
              :style="corrmatCellStyle(i, j)"
            >
              <b-button
                variant="link"
                class="corr-label"
                :style="`color: ${labelScale(corrmat[i][j].value)}`"
                @click="
                  techniqueX = tX;
                  techniqueY = tY;
                "
                v-if="corrmat[i] !== undefined && i !== j"
              >
                {{ formatNumber(corrmat[i][j].value) }}
              </b-button>
              <div class="technique-label" v-if="i === j">{{ labels[tX] }}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <color-legend :valueLow="-1" :valueHigh="1" colormap="RdGy" :ltr="true" :width="tableSize" :height="25" />

      <div class="mt-2 mb-2 text-center">
        <svg class="scttr" :width="scttrSize" :height="scttrSize">
          <g class="plot" :transform="`translate(${scttrMargins.left},${scttrMargins.top})`"></g>
          <g class="x-axis" :transform="`translate(${scttrMargins.left},${scttrSize - scttrMargins.bottom})`"></g>
          <g class="y-axis" :transform="`translate(${scttrMargins.left},${scttrMargins.top})`"></g>
          <g class="brush"></g>
        </svg>
      </div>

      <div class="ml-2 mb-2">
        x-Axis: <b-badge class="mb-1">{{ labels[techniqueX] }}</b-badge> <br />
        y-Axis: <b-badge class="mb-1">{{ labels[techniqueY] }}</b-badge>
      </div>
    </div>
  </JsPanel>
</template>

<script>
import Vue from "vue";
import {
  axisBottom,
  axisLeft,
  brush,
  curveLinear,
  interpolateRdGy,
  line,
  scaleDivergingSymlog,
  scaleLinear,
  scaleThreshold,
  select
} from "d3";
import {mapGetters, mapMutations} from "vuex";
import ColorLegend from "./ColorLegend.vue";
const calculateCorrelation = require("calculate-correlation");
const NR_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 3
});

export default {
  components: {ColorLegend},
  name: "ComparisonPanel",
  data: function () {
    return {
      labelScale: scaleThreshold().domain([-1, -0.25, 0.25, 1]).range(["white", "black", "black", "white"]),
      cellSize: 60,
      colorScale: scaleDivergingSymlog().domain([-1, 0, 1]).interpolator(interpolateRdGy),
      corrmat: [],
      options: {
        contentSize: "auto",
        headerControls: {
          close: "remove",
          maximize: "remove"
        },
        headerTitle: "Comparison Panel",
        position: "right-top",
        resizeit: false,
        theme: "bootstrap-light"
      },
      scttrMargins: {left: 50, right: 10, top: 10, bottom: 50},
      scttrSize: 300,
      tableSize: 400,
      show: true
    };
  },
  computed: {
    ...mapGetters({
      rows: "filteredRows"
    }),
    brushed: {
      get() {
        return this.$store.state.brushed;
      },
      set(val) {
        this.setBrushed(val);
      }
    },
    coloringMode: {
      get() {
        return this.$store.state.coloringMode;
      }
    },
    device: {
      get() {
        return this.$store.state.device;
      }
    },
    displayedMax() {
      return this.$store.state.displayedMax * 1.1;
    },
    labels() {
      return this.$store.state.labels;
    },
    techniques: function () {
      return this.$store.state.techniques;
    },
    techniqueX: {
      get() {
        return this.$store.state.techniqueX;
      },
      set(val) {
        this.setTechniqueX(val);
      }
    },
    techniqueY: {
      get() {
        return this.$store.state.techniqueY;
      },
      set(val) {
        this.setTechniqueY(val);
      }
    },
    viewport: {
      get() {
        return this.$store.state.viewport;
      }
    }
  },
  mounted() {
    this.tableSize = this.cellSize * this.techniques.length;
    this.scttrSize = this.tableSize * 0.75;
    Vue.nextTick(() => {
      this.updateCorrMat();
      this.drawScttr();
      this.setupBrush();
    });
  },
  methods: {
    ...mapMutations(["setBrushed", "setTechniqueX", "setTechniqueY"]),
    calculateCorrelationMatrix: function () {
      const values = [];
      this.techniques.forEach(t => {
        values[t] = this.rows.map(r => +r[t]);
      });

      let counter = 0;

      const corrmat = [];
      this.techniques.forEach((tX, x) => {
        corrmat[x] = [];
        this.techniques.forEach((tY, y) => {
          if (x === y) {
            corrmat[x][y] = {key: tX, value: 1.0};
            return;
          }

          if (corrmat[y] === undefined) {
            corrmat[y] = [];
          }

          if (corrmat[x][y] === undefined) {
            const value = calculateCorrelation(values[tX], values[tY]);
            corrmat[x][y] = {key: tX, value: value};
            if (corrmat[y][x] === undefined) {
              corrmat[y][x] = {key: tY, value: value};
              counter++;
            }
          }
        });
      });
      console.log(`corrmat was calculated in ${counter} steps.`);
      return corrmat;
    },
    corrmatCellStyle: function (i, j) {
      const value = this.corrmat[i] !== undefined ? this.corrmat[i][j].value : 1.0;
      const bg = this.colorScale(value);
      return `background-color: ${bg}; width: ${this.cellSize}px; height: ${this.cellSize}px;`;
    },
    drawScttr: function () {
      const maxValue = this.displayedMax;

      const svg = select("svg.scttr").select("g.plot");

      const extra_data = [
        {
          x: this.xScale(0),
          y: this.yScale(0)
        },
        {
          x: this.xScale(maxValue),
          y: this.yScale(maxValue)
        }
      ];
      const lineGenerator = line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(curveLinear);
      svg
        .selectAll("path.extra")
        .data([extra_data])
        .join("path")
        .attr("class", "extra")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1)
        .attr("d", lineGenerator);

      svg
        .selectAll("circle")
        .data(this.rows, d => d.id)
        .join("circle")
        .attr("r", 3)
        .attr("data-id", d => d.id)
        .attr("data-device", d => d.device)
        .attr("data-viewport", d => d.viewport)
        .transition()
        .attr("cx", d => this.xScale(d[this.techniqueX]))
        .attr("cy", d => this.yScale(d[this.techniqueY]));
    },
    formatNumber(x) {
      return NR_FORMAT.format(x);
    },
    highlightBrushed() {
      const that = this;
      select("svg.scttr")
        .select("g")
        .selectAll("circle")
        .classed("brushed", d => that.brushed.includes(d.id));
    },
    onBrushEnd: function ({selection}) {
      if (selection) {
        let [[x0, y0], [x1, y1]] = selection;
        const values = this.rows
          .filter(
            r =>
              x0 <= this.xScale(r[this.techniqueX]) + this.scttrMargins.left &&
              this.xScale(r[this.techniqueX]) + this.scttrMargins.left < x1 &&
              y0 <= this.yScale(r[this.techniqueY]) + this.scttrMargins.top &&
              this.yScale(r[this.techniqueY]) + this.scttrMargins.top < y1
          )
          .map(r => r.id);
        this.brushed = values;
      } else {
        this.brushed = [];
      }
    },
    recolorScttr: function () {
      select("svg.scttr").selectAll("circle").attr("class", undefined);
      if (this.coloringMode === "Device") {
        this.device.forEach(dev =>
          select("svg.scttr")
            .selectAll(`circle[data-device='${dev}']`)
            .attr("class", `color-${this.device.indexOf(dev)}`)
        );
      } else if (this.coloringMode === "Viewport") {
        this.viewport.forEach(vp =>
          select("svg.scttr")
            .selectAll(`circle[data-viewport='${vp}']`)
            .attr("class", `color-${this.viewport.indexOf(vp)}`)
        );
      }
      this.highlightBrushed();
    },
    setupAxes: function () {
      const maxValue = this.displayedMax;
      const xScale = scaleLinear()
        .domain([0, maxValue])
        .range([0, this.scttrSize - this.scttrMargins.left - this.scttrMargins.right]);
      const xAxis = axisBottom(xScale).ticks(5);
      select("svg.scttr").select("g.x-axis").transition().call(xAxis);

      const yScale = scaleLinear()
        .domain([0, maxValue])
        .range([this.scttrSize - this.scttrMargins.top - this.scttrMargins.bottom, 0]);
      const yAxis = axisLeft(yScale).ticks(5);
      select("svg.scttr").select("g.y-axis").transition().call(yAxis);

      this.xScale = xScale;
      this.yScale = yScale;
    },
    setupBrush: function () {
      const b = select("svg.scttr").select("g.brush");
      b.call(brush().on("end", this.onBrushEnd));
    },
    updateCorrMat: function () {
      this.corrmat = this.calculateCorrelationMatrix();
    }
  },
  watch: {
    brushed: function () {
      this.highlightBrushed();
    },
    coloringMode: function () {
      this.recolorScttr();
    },
    displayedMax() {
      this.setupAxes();
      this.drawScttr();
      this.setupBrush();
    },
    rows: function () {
      this.updateCorrMat();
      this.setupAxes();
      this.drawScttr();
      this.recolorScttr();
      this.setupBrush();
    },
    techniqueX: function () {
      this.setupAxes();
      this.drawScttr();
      this.setupBrush();
    },
    techniqueY: function () {
      this.setupAxes();
      this.drawScttr();
      this.setupBrush();
    }
  }
};
</script>

<style lang="scss">
td.corrmat-cell {
  text-align: center;
}

.corr-label {
  font-size: 0.75rem;
}

div.technique-label {
  font-size: 8pt;
  color: white;
}

.y-axis-label {
  transform: rotate(90deg);
  transform-origin: left top 0;
  text-align: center;
}
.x-axis-label {
  text-align: center;
}
</style>
