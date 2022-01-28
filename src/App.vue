<template>
  <div id="#app">
    <div v-if="!initialized">
      <dataset-explorer />
    </div>
    <div v-if="initialized">
      <camera-path />
      <filter-panel />
      <data-table />
      <comparison-panel />
      <clustering-panel />
    </div>
  </div>
</template>

<script>
import ClusteringPanel from "@/components/ClusteringPanel";
import ComparisonPanel from "@/components/ComparisonPanel";
import FilterPanel from "@/components/FilterPanel.vue";
import DataTable from "@/components/DataTable.vue";
import CameraPath from "@/components/CameraPath.vue";
import {mapMutations} from "vuex";
import DatasetExplorer from "./components/DatasetExplorer.vue";

export default {
  name: "App",
  components: {ClusteringPanel, ComparisonPanel, FilterPanel, DataTable, CameraPath, DatasetExplorer},
  data: function () {
    return {};
  },
  created: function () {
    // this.$store.dispatch("init");
  },
  computed: {
    cameraPath: {
      get() {
        return this.$store.state.cameraPath;
      },
      set(val) {
        this.setCameraPath(val);
      }
    },
    dataset: {
      get() {
        return this.$store.state.dataset;
      },
      set(val) {
        this.setDataset(val);
      }
    },
    initialized() {
      return this.$store.state.initialized;
    }
  },
  methods: {
    ...mapMutations(["setDataset", "setCameraPath"])
  }
};
</script>

<style lang="scss">
circle {
  fill: rgba($color: #fff, $alpha: 0.5);
  stroke: #666;
  stroke-width: 1;
}

circle.color-0 {
  stroke: var(--color-0);
  &.brushed {
    stroke: var(--primary);
    stroke-width: 2;
    fill: var(--color-0);
  }
}
circle.color-1 {
  stroke: var(--color-1);
  &.brushed {
    stroke: var(--primary);
    stroke-width: 2;
    fill: var(--color-1);
  }
}
circle.color-2 {
  stroke: var(--color-2);
  &.brushed {
    stroke: var(--primary);
    stroke-width: 2;
    fill: var(--color-2);
  }
}
circle.color-3 {
  stroke: var(--color-3);
  &.brushed {
    stroke: var(--primary);
    stroke-width: 2;
    fill: var(--color-3);
  }
}
circle.color-4 {
  stroke: var(--color-4);
  &.brushed {
    stroke: var(--primary);
    stroke-width: 2;
    fill: var(--color-4);
  }
}
circle.color-5 {
  stroke: var(--color-5);
  &.brushed {
    stroke: var(--primary);
    stroke-width: 2;
    fill: var(--color-5);
  }
}
circle.highlighted {
  stroke: var(--primary);
  stroke-width: 4;
}
</style>
