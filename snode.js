const stateEnum = {
  default: 0,
  clientMessage: 1,
  snodeMessage: 2,
};

const snodeCols = {
  [stateEnum.default]: {r: 135, g: 206, b: 250},
  [stateEnum.clientMessage]: {r: 106, g: 255, b: 142},
  [stateEnum.snodeMessage]: {r: 106, g: 55, b: 255},
};

class Snode {
  constructor(swarm, pubkey) {
    this.r = 10;
    this.diameter = 2 * this.r;
    this.pubkey = pubkey;
    this.state = stateEnum.default;
    this.over = false;

    const swarmX = swarm.x;
    const swarmY = swarm.y;
    const swarmRadius = swarm.r;
    const snodes = swarm.snodes;

    while(true) {
      let overlapping = false;
      const a = random() * 2 * PI;
      const r = swarmRadius * Math.sqrt(random()) - this.r * 2;
      this.x = r * Math.cos(a) + swarmX;
      this.y = r * Math.sin(a) + swarmY;

      Object.keys(snodes).forEach(pubkey => {
        const other = snodes[pubkey];
        const d = dist(this.x, this.y, other.x, other.y);
        if (d < this.r + this.r + 6) {
          overlapping = true;
        }
      });
      if (!overlapping) {
        break;
      }
    }
  }

  // Check if mouse is over the snode
  rollover(px, py) {
    let d = dist(px, py, this.x, this.y);
    this.over = d < this.r;
  }

  // Display the Snode
  display() {
    const col = snodeCols[this.state];
    fill(col.r, col.g, col.b, 100);
    ellipse(this.x, this.y, this.diameter, this.diameter);
    if (this.over) {
      fill(0);
      textAlign(CENTER);
      text(this.pubkey, this.x, this.y + this.r + 20);
    }
  }
}
