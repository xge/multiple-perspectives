<template>
  <b-card class="m-2">
    <template #header>
      <div class="float-left">
        {{ ae }} / {{ dataset }} / <strong>{{ path.camera_path }}</strong>
      </div>
      <b-button
        :variant="dataAvailable(dataset, path) ? 'primary' : 'secondary'"
        class="float-right"
        :disabled="!dataAvailable(dataset, path)"
        @click="initialize(dataset, path.camera_path)"
      >
        Analyze</b-button
      >
    </template>
    <b-row>
      <b-col>
        <thumb-3-d :ae="ae" :bb3d="path.bb3d" :cp3d="path.cp3d" :framesteps="path.framesteps" />
      </b-col>
      <b-col>
        <div ref="radar" class="shadow-sm text-center"></div>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import {mapActions, mapMutations} from "vuex";
import RadarChart from "@/assets/RadarChart";
import Thumb3D from "@/components/Thumb3D";
import {constants} from "@/utils/const";

export default {
  name: "CameraPathCard",
  components: {Thumb3D},
  folders: constants.folders,
  props: {
    ae: {type: String, required: true},
    dataset: {type: String, required: true},
    labels: {
      type: Object,
      required: true
    },
    maxDisplayedValue: {
      type: Number,
      required: true
    },
    path: {
      type: Object,
      required: true
    },
    techniques: {
      type: Array,
      required: true
    }
  },
  computed: {
    storeCameraPath: {
      get() {
        return this.$store.state.cameraPath;
      },
      set(val) {
        this.setCameraPath(val);
      }
    },
    storeDataset: {
      get() {
        return this.$store.state.dataset;
      },
      set(val) {
        this.setDataset(val);
      }
    }
  },
  methods: {
    ...mapActions(["init"]),
    ...mapMutations(["setCameraPath", "setDataset"]),
    initialize(dataset, cameraPath) {
      this.storeDataset = dataset;
      this.storeCameraPath = cameraPath;
      this.init();
    },
    dataAvailable(dataset, path) {
      return this.$options.folders[dataset] && this.$options.folders[dataset][path.camera_path];
    }
  },
  mounted() {
    const id = this.$refs.radar;
    const config = {
      width: 250,
      height: 250,
      createSvg: true,
      techniques: this.techniques,
      labels: this.labels
    };
    const rc = new RadarChart(id, config);
    rc.render([{id: 0, name: "result", medians: this.path.medians}], this.maxDisplayedValue);
  }
};
</script>

<style lang="scss">
.radarPanel {
  width: 370px;
  height: 275px;
}
</style>
