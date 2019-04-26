const swarmRadius = 60;

class Swarm {
  constructor(swarmId) {
    this.swarmId = swarmId;
    this.over = false;
    this.snodes = {};
    this.r = swarmRadius;
    this.col = {r: 70, g: 70, b: 70};
    this.angleFuzz = random() * 2 * PI;

    while(true) {
      let overlapping = false;
      this.x = random(this.r, width - this.r);
      this.y = random(this.r, height - this.r);

      Object.keys(swarms).forEach(otherId => {
        const other = swarms[otherId];
        const d = dist(this.x, this.y, other.x, other.y);
        if (d < this.r + other.r + 6) {
          overlapping = true;
        }
      });
      if (!overlapping) {
        break;
      }
    }
  }

  getSnodeLocation(address) {
    let pos = {
      x: 0,
      y: 0,
    };

    const idx = Object.keys(this.snodes).indexOf(address);
    const numSnodes = Object.keys(this.snodes).length;
    if (idx === -1) return pos;

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
    const snode = this.snodes[snodeAddress];
    const newSwarm = swarms[newSwarmId];
    if (!snode || !newSwarm) return;
    newSwarm.snodes[snodeAddress] = snode;
    delete this.snodes[snodeAddress];
  }

  alignSnodes() {
    Object.keys(this.snodes).forEach(snodeAddress => {
      const newPos = this.getSnodeLocation(snodeAddress);
      this.snodes[snodeAddress].desiredX = newPos.x;
      this.snodes[snodeAddress].desiredY = newPos.y;
    });
  }

  display() {
    fill(this.col.r, this.col.g, this.col.b, 10);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
    let alreadyText = false;
    Object.keys(this.snodes).forEach(address => {
      this.snodes[address].rollover(mouseX, mouseY);
      this.snodes[address].display();
    });
    if (this.over) {
      fill(0);
      textAlign(CENTER);
      text(this.swarmId, this.x, this.y + this.r + 20);
    }
  }
}
