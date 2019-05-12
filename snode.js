const snodeRadius = 10;

const snodeStateEnum = {
  default: 0,
  snodeStore: 1,
  snodePush: 2,
  snodeRetrieve: 3,
  changedSwarm: 4,
  snodePushed: 5,
};

const snodeCols = {
  [snodeStateEnum.default]: {r: 0, g: 133, b: 34},
  [snodeStateEnum.snodeStore]: {r: 51, g: 255, b: 51},
  [snodeStateEnum.snodeRetrieve]: {r: 204, g: 0, b: 204},
  [snodeStateEnum.snodePush]: {r: 0, g: 0, b: 153},
  [snodeStateEnum.snodePushed]: {r: 51, g: 51, b: 255},
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
    this.statePromise = Promise.resolve();
  }

  // Check if mouse is over the snode
  rollover(px, py) {
    let d = dist(px, py, this.x, this.y);
    this.over = d < this.r;
  }

  setState(newState) {
    this.state = snodeStateEnum[newState];
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
  }

  // Display hover text
  displayText() {
    if (this.over) {
      fill(255);
      textAlign(CENTER);
      text(`Service Node Address: ${this.address.substring(0, 5)}...${this.address.substring(this.address.length - 9, this.address.length)}`, this.x, this.y + this.r + 20);
    }
  }
}
