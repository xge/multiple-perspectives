<template>
  <g transform="translate(1,1)">
    <g class="thumbnails">
      <g
        v-for="(screenshot, i) in screenshots"
        :key="screenshot.t"
        :transform="`translate(${i % 2 === 0 ? 0 : 51},${Math.floor(i / 2) * 65})`"
      >
        <text font-size="7" fill="white" transform="translate(0,7)">{{ screenshot.label.substr(0, 12) }}...</text>
        <image
          :href="`http://localhost:8000/${screenshot.src}`"
          width="50"
          height="50"
          transform="translate(0,10)"
          @click="pinnedTechnique = screenshot"
          @mouseenter="zoomedTechnique = screenshot"
          @mouseleave="zoomedTechnique = pinnedTechnique"
        />
      </g>
    </g>
    <g class="zoom" :transform="`translate(103,0)`">
      <text font-size="7" fill="white" transform="translate(0,7)">{{ zoomedTechnique.label }}</text>
      <image
        :href="`http://localhost:8000/${zoomedTechnique.src}`"
        :width="height - 12"
        :height="height - 12"
        transform="translate(0,10)"
      />
      <g class="ssimThresholdMarker" v-if="zoomedTechnique.ssim < ssimThreshold && zoomedTechnique.ssim > 0.0">
        <rect :x="height - 62" y="10" width="50" height="50" fill="red"></rect>
        <text :x="height - 62" y="30" fill="white">{{ zoomedTechnique.ssim.toFixed(2) }}</text>
      </g>
    </g>
  </g>
</template>

<script>
/* eslint-disable vue/multi-word-component-names */
export default {
  name: "Screenshots",
  data: function () {
    return {
      pinnedTechnique: "",
      ssimThreshold: 0.99,
      zoomedTechnique: ""
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
    labels() {
      return this.$store.state.labels;
    },
    screenshots() {
      const median_idx = this.rows.length > 1 ? Math.ceil(this.rows.length / 2) : 0;
      const median_row = this.rows[median_idx];
      return this.techniques.map(t => ({
        t: t,
        label: this.labels[t],
        src: median_row[`img ${t}`],
        ssim: median_row["ssim"]
      }));
    },
    techniques() {
      return this.$store.state.techniques;
    }
  },
  mounted() {
    this.pinnedTechnique = this.screenshots[0];
    this.zoomedTechnique = this.screenshots[0];
  }
};
</script>
