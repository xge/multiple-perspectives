<template>
  <div class="camera-path-wrapper">
    <div class="controls">
      <b-button id="btnCameraPathDebug" variant="link" small>Debug info</b-button>
      <b-button variant="secondary" small v-if="visible.length !== 0" @click="visible = []">Hide all</b-button>
      <b-button
        variant="secondary"
        small
        v-if="visible.length === 0"
        @click="visible = segs.map(s => `${s.start}-${s.end}`)"
        >Show all</b-button
      >
      <b-popover target="btnCameraPathDebug" triggers="hover" placement="bottom">
        <template #title>Camera Path Debug</template>
        Number of rows: {{ filteredRows.length }}.<br />
        After aggregation: {{ aggregatedSteps.length }}. <br />
        Number of segments: {{ segments.length }}. <br />
      </b-popover>
      <b-icon-question-circle-fill font-scale="2" id="cameraPathHelp" />
      <b-popover target="cameraPathHelp" placement="bottomleft" title="Help" variant="primary" triggers="hover">
        Hint: hold <code>Left Mouse</code> to pan; <code>Mousewheel</code> to zoom. <br />
        Light grey shape in the background is the projected Bounding Box.
      </b-popover>
      <b-icon-gear-fill font-scale="2" id="cameraPathSettings" />
      <b-popover
        target="cameraPathSettings"
        placement="bottomleft"
        title="Radial Area Chart Settings"
        variant="light"
        triggers="hover"
      >
        <b-form>
          <b-form-group label="Scale Mode:" label-for="scaleModeSelect">
            <b-form-select v-model="scaleMode" :options="scaleModeOptions" id="scaleModeSelect"></b-form-select>
          </b-form-group>
          <b-form-group label="Max Value:" label-for="maxValInput">
            <b-form-input
              v-model="maxDisplayedValue"
              :min="techniqueExtent[0]"
              :max="techniqueExtent[1]"
              step="1"
              type="range"
              placeholder="Max Value"
              id="maxValInput"
            />
            {{ maxDisplayedValue }}fps
          </b-form-group>
          <b-button
            @click="
              maxDisplayedValue = extent[1];
              scaleMode = 'linear';
            "
            >Reset</b-button
          >
        </b-form>
      </b-popover>
    </div>
    <svg class="camera-path" :width="svgWidth" :height="svgHeight" :viewbox="`0 0 ${svgWidth} ${svgHeight}`">
      <g>
        <g id="bbox">
          <polygon class="datasetFace" v-for="(d, i) in datasetFaces" :key="i" :points="d.points" />
        </g>
        <path :d="fullPath" class="full-path" />
        <g id="segments">
          <g v-for="segment in segs" :key="`segment-${segment.start}-${segment.end}`">
            <path
              class="segment"
              :d="pathSegment(segment.start, segment.end)"
              v-if="segment.end !== segment.start"
              @mouseenter="highlightSteps([segment.start, segment.end])"
              @mouseleave="highlightSteps([])"
            />
            <circle
              r="3"
              class="start"
              :cx="xScale(cp[segment.start].pos_x)"
              :cy="yScale(cp[segment.start].pos_y)"
              v-if="segment.end !== segment.start"
            />
            <circle
              r="3"
              class="end"
              :cx="xScale(cp[segment.end].pos_x)"
              :cy="yScale(cp[segment.end].pos_y)"
              v-if="segment.end !== segment.start"
            />
            <polygon
              class="frustum-cone"
              points="0,0 -300,-300 -300,300"
              :transform="`translate(${segment.x}, ${segment.y}) rotate(${segment.degree})`"
              v-show="visible.includes(`${segment.start}-${segment.end}`)"
            />
            <circle
              r="6"
              class="mid"
              :class="visible.includes(`${segment.start}-${segment.end}`) ? 'open' : 'closed'"
              :cx="segment.x"
              :cy="segment.y"
            />
          </g>

          <node-box
            v-for="segment in segs"
            :key="`nodebox-${segment.start}-${segment.end}`"
            v-show="visible.includes(`${segment.start}-${segment.end}`)"
            :rows="segment.rows"
            :start="segment.start"
            :end="segment.end"
            :origin="{x: segment.x, y: segment.y}"
            :center="positions[`nodebox-${segment.start}-${segment.end}`]"
          />
          <circle
            v-for="segment in segs"
            :key="`helper-${segment.start}-${segment.end}`"
            r="20"
            class="helper"
            :cx="segment.x"
            :cy="segment.y"
            @click="toggle(`${segment.start}-${segment.end}`)"
          />
        </g>
      </g>
    </svg>
  </div>
