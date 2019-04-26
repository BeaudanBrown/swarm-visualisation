const snodeRadius = 10;

const stateEnum = {
  default: 0,
  clientMessage: 1,
  snodeMessage: 2,
  clientRetrieve: 3,
};

const snodeCols = {
  [stateEnum.default]: {r: 135, g: 206, b: 250},
  [stateEnum.clientMessage]: {r: 0, g: 255, b: 0},
  [stateEnum.clientRetrieve]: {r: 255, g: 255, b: 0},
  [stateEnum.snodeMessage]: {r: 106, g: 55, b: 255},
};

class Snode {
  constructor(swarm, address) {
    this.r = snodeRadius;
    this.diameter = 2 * this.r;
    this.address = address;
    this.state = stateEnum.default;
    this.over = false;
    this.resetTimer = null;

    const {x, y} = swarm.getSnodeLocation();
    this.x = x;
    this.y = y;
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
    this.state = stateEnum[newState];
    this.resetTimer = setTimeout(() => {
      this.state = stateEnum.default;
    }, 1000)
  }

  lerpPosition() {
    this.x = lerp(this.x, this.desiredX, 0.05);
    this.y = lerp(this.y, this.desiredY, 0.05);
  }

  // Display the Snode
  display() {
    const col = snodeCols[this.state];
    if (this.x !== this.desiredX || this.y !== this.desiredY) {
      this.lerpPosition();
    }
    fill(col.r, col.g, col.b, 255);
    ellipse(this.x, this.y, this.diameter, this.diameter);
    if (this.over) {
      fill(0);
      textAlign(CENTER);
      text(this.address, this.x, this.y + this.r + 20);
    }
  }
}
