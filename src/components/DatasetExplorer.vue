<template>
  <b-container fluid>
    <div v-for="ae in $options.applicationExamples" :key="ae.id">
      <b-row class="shadow-sm" v-for="dataset in ae.datasets" :key="dataset.name">
        <b-col cols="12" class="m-2" @click="visible = dataset.name" style="cursor: pointer">
          <h2 class="float-left">{{ ae.name }} / {{ dataset.name }}</h2>
          <h2 class="float-right" v-if="dataset.name === visible">-</h2>
          <h2 class="float-right" v-if="dataset.name !== visible">+</h2>
        </b-col>
        <b-col cols="4" v-for="cameraPath in dataset.camera_paths" :key="cameraPath.camera_path">
          <camera-path-card
            :ae="ae.name"
            :dataset="dataset.name"
            :labels="ae.labels"
            :maxDisplayedValue="dataset.maxValue"
            :path="cameraPath"
            :techniques="ae.techniques"
            v-if="dataset.name === visible"
          />
        </b-col>
      </b-row>
    </div>
  </b-container>
</template>

<script>
import applicationExamples from "@/export.json";
import CameraPathCard from "./CameraPathCard.vue";

export default {
  components: {CameraPathCard},
  name: "DatasetExplorer",
  applicationExamples: applicationExamples,
  data: function () {
    return {
      visible: "vdb-volume"
    };
  }
};
</script>
