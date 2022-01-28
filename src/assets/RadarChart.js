import {curveLinearClosed, lineRadial, scaleLinear, scaleLog, scalePow, select} from "d3";

export default class RadarChart {
  constructor(id, config) {
    this.anchor = id;
    this.height = config.height || 200;
    this.width = config.width || 200;
    this.radius = Math.min(this.width / 2, this.height / 2); //Radius of the outermost circle
    this.createSvg = config.createSvg;
    this.techniques = config.techniques;
    this.angleSlice = (Math.PI * 2) / this.techniques.length;
    this.labels = config.labels;

    this.radialLineGenerator = lineRadial()
      .curve(curveLinearClosed)
      .angle((d, i) => this.angleSlice * i)
      .radius(d => this.y(Math.min(d.med, this.maxValue)));

    this.setup();
  }
  setup() {
    let g = select(this.anchor);
    if (this.createSvg) {
      g = g.append("svg").attr("transform", "translate(1,1)");
    }
    this.g = g;
    g = g.attr("width", this.width).attr("height", this.height);
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.width)
      .attr("height", this.height)
      //.attr("transform", `translate(-${this.width / 2}, -${this.height / 2})`)
      .attr("fill", "#fff");

    // create groups for everything
    g = g.append("g").attr("transform", `translate(${this.width / 2},${this.height / 2})`);
    this.axisWrapper = g.append("g").attr("name", "gAxisWrapper");
    this.gReferences = g.append("g").attr("name", "gReferences");
    this.gMedians = g.append("g").attr("name", "gMedians");
    this.gMarkers = g.append("g").attr("name", "gMarkers");
  }
  render(medianSets, maxValue, scaleMode) {
    this.maxValue = maxValue; // FIXME: maxValue is ambigious here. is it the maximum value in the data or the maximum value that should be displayed? Has consequences for the third reference line!

    // update scales
    this.yDomain = [0, maxValue * 1.4];
    this.y = this._createScale(scaleMode);

    // update axes
    this._drawAxes();

    // update references
    this._drawReferences();

    // update polyline(s)
    this._drawPolylines(medianSets);

    // update markers
    this._updateMarkers(medianSets);
  }
  _createScale(mode) {
    let scale;

    switch (mode) {
      case "squared":
        scale = scalePow().exponent(2).domain(this.yDomain).range([0, this.radius]);
        break;
      case "cubic":
        scale = scalePow().exponent(3).domain(this.yDomain).range([0, this.radius]);
        break;
      case "sqrt":
        scale = scalePow().exponent(0.5).domain(this.yDomain).range([0, this.radius]);
        break;
      case "log":
        scale = scaleLog().domain([1, this.yDomain[1]]).range([0, this.radius]);
        break;
      default:
        scale = scaleLinear().domain(this.yDomain).range([0, this.radius]);
    }
    return scale;
  }

  _drawAxes() {
    //Create the straight lines radiating outward from the center
    this.axisWrapper
      .selectAll("line")
      .data(this.techniques)
      .join("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => this.y(this.yDomain[1]) * Math.cos(this.angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => this.y(this.yDomain[1]) * Math.sin(this.angleSlice * i - Math.PI / 2))
      .attr("class", "line")
      .style("stroke", "var(--gray)")
      .style("stroke-width", "1");
  }
  _drawPolylines(medianSets) {
    this.gMedians
      .selectAll("path")
      .data(medianSets, d => d.name)
      .join("path")
      .attr("d", d => this.radialLineGenerator(d.medians))
      .attr("stroke", (d, i) => (medianSets.length > 1 ? `var(--color-${i})` : "var(--primary)"))
      .attr("fill", "none")
      .style("stroke-width", "3");
  }
  _drawReferences() {
    // const references = [Math.ceil(this.maxValue * 0.4), Math.ceil(this.maxValue * 0.8), Math.ceil(this.maxValue * 1.2)];
    const references = [30, 60, 144].filter(v => v < this.maxValue);

    // if (this.maxValue > 144 * 1.4) {
    //   references.splice(0, references.length);
    //   references.push(Math.ceil(this.maxValue * 0.4), Math.ceil(this.maxValue * 0.8), Math.ceil(this.maxValue * 1.2));
    // }

    if (references.length === 0) {
      references.push(1, Math.ceil(this.maxValue / 2), Math.ceil(this.maxValue));
    }

    const data = [];
    for (const ref of references) {
      data.push({key: ref, value: Array(this.techniques.length).fill({med: ref})});
    }
    const g = this.gReferences;
    const groups = g
      .selectAll("g")
      .data(data, d => d.key)
      .join("g");
    groups.attr("name", d => d.key);
    groups.selectAll("*").remove();
    groups
      .append("path")
      .attr("stroke", "var(--gray)")
      .attr("fill", "none")
      .style("stroke-width", "1")
      .attr("d", d => this.radialLineGenerator(d.value));

    groups
      .append("text")
      .attr("x", 0)
      .attr("y", d => this.y(-d.key))
      .attr("class", "label")
      .text(d => `${d.key}fps`);
  }
  _updateMarkers(medianSets) {
    const that = this;
    const formatter = new Intl.NumberFormat("en-US", {maximumFractionDigits: 1});
    const gMarker = this.gMarkers
      .selectAll("g")
      .data(medianSets, d => d.name)
      .join("g")
      .attr("name", (d, i) => `medianSet-${i}`)
      .selectAll("g")
      .data(
        d => d.medians,
        d => d.name
      )
      .join("g")
      .attr("name", d => d.name)
      .attr("transform", (d, i) => {
        const x = that.y(Math.min(d.med, this.maxValue)) * Math.cos(this.angleSlice * i - Math.PI / 2);
        const y = that.y(Math.min(d.med, this.maxValue)) * Math.sin(this.angleSlice * i - Math.PI / 2);
        return `translate(${x},${y})`;
      });
    gMarker
      .append("circle")
      .attr("class", "stepMarker")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 4)
      .on("mouseover", function () {
        select(this).transition().attr("r", 6);
        select(this.parentNode).selectAll("text, rect").style("display", "inline");
      })
      .on("mouseout", function () {
        select(this).transition().attr("r", 4);
        select(this.parentNode).selectAll("text, rect").style("display", "none");
      });
    gMarker
      .append("text")
      .text(d => `${this.labels[d.name]}: ${formatter.format(d.med)}`)
      .attr("x", 9)
      .attr("y", 5)
      .call(function (selection) {
        selection.each(function (d) {
          d.bbox = this.getBBox();
        });
      });
    gMarker.selectAll("text").attr("display", "none");
    gMarker
      .insert("rect", "text")
      .attr("width", d => d.bbox.width + 8)
      .attr("height", d => d.bbox.height + 2)
      .attr("x", 6)
      .attr("y", -11)
      .style("display", "none")
      .style("fill", "white")
      .style("stroke", "var(--primary)")
      .style("stroke-width", 1);
  }
}
