<template>
  <JsPanel :options="options" :visible="show">
    <b-container>
      <b-row>
        <b-col>
          <b-form>
            <b-form-group>
              <label for="devices">Devices <a href="#" class="ml-2" @click="device = []">clear</a></label>
              <b-form-select id="devices" v-model="device" :options="devices" multiple></b-form-select>
            </b-form-group>

            <b-form-group>
              <label for="viewports">Viewports <a href="#" class="ml-2" @click="viewport = []">clear</a></label>
              <b-form-select id="viewports" v-model="viewport" :options="viewports" multiple></b-form-select>
            </b-form-group>

            <b-form-group>
              <label for="coloringModes">
                Facet used for coloring and comparison
                <a href="#" class="ml-2" @click="clearColoringMode()">clear</a>
              </label>
              <b-form-select id="coloringModes" v-model="coloringMode" :options="coloringModes"></b-form-select>
            </b-form-group>
          </b-form>

          <div class="coloreds">
            <div v-show="coloringMode === 'Device'">
              <b-badge
                href="#"
                v-for="(d, i) in device"
                :key="d"
                :class="`color-${i} mr-1 mb-1`"
                variant="secondary"
                @click="device = device.filter(dev => dev !== d)"
                >{{ d }}
              </b-badge>
            </div>

            <div v-show="coloringMode === 'Viewport'">
              <b-badge
                href="#"
                v-for="(v, i) in viewport"
                :key="v"
                :class="`color-${i} mr-1 mb-1`"
                variant="secondary"
                @click="viewport = viewport.filter(vp => vp !== v)"
                >{{ v }}
              </b-badge>
            </div>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </JsPanel>
</template>

<script>
import {mapMutations} from "vuex";
export default {
  name: "FilterPanel",
  data() {
    return {
      options: {
        contentSize: {
          width: "400px",
          height: "auto"
        },
        headerControls: {
          close: "remove",
          maximize: "remove"
        },
        headerTitle: `Filters`,
        position: "left-top",
        resizeit: false,
        theme: "bootstrap-light"
      },
      show: true
    };
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
    cameraPaths: function () {
      return this.$store.state.cameraPaths;
    },
    coloringMode: {
      get() {
        return this.$store.state.coloringMode;
      },
      set(val) {
        this.setColoringMode(val);
      }
    },
    coloringModes: function () {
      return this.$store.state.coloringModes;
    },
    dataset: {
      get() {
        return this.$store.state.dataset;
      },
      set(val) {
        this.setDataset(val);
      }
    },
    datasets: function () {
      return this.$store.state.datasets;
    },
    device: {
      get() {
        return this.$store.state.device;
      },
      set(val) {
        this.setDevice(val);
      }
    },
    devices: {
      get() {
        return this.$store.state.devices;
      }
    },
    viewport: {
      get() {
        return this.$store.state.viewport;
      },
      set(val) {
        this.setViewport(val);
      }
    },
    viewports: {
      get() {
        return this.$store.state.viewports;
      }
    }
  },
  methods: {
    ...mapMutations(["setCameraPath", "setColoringMode", "setDataset", "setDevice", "setViewport"]),
    clearColoringMode() {
      if (this.coloringMode === "Device") {
        this.device = [];
      }
      if (this.coloringMode === "Viewport") {
        this.viewport = [];
      }
      this.coloringMode = undefined;
    }
  },
  mounted() {
    this.options.headerTitle = `${this.dataset} / ${this.cameraPath}`;
  }
};
</script>

<style>
div.coloreds {
  min-height: 50px;
}
.badge-secondary.color-0 {
  background-color: var(--color-0);
}
.badge-secondary.color-1 {
  background-color: var(--color-1);
}
.badge-secondary.color-2 {
  background-color: var(--color-2);
}
.badge-secondary.color-3 {
  background-color: var(--color-3);
}
.badge-secondary.color-4 {
  background-color: var(--color-4);
}
.badge-secondary.color-5 {
  background-color: var(--color-5);
}
</style>
