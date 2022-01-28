<template>
  <div class="shadow-sm">
    <vgl-renderer ref="vglRenderer" class="vue-gl-renderer" camera="c" scene="s" antialias>
      <vgl-scene name="s" background-color="white">
        <vgl-group v-if="DEBUG">
          <vgl-box-geometry name="originGeom" />
          <vgl-mesh-lambert-material name="originMat" color="#f0f" />
          <vgl-mesh material="originMat" geometry="originGeom" position="0 0 0" />
        </vgl-group>
        <vgl-axes-helper v-if="DEBUG" size="10" />
        <vgl-group name="bbox">
          <vgl-box-geometry :width="bboxW" :height="bboxH" :depth="bboxD" name="bboxg" />
          <vgl-mesh-lambert-material ref="bboxmat" name="bboxmat" color="#6c757d" />
          <vgl-mesh ref="bboxmesh" name="bboxmesh" material="bboxmat" geometry="bboxg" position="0 0 0" />
        </vgl-group>

        <vgl-group name="cameraPathLine">
          <vgl-geometry :position-attribute="points.flat()" name="g" />
          <vgl-line-basic-material name="m" color="#6c757d" />
          <vgl-line geometry="g" material="m" />
        </vgl-group>

        <vgl-group v-for="(point, i) in points" :key="i" :name="`cameraPathMarker-${i}`">
          <vgl-sphere-geometry
            :ref="`vglSphereGeometry-${i}`"
            :name="`vglSphereGeometry-${i}`"
            :radius="hovered === i ? radiusHovered : radiusNormal"
            width-segments="16"
            height-segments="12"
          />
          <vgl-mesh-lambert-material
            :ref="`vglMeshLambertMaterial-${i}`"
            :name="`vglMeshLambertMaterial-${i}`"
            color="#007bff"
          />
          <vgl-mesh
            :geometry="`vglSphereGeometry-${i}`"
            :material="`vglMeshLambertMaterial-${i}`"
            :position="point.join(' ')"
          />
        </vgl-group>

        <vgl-ambient-light intensity="0.5" />
        <vgl-directional-light position="5 0 0" />
      </vgl-scene>
      <vgl-perspective-camera :orbit-position="camPos" name="c" fov="60" />
      <orbit-controls camera="c"></orbit-controls>
    </vgl-renderer>
    <div class="framesteps">
      <div class="framesteps-container">
        <div
          v-for="(frame, i) in framesteps"
          :key="frame.camera_step"
          class="framestep"
          @mouseover="hovered = i"
          @mouseleave="hovered = undefined"
        >
          <div class="camera_step" :class="{active: hovered === i}">{{ frame.camera_step }}</div>
          <img :src="getFramestepSrc(frame.src)" class="frame img-mini" :class="{active: hovered === i}" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/*eslint-disable no-unused-vars */
const {
  VglAxesHelper,
  VglBoxGeometry,
  VglMesh,
  VglMeshLambertMaterial,
  VglGroup,
  VglGeometry,
  VglRenderer,
  VglLine,
  VglScene,
  VglPerspectiveCamera,
  VglLineBasicMaterial,
  VglAmbientLight,
  VglDirectionalLight,
  VglSphereGeometry
} = require("vue-gl");
const THREE = require("three");
import OrbitControls from "./OrbitControls";

export default {
  props: {
    ae: {
      type: String,
      required: true
    },
    bb3d: {
      type: Object,
      required: true
    },
    cp3d: {
      type: Array,
      required: true
    },
    framesteps: {
      type: Array,
      required: true
    }
  },
  data: function () {
    return {
      DEBUG: false, // enables different helpers
      hovered: undefined,
      radiusNormal: 0.2,
      radiusHovered: 0.4,
      scalingFactor: 4
    };
  },
  computed: {
    bboxW: function () {
      return Math.abs(this.bb3d.lower_left[0]) + Math.abs(this.bb3d.upper_right[0]);
    },
    bboxH: function () {
      return Math.abs(this.bb3d.lower_left[1]) + Math.abs(this.bb3d.upper_right[1]);
    },
    bboxD: function () {
      return Math.abs(this.bb3d.lower_left[2]) + Math.abs(this.bb3d.upper_right[2]);
    },
    camPos: function () {
      const maxValue = Math.max(...[this.bboxW, this.bboxH, this.bboxD]);
      return `${maxValue * this.scalingFactor} 1 1`;
    },
    points() {
      return this.cp3d.map(p => [p.pos_x, p.pos_y, p.pos_z]);
    }
  },
  methods: {
    getFramestepSrc: function (src) {
      return `http://localhost:8000/${src}`;
    }
  },
  components: {
    VglAxesHelper,
    VglBoxGeometry,
    VglMesh,
    VglMeshLambertMaterial,
    VglGroup,
    VglGeometry,
    VglRenderer,
    VglLine,
    VglScene,
    VglPerspectiveCamera,
    VglLineBasicMaterial,
    VglAmbientLight,
    VglDirectionalLight,
    OrbitControls,
    VglSphereGeometry
  },
  created: async function () {
    switch (this.ae) {
      case "OSPRay":
        this.radiusNormal = 0.2;
        this.radiusHovered = 1.5 * this.radiusNormal;
        this.scalingFactor = 3;
        break;
      case "TRRojan: Particle Dataset":
        this.radiusNormal = 0.06;
        this.radiusHovered = 2 * this.radiusNormal;
        this.scalingFactor = 1;
        break;
    }
  },
  mounted: function () {
    const dpr = window.devicePixelRatio || 1;
    this.$refs.vglRenderer.inst.setPixelRatio(dpr);
    this.$refs.bboxmat.inst.transparent = true;
    this.$refs.bboxmat.inst.opacity = 0.5;
  }
};
</script>

<style lang="scss">
.vue-gl-renderer {
  height: 216px;

  :first-child {
    line-height: 0;
  }
}
iframe {
  position: absolute !important;
}

.framesteps {
  min-height: 67px;
  background: var(--dark);
  overflow-x: scroll;
  .framesteps-container {
    width: 550px;
  }
  .framestep {
    height: 50px;
    width: 50px;
    display: inline;
    position: relative;
    .frame {
      height: 50px;
      border: 1px solid var(--light);
      &.active {
        border: 2px solid var(--primary);
      }
    }
    .camera_step {
      display: inline;
      background: var(--light);
      color: var(--dark);
      font-size: 9px;
      padding: 1px;
      position: absolute;
      &.active {
        background: var(--primary);
        color: var(--light);
      }
    }
  }
}

@media (max-width: 1920px) {
  .framesteps {
    width: 260px;
  }
}
@media (min-width: 1921px) {
  .framesteps {
    width: 370px;
  }
}
</style>
