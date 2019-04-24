class Snode {
  constructor(swarm, pubkey) {
    const swarmX = swarm.x;
    const swarmY = swarm.y;
    const snodes = swarm.snodes;
    while(true) {
      let overlapping = false;
      const a = random() * 2 * PI;
      const r = swarmRadius * Math.sqrt(random()) - snodeRadius * 2;
      this.x = r * Math.cos(a) + swarmX;
      this.y = r * Math.sin(a) + swarmY;

      Object.keys(snodes).forEach(pubkey => {
        const other = snodes[pubkey];
        const d = dist(this.x, this.y, other.x, other.y);
        if (d < snodeRadius + snodeRadius + 6) {
          overlapping = true;
        }
      });
      if (!overlapping) {
        break;
      }
    }
    this.r = snodeRadius;
    this.diameter = 2 * snodeRadius;
    this.pubkey = pubkey;
    this.state = stateEnum.default;

    this.over = false;
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
