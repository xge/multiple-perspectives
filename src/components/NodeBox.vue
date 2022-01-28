<template>
  <g class="nodebox">
    <g class="connector">
      <line :x1="origin.x" :y1="origin.y" :x2="center.x" :y2="center.y" />
    </g>
    <g class="wrapper" :transform="`translate(${center.x - width / 2},${center.y})`">
      <rect class="background" :width="width" :height="height" />
      <rect class="header" :width="width - 2" height="25" x="1" y="1" />
      <text x="10" y="20">Camera Steps: [{{ start }}, {{ end }}]</text>
      <g class="left" :transform="`translate(1,27)`">
        <screenshots :width="width - height - 2" :height="height - 28" :rows="rows" />
      </g>
      <g class="right" :transform="`translate(${width - height + 2},27)`">
        <radar-chart-component :rows="rows" :width="height - 3" :height="height - 28" />
      </g>
    </g>
  </g>
</template>

<script>
import Vue from "vue";
import {drag, select} from "d3";
import RadarChartComponent from "./RadarChartComponent.vue";
import Screenshots from "./Screenshots.vue";

export default {
  name: "NodeBox",
  components: {RadarChartComponent, Screenshots},
  data: function () {
    return {
      width: 865,
      height: 400
    };
  },
  props: {
    center: {
      type: Object,
      required: true,
      default: () => ({x: 0, y: 0})
    },
    end: {
      type: Number,
      required: false
    },
    origin: {
      type: Object,
      required: true,
      default: () => ({x: 0, y: 0})
    },
    rows: {
      type: Array,
      required: true
    },
    start: {
      type: Number,
      required: true
    }
  },
  mounted() {
    const that = this;
    Vue.nextTick(() => {
      const el = select(that.$el);
      const g = el.select("g.wrapper");
      const l = el.select("g.connector > line");
      function dragstarted() {
        el.raise();
        el.attr("cursor", "grabbing");
      }

      function dragged(event) {
        g.attr("transform", `translate(${event.x - that.width / 2},${event.y})`);
        l.attr("x2", event.x).attr("y2", event.y);
      }

      function dragended() {
        el.attr("cursor", "grab");
      }

      el.call(drag({container: g}).on("start", dragstarted).on("drag", dragged).on("end", dragended));
    });
  }
};
</script>

<style lang="scss">
$stroke-width: 4;
$line-color: var(--secondary);
$line-color-active: var(--primary);
$roundedCorners: 2;

rect.background {
  fill: #333;
}

rect.header {
  fill: var(--light);
}

.connector {
  line {
    stroke: var(--primary);
    stroke-width: $stroke-width;
    stroke-dasharray: 16;
  }
}
</style>
