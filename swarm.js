class Swarm {
  constructor(swarmId) {
    this.swarmId = swarmId;
    this.over = false;
    this.snodes = {};
    this.r = 80;
    this.col = {r: 70, g: 70, b: 70};

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

  // Check if mouse is over the swarm
  rollover(px, py) {
    let d = dist(px, py, this.x, this.y);
    this.over = d < this.r;
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