</template>

<script>
import {mapGetters, mapMutations} from "vuex";
import {curveNatural, line, max, scaleLinear, select, selectAll, zoom, zoomIdentity} from "d3";
import Simulation from "@/assets/Simulation";
import NodeBox from "./NodeBox.vue";

const SCALING_FACTOR = 4; // size of resulting plot will be data.svgHeight/data.svgWidth times scaling factor

export default {
  name: "CameraPath",
  components: {NodeBox},
  data() {
    return {
      datasetFaces: [],
      fullPath: "",
      margin: {top: 10, right: 10, bottom: 10, left: 10},
      positions: {},
      svgHeight: 1920,
      svgWidth: 1080,
      visible: [],
      xScale: () => 1.0,
      yScale: () => 1.0
    };
  },
  computed: {
    ...mapGetters({
      aggregatedSteps: "aggregatedSteps",
      extent: "mediansExtent",
      filteredRows: "filteredRows",
      segments: "segments"
    }),
    bbox: function () {
      return this.$store.state.bbox;
    },
    cp: function () {
      return this.$store.state.cp;
    },
    maxDisplayedValue: {
      get() {
        return this.$store.state.displayedMax;
      },
      set(val) {
        this.setDisplayedMax(parseInt(val));
      }
    },
    pathDomain: function () {
      return this.$store.state.pathDomain;
    },
    scaleMode: {
      get() {
        return this.$store.state.scaleMode;
      },
      set(val) {
        this.setScaleMode(val);
      }
    },
    scaleModeOptions: {
      get() {
        return this.$store.state.scaleModeOptions;
      }
    },
    segs: function () {
      return this.segments.map(s => {
        const idx = s.start + Math.ceil((s.end - s.start) / 2);
        const point = this.cp[idx];
        return {
          ...s,
          x: this.xScale(point.pos_x),
          y: this.yScale(point.pos_y),
          view_x: this.xScale(point.view_x),
          view_y: this.yScale(point.view_y),
          degree:
            (Math.atan2(
              this.yScale(point.pos_y) - this.yScale(point.view_y),
              this.xScale(point.pos_x) - this.xScale(point.view_x)
            ) *
              180) /
            Math.PI
        };
      });
    },
    techniqueExtent() {
      return this.$store.state.techniqueExtent;
    }
  },
  mounted() {
    this.svgHeight = this.$el.clientHeight;
    this.svgWidth = this.$el.clientWidth;
    this.init();
  },
  methods: {
    ...mapMutations(["setDisplayedMax", "setScaleMode"]),
    convertToNodeLinks() {
      const x = this.xScale;
      const y = this.yScale;

      const nodes = [];
      for (const seg of this.segs) {
        nodes.push({id: `segment-${seg.start}-${seg.end}`, fx: seg.x, fy: seg.y, type: "node", r: 25, strength: -500});
      }

      const links = [];
      nodes.forEach((n, idx) => {
        // Add links between fixed nodes
        if (idx + 1 < nodes.length) links.push({source: n.id, target: nodes[idx + 1].id, type: "CameraPathLine"});
      });

      // Add label nodes + links
      nodes.forEach(n => {
        const box_id = n.id.replace("segment-", "nodebox-");
        nodes.push({id: box_id, type: "NodeBox", width: 300, height: 150, step: n.id});
        links.push({
          source: n.id,
          target: box_id,
          distance: 160,
          strength: 5,
          type: "NodeBoxLink",
          id: n.id
        });
      });

      nodes.push({id: "origin", fx: x(0), fy: y(0), type: "origin", r: 15, strength: -10000});
      return [nodes, links];
    },
    drawBbox: function () {
      const faces = [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [0, 1, 6, 5],
        [1, 2, 7, 6],
        [2, 7, 4, 3],
        [0, 3, 4, 5]
      ];
      const result = [];
      faces.forEach(face => {
        const points = face.map(index => {
          const point = this.bbox.coords[index];
          const x = point[0];
          const y = point[1];
          return `${this.xScale(x)},${this.yScale(y)}`;
        });
        result.push({points: points.join(" ")});
      });
      this.datasetFaces = result;
    },
    drawNodeBoxes: function () {
      this.visible = [];
      this.segments.forEach(s => {
        if (s.end === s.start) {
          this.toggle(`${s.start}-${s.end}`);
        }
      });

      const nl = this.convertToNodeLinks();
      const sim = new Simulation(nl[0], nl[1]);
      sim.run();
      const nodeboxes = nl[0].filter(n => n.type === "NodeBox");
      this.positions = {};
      nodeboxes.forEach(nb => (this.positions[nb.id] = {x: nb.x, y: nb.y}));
    },
    highlightSteps(range) {
      if (range.length > 0) {
        Array.from({length: range[1] - range[0] + 1}, (_, i) => range[0] + i).forEach(id =>
          selectAll(`circle[data-id='${id}']`).classed("highlighted", true)
        );
      } else {
        selectAll("circle.highlighted").classed("highlighted", false);
      }
    },
    init: function () {
      this.maxDisplayedValue = this.extent[1];
      this.initScales();
      this.fullPath = line().curve(curveNatural)(this.cp.map(p => [this.xScale(p.pos_x), this.yScale(p.pos_y)]));
      this.drawBbox();
      this.drawNodeBoxes();

      // Set up pan+zoom and move camera
      const svg = select("svg.camera-path");
      const handler = zoom()
        .scaleExtent([0.2, 2.0])
        .on("zoom", event => svg.select("g").attr("transform", event.transform));
      svg.call(handler);
      svg.call(
        handler.transform,
        zoomIdentity
          .translate(this.svgWidth / 2, this.svgHeight / 2)
          .scale(0.4)
          .translate(-this.xScale(0), -this.yScale(0))
      );
    },
    getConeDegree(segment) {
      const step = this.cp[Math.ceil((segment.end - segment.start) / 2)];
      const x = this.xScale(this.cp[segment.start + Math.ceil((segment.end - segment.start) / 2)].pos_x);
      const y = this.yScale(this.cp[segment.start + Math.ceil((segment.end - segment.start) / 2)].pos_y);
      return (Math.atan2(y - this.yScale(step.view_y), x - this.xScale(step.view_x)) * 180) / Math.PI;
    },
    initScales: function () {
      // biggest value will be mapped to a multiple of screen width or height (depending on which is bigger) and then multiplied by the scaling factor
      const width = this.svgWidth - this.margin.left - this.margin.right;
      const height = this.svgHeight - this.margin.top - this.margin.bottom;
      const maxCanvasSize = SCALING_FACTOR * max([width, height]);

      this.xScale = scaleLinear().range([0, maxCanvasSize]).domain(this.pathDomain);
      this.yScale = scaleLinear().range([maxCanvasSize, 0]).domain(this.pathDomain);
    },
    pathSegment(start, end) {
      const samples = this.cp.slice(start, end + 1);
      const points = samples.map(step => [this.xScale(step.pos_x), this.yScale(step.pos_y)]);
      return line()(points);
    },
    toggle(id) {
      if (this.visible.includes(id)) {
        this.visible = this.visible.filter(n => n !== id);
      } else {
        this.visible.push(id);
      }
    }
  },
  watch: {
    segments: function () {
      this.drawNodeBoxes();
    }
  }
};
</script>

<style lang="scss">
$stroke-width: 4;
$canvas-color: var(--white);
$line-color: #999;
$line-color-active: var(--primary);
$roundedCorners: 2;

.camera-path-wrapper {
  height: 100vh;
  width: 100vw;
}

div.controls {
  margin-right: 1rem;
  position: absolute;
  right: 0;
  svg {
    padding: 1rem;
  }
}

polygon.datasetFace {
  fill: $line-color;
  fill-opacity: 0.2;
  stroke: white;
  stroke-width: $stroke-width;
}

path.segment {
  fill: none;
  stroke: $line-color;
  stroke-width: $stroke-width;
}

path.full-path {
  fill: none;
  stroke: $line-color;
  stroke-width: 2;
  stroke-dasharray: 32;
}

circle.mid {
  &.open {
    fill: var(--primary);
  }
  &.closed {
    fill: #666;
  }
}

circle.helper {
  fill: magenta;
  stroke: none;
  fill-opacity: 0;
}

polygon.frustum-cone {
  fill: var(--primary);
  fill-opacity: 0.1;
}
</style>
