const swarmRadius = 60;

class Swarm {
  constructor(swarmId) {
    this.swarmId = swarmId;
    this.over = false;
    this.snodes = [];
    this.r = swarmRadius;
    this.col = {r: 255, g: 255, b: 255};
    this.angleFuzz = random() * 2 * PI;
    this.x = 0;
    this.y = 0;
  }

  getSnodeLocation(address) {
    let pos = {
      x: 0,
      y: 0,
    };

    const idx = this.snodes.findIndex(snode => snode.address === address);
    if (idx === -1) return pos;
    const numSnodes = this.snodes.length;

    const r = this.r * 0.15 * numSnodes;
    const a = this.angleFuzz + (idx + 1) / numSnodes * 2 * PI;
    pos.x = r * Math.cos(a) + this.x;
    pos.y = r * Math.sin(a) + this.y;

    return pos;
  }

  // Check if mouse is over the swarm
  rollover(px, py) {
    let d = dist(px, py, this.x, this.y);
    this.over = d < this.r;
  }

  migrate(snodeAddress, newSwarmId) {
    const snode = this.snodes.find(snode => snode.address === snodeAddress);
    const newSwarm = swarms.find(swarm => swarm.swarmId === newSwarmId);
    if (!snode || !newSwarm) return;
    newSwarm.snodes.push(snode);
    const idx = this.snodes.findIndex(snode => snode.address === snodeAddress);
    this.snodes.splice(idx, 1);
  }

  alignSnodes() {
    this.snodes.forEach(snode => {
      const newPos = this.getSnodeLocation(snode.address);
      snode.desiredX = newPos.x;
      snode.desiredY = newPos.y;
    });
  }

  display() {
    fill(this.col.r, this.col.g, this.col.b, 10);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
    if (this.over) {
      fill(0);
      textAlign(CENTER);
      text(this.swarmId, this.x, this.y + this.r + 20);
    }
  }
}
