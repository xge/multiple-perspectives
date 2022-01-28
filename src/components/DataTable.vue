<template>
  <JsPanel :options="options" :visible="show">
    <div>
      <b-table
        :items="rows"
        :fields="fields"
        small
        responsive="true"
        id="data-table"
        :tbody-tr-class="rowFormatter"
        :per-page="perPage"
        :current-page="currentPage"
        primary-key="id"
      >
        <template #cell(id)="data"> {{ data.item.id }} </template>
        <template v-slot:[gomycell(t)]="data" v-for="t in techniques">
          <a :href="`http://localhost:8000/${data.value}`" target="_blank" rel="noopener noreferrer" :key="t">
            <img :src="`http://localhost:8000/${data.value}`" :alt="data.value" class="img-mini-td" />
          </a>
        </template>
      </b-table>
      <b-pagination v-model="currentPage" :total-rows="rows.length" :per-page="perPage" size="sm" align="right" />
    </div>
  </JsPanel>
</template>

<script>
import {mapGetters, mapMutations} from "vuex";

export default {
  name: "DataTable",
  data() {
    return {
      currentPage: 1,
      options: {
        contentSize: "1800 auto",
        headerControls: {
          close: "remove",
          maximize: "remove"
        },
        headerTitle: "Data Table",
        resizeit: {
          handles: "e, w",
          minWidth: 1800,
          minHeight: 400
        },
        setStatus: "minimized",
        theme: "bootstrap-light"
      },
      perPage: 6,
      show: true
    };
  },
  computed: {
    ...mapGetters({
      rows: "filteredRows"
    }),
    coloringMode: {
      get() {
        return this.$store.state.coloringMode;
      },
      set(val) {
        this.setColoringMode(val);
      }
    },
    device: {
      get() {
        return this.$store.state.device;
      },
      set(val) {
        this.setDevice(val);
      }
    },
    fields: function () {
      const fields = ["id", "device", "viewport", "camera_step"];
      this.techniques.forEach(t => {
        fields.push({key: t, label: this.labels[t]});
        fields.push({key: `img ${t}`, label: "Screenshot"});
      });
      return fields;
    },
    labels: function () {
      return this.$store.state.labels;
    },
    techniques: function () {
      return this.$store.state.techniques;
    },
    viewport: {
      get() {
        return this.$store.state.viewport;
      },
      set(val) {
        this.setViewport(val);
      }
    }
  },
  methods: {
    ...mapMutations(["setCameraPath", "setColoringMode", "setDataset", "setDevice", "setViewport"]),
    gomycell(key) {
      return `cell(img ${key})`; // simple string interpolation
    },
    rowFormatter: function (item, type) {
      if (!item || type !== "row") return;
      if (this.coloringMode === "Device" && this.device.includes(item.device)) {
        return `color-${this.device.indexOf(item.device)}`;
      } else if (this.coloringMode === "Viewport" && this.viewport.includes(item.viewport)) {
        return `color-${this.viewport.indexOf(item.viewport)}`;
      } else {
        return;
      }
    }
  }
};
</script>

<style lang="scss">
#data-table {
  min-height: calc(9 * 100px); // (number of rows + 1) * image height
}

tr.color-0 {
  background: rgba(var(--color-0-rgb), 0.2);
}
tr.color-1 {
  background: rgba(var(--color-1-rgb), 0.2);
}
tr.color-2 {
  background: rgba(var(--color-2-rgb), 0.2);
}
tr.color-3 {
  background: rgba(var(--color-3-rgb), 0.2);
}
tr.color-4 {
  background: rgba(var(--color-4-rgb), 0.2);
}
tr.color-5 {
  background: rgba(var(--color-5-rgb), 0.2);
}
.img-mini-td {
  // overwrite img-thumbnail stuff
  height: 100px !important;
  width: 100px !important;
  max-width: 100px !important;
  background-color: black !important;
}
</style>
