class Swarm {
  constructor(swarmId) {
    this.swarmId = swarmId;
    this.over = false;
    this.snodes = {};
    this.r = swarmRadius;

    while(true) {
      let overlapping = false;
      this.x = random(swarmRadius, width - swarmRadius);
      this.y = random(swarmRadius, height - swarmRadius);

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
    fill(swarmCol.r, swarmCol.g, swarmCol.b, 10);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
    let alreadyText = false;
    Object.keys(this.snodes).forEach(pubkey => {
      this.snodes[pubkey].rollover(mouseX, mouseY);
      this.snodes[pubkey].display();
    });
    if (this.over) {
      fill(0);
      textAlign(CENTER);
      text(this.swarmId, this.x, this.y + this.r + 20);
    }
  }
}