const snodeRadius = 10;

const snodeStateEnum = {
  default: 0,
  clientMessage: 1,
  snodeMessage: 2,
  clientRetrieve: 3,
  changedSwarm: 4,
};

const snodeCols = {
  [snodeStateEnum.default]: {r: 135, g: 206, b: 250},
  [snodeStateEnum.clientMessage]: {r: 0, g: 255, b: 0},
  [snodeStateEnum.clientRetrieve]: {r: 255, g: 255, b: 0},
  [snodeStateEnum.snodeMessage]: {r: 106, g: 55, b: 255},
};

class Snode {
  constructor(swarm, address) {
    this.r = snodeRadius;
    this.address = address;
    this.state = snodeStateEnum.default;
    this.over = false;
    this.resetTimer = null;

    this.desiredX = this.x;
    this.desiredY = this.y;
  }

  // Check if mouse is over the snode
  rollover(px, py) {
    let d = dist(px, py, this.x, this.y);
    this.over = d < this.r;
  }

  setState(newState) {
    clearTimeout(this.resetTimer);
    this.state = snodeStateEnum[newState];
    this.resetTimer = setTimeout(() => {
      this.state = snodeStateEnum.default;
    }, 1000)
  }

  setPosition(pos) {
    this.x = pos.x;
    this.desiredX = pos.x;
    this.y = pos.y;
    this.desiredY = pos.y;
  }

  lerpPosition() {
    this.x = lerp(this.x, this.desiredX, 0.1);
    this.y = lerp(this.y, this.desiredY, 0.1);
  }

  // Display the Snode
  display() {
    const col = snodeCols[this.state];
    if (this.x !== this.desiredX || this.y !== this.desiredY) {
      this.lerpPosition();
    }
    fill(col.r, col.g, col.b, 255);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
    if (this.over) {
      fill(0);
      textAlign(CENTER);
      text(this.address, this.x, this.y + this.r + 20);
    }
  }
}
