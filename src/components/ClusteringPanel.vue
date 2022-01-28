<template>
  <JsPanel :options="options" :visible="show">
    <div>
      <b-form inline class="m-2">
        <b-button
          variant="primary"
          @click="updateEmbedding()"
          :disabled="!dirty || loading || autoUpdate || rows.length < 15"
        >
          Re-calculate
        </b-button>
        <span class="ml-2 mr-2">or</span>
        <b-form-checkbox id="updateUmap" class="ml-2" v-model="autoUpdate" />
        <label for="updateUmap">
          Sync UMAP
          <b-icon-exclamation-circle-fill
            class="ml-1"
            v-b-popover.hover.top="{
              variant: 'danger',
              title: 'Warning!',
              content: 'If checked, UMAP will run whenever filtering changes. Strongly affects performance!'
            }"
          />
        </label>
      </b-form>
      <div class="text-center mt-2 mb-2">
        <div v-show="loading" class="umap-loading-wrapper">
          <div class="umap-loading">
            <b-icon icon="arrow-clockwise" animation="spin-pulse" font-scale="4" />
          </div>
        </div>
        <svg id="prj" :width="prjWidth" :height="prjHeight" v-show="!loading">
          <g :transform="`translate(${prjMargins.left},${prjMargins.top})`"></g>
        </svg>
      </div>
      <b-button v-b-popover.hover.top="debugPopover" variant="link" small>Debug info</b-button>
    </div>
  </JsPanel>
</template>

<script>
import {mapGetters, mapMutations} from "vuex";
import {UMAP} from "umap-js";
import {brush, extent, scaleLinear, select} from "d3";

export default {
  name: "ClusteringPanel",
  data: function () {
    return {
      autoUpdate: false,
      dirty: false,
      ended: undefined,
      loading: false,
      options: {
        contentSize: "auto",
        headerControls: {
          close: "remove",
          maximize: "remove"
        },
        headerTitle: "Clustering Panel",
        position: {my: "left-bottom", at: "left-bottom", offsetY: -40},
        resizeit: false,
        theme: "bootstrap-light"
      },
      points: [],
      prjHeight: 300,
      prjMargins: {left: 10, right: 10, top: 10, bottom: 10},
      prjWidth: 300,
      show: true,
      started: new Date()
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
    debugPopover: function () {
      const content = `<strong>dirty: ${this.dirty}</strong><br />
        <strong>loading: ${this.loading}</strong><br />
        last execution took ${(this.ended - this.started) / 1000}s<br />
        Number of embedded points: ${this.points.length}<br />`;

      return {
        title: "UMAP Debug Info",
        content: content,
        html: true
      };
    },
    device: {
      get() {
        return this.$store.state.device;
      }
    },
    techniques: function () {
      return this.$store.state.techniques;
    },
    viewport: {
      get() {
        return this.$store.state.viewport;
      }
    }
  },
  methods: {
    ...mapMutations(["setBrushed"]),
    highlightBrushed() {
      const that = this;
      select("#prj")
        .selectAll("circle")
        .classed("brushed", d => that.brushed.includes(d.id));
    },
    recolorPrj: function () {
      // if (this.dirty) {
      //   return;
      // }

      select("#prj").selectAll("circle").attr("class", undefined);
      if (this.coloringMode === "Device") {
        this.device.forEach(dev =>
          select("#prj")
            .selectAll(`circle[data-device='${dev}']`)
            .attr("class", `color-${this.device.indexOf(dev)}`)
        );
      } else if (this.coloringMode === "Viewport") {
        this.viewport.forEach(vp =>
          select("#prj")
            .selectAll(`circle[data-viewport='${vp}']`)
            .attr("class", `color-${this.viewport.indexOf(vp)}`)
        );
      }
      this.highlightBrushed();
    },
    updateEmbedding: function () {
      const umap = new UMAP();
      const data = this.rows.map(r => [...this.techniques.map(t => +r[t])]);
      this.loading = true;
      this.started = new Date();
      umap.fitAsync(data).then(embedding => {
        this.points = embedding.map((p, i) => ({
          id: this.rows[i].id,
          device: this.rows[i].device,
          viewport: this.rows[i].viewport,
          x: p[0],
          y: p[1]
        }));
        this.loading = false;
        this.dirty = false;
        this.ended = new Date();
        this.updateScatterplot();
        this.recolorPrj();
      });
    },
    updateScatterplot: function () {
      const xValues = this.points.map(p => p.x);
      const xExtent = extent(xValues);
      const xScale = scaleLinear()
        .domain(xExtent)
        .range([0, this.prjWidth - this.prjMargins.left - this.prjMargins.right]);

      const yValues = this.points.map(p => p.y);
      const yExtent = extent(yValues);
      const yScale = scaleLinear()
        .domain(yExtent)
        .range([this.prjHeight - this.prjMargins.top - this.prjMargins.bottom, 0]);

      const svg = select("#prj").select("g");

      svg
        .selectAll("circle")
        .data(this.points)
        .join("circle")
        .attr("r", 3)
        .attr("data-id", d => d.id)
        .attr("data-device", d => d.device)
        .attr("data-viewport", d => d.viewport)
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y));

      svg.call(
        brush().on("end", ({selection}) => {
          if (selection) {
            const [[x0, y0], [x1, y1]] = selection;
            const values = this.points
              .filter(p => x0 <= xScale(p.x) && xScale(p.x) < x1 && y0 <= yScale(p.y) && yScale(p.y) < y1)
              .map(r => r.id);
            this.brushed = values;
          } else {
            this.brushed = [];
          }
        })
      );
    }
  },
  watch: {
    brushed: function () {
      this.highlightBrushed();
    },
    coloringMode: function () {
      this.recolorPrj();
    },
    rows: function () {
      this.dirty = true;
      if (this.autoUpdate) {
        this.updateEmbedding();
        this.recolorPrj();
      }
    }
  }
};
</script>

<style lang="scss">
div.umap-loading-wrapper {
  width: 300px;
  height: 300px;
  margin: auto;
}

div.umap-loading {
  height: 100%;
  text-align: center;
  position: relative;
  top: calc(50% - 16px);
}
</style>
