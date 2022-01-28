<template>
  <g class="radar"></g>
</template>

<script>
import {median} from "d3";
import RadarChart from "@/assets/RadarChart";

export default {
  name: "RadarChart",
  data() {
    return {
      medians: [[]]
    };
  },
  props: {
    height: {
      type: Number,
      required: true
    },
    rows: {
      type: Array,
      required: true
    },
    width: {
      type: Number,
      required: true
    }
  },
  computed: {
    coloringMode() {
      return this.$store.state.coloringMode;
    },
    device() {
      return this.$store.state.device;
    },
    labels() {
      return this.$store.state.labels;
    },
    maxMedian() {
      return this.$store.getters.mediansExtent[1];
    },
    maxDisplayedValue() {
      return this.$store.state.displayedMax;
    },
    scaleMode() {
      return this.$store.state.scaleMode;
    },
    techniques() {
      return this.$store.state.techniques;
    },
    viewport() {
      return this.$store.state.viewport;
    }
  },
  methods: {
    drawRadar: function () {
      this.rc.render(this.medians, this.maxDisplayedValue, this.scaleMode);
    },
    update: function () {
      let result = [];
      if (this.coloringMode === "Device" && this.device.length > 0) {
        result = Array(this.device.length);
        this.device.forEach(device => {
          const medians = Array(this.techniques.length);
          this.techniques.forEach((t, i) => {
            const values = this.rows.filter(r => r.device === device).map(r => r[t]);
            medians[i] = {name: t, med: median(values)};
          });
          result[this.device.indexOf(device)] = {id: this.device.indexOf(device), name: device, medians: medians};
        });
      } else if (this.coloringMode === "Viewport" && this.viewport.length > 0) {
        result = Array(this.viewport.length);
        this.viewport.forEach(viewport => {
          const medians = Array(this.techniques.length);
          this.techniques.forEach((t, i) => {
            const values = this.rows.filter(r => r.viewport === viewport).map(r => r[t]);
            medians[i] = {name: t, med: median(values)};
          });
          result[this.viewport.indexOf(viewport)] = {
            id: this.viewport.indexOf(viewport),
            name: viewport,
            medians: medians
          };
        });
      } else {
        this.techniques.forEach(t => {
          const values = this.rows.map(r => r[t]);
          result.push({name: t, med: median(values)});
        });
        result = [{id: 0, name: "result", medians: result}];
      }
      this.medians = result;
      this.drawRadar();
    }
  },
  mounted: function () {
    const id = this.$el;
    const config = {
      width: this.width,
      height: this.height,
      createSvg: false,
      techniques: this.techniques,
      labels: this.labels
    };
    this.rc = new RadarChart(id, config);
    this.update();
  },
  watch: {
    coloringMode: function () {
      this.update();
    },
    maxDisplayedValue: function () {
      this.drawRadar();
    },
    rows: function () {
      this.update();
    },
    scaleMode: function () {
      this.drawRadar();
    }
  }
};
</script>
