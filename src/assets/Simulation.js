import {forceSimulation, forceLink, forceManyBody, forceCollide} from "d3";

/**
 * This is stateful!
 * It mutates `this.nodes` and `this.links`.
 */
export default class Simulation {
  constructor(nodes, links) {
    this.simulation = forceSimulation(nodes)
      .force(
        "link",
        forceLink(links)
          .id(l => l.id)
          .distance(l => l.distance || 30)
      )
      .force(
        "charge",
        forceManyBody().strength(n => n.strength || -30)
      )
      .force(
        "collide",
        forceCollide()
          .radius(d => (d.r ? 50 : 530)) // the node has a radius if its type === node, else its a rac. for nodes the force-relevant radius is 50, for rac it is the radius of the bounding circle
          .iterations(2)
      )
      .stop();
  }

  run() {
    const n = Math.ceil(Math.log(this.simulation.alphaMin()) / Math.log(1 - this.simulation.alphaDecay()));
    for (let i = 0; i < n; i++) {
      this.simulation.tick();
    }
  }
}
