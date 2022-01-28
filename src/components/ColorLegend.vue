<template>
  <svg :width="width" :height="height">
    <g :transform="'translate(' + margin[3] + ',' + margin[0] + ')'">
      <image
        :x="margin[3]"
        :y="margin[0]"
        :width="width - margin[1] - margin[3]"
        :height="height - margin[0] - margin[2]"
        preserveAspectRatio="none"
        :xlink:href="dataUrl"
      />
      <g transform="translate(1,0)">
        <text :x="margin[3] + 1" :y="height / 2" font-size="10" font-family="monospace" fill="white">
          <title>{{ valueLowFormatted }}</title>
          {{ valueLowFormatted }}
        </text>
        <text
          :x="width - margin[1] - margin[3] - 31"
          :y="height / 2"
          font-size="10"
          font-family="monospace"
          fill="white"
        >
          <title>{{ valueHighFormatted }}</title>
          {{ valueHighFormatted }}
        </text>
      </g>
    </g>
  </svg>
</template>

<script>
import {
  interpolateBlues,
  interpolatePurples,
  interpolateGreens,
  interpolateOranges,
  interpolateViridis,
  interpolateRdBu,
  interpolateRdGy,
  scaleDivergingSymlog
} from "d3";

const NR_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 3
});

function formatNumber(x) {
  return NR_FORMAT.format(x);
}

function rampImg(color, n, ltr) {
  const canvas = document.createElement("canvas");
  canvas.width = ltr ? n : 1;
  canvas.height = ltr ? 1 : n;
  const context = canvas.getContext("2d");
  for (let i = 0; i < n; ++i) {
    const interpolate = ltr ? i / (n - 1) : 1 - i / (n - 1);
    context.fillStyle = color(interpolate);
    const fillArgs = ltr ? [i, 0, 1, 1] : [0, i, 1, 1];
    context.fillRect(...fillArgs);
  }
  const url = canvas.toDataURL();
  return url;
}

export default {
  name: "ColorLegend",
  computed: {
    valueHighFormatted: function () {
      return formatNumber(this.valueHigh);
    },
    valueLowFormatted: function () {
      return formatNumber(this.valueLow);
    },
    color: function () {
      let interpolator;
      switch (this.colormap) {
        case "Blues":
          interpolator = interpolateBlues;
          break;
        case "Greens":
          interpolator = interpolateGreens;
          break;
        case "Oranges":
          interpolator = interpolateOranges;
          break;
        case "Purples":
          interpolator = interpolatePurples;
          break;
        case "Viridis":
          interpolator = interpolateViridis;
          break;
        case "RdBu":
          interpolator = interpolateRdBu;
          break;
        case "RdGy":
          interpolator = interpolateRdGy;
          break;
        default:
          throw new Error(this.colormap);
      }
      return scaleDivergingSymlog().interpolator(interpolator);
    },
    dataUrl: function () {
      return rampImg(this.color, this.resolution, this.ltr);
    }
  },
  props: {
    margin: {type: Array, default: () => [0, 0, 0, 0]},
    colormap: {type: String, default: "Blues"},
    resolution: {type: Number, default: 256},
    width: {type: Number, default: 10},
    height: {type: Number, default: 200},
    ltr: {type: Boolean, default: false},
    valueHigh: {type: Number, required: true},
    valueLow: {type: Number, required: true}
  }
};
</script>
