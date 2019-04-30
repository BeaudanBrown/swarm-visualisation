const clientRadius = 20;

const clientStateEnum = {
  default: 0,
  clientSend: 1,
  clientRetrieve: 2,
  clientP2pSend: 3,
};

const clientCols = {
  [clientStateEnum.default]: {r: 235, g: 206, b: 50},
  [clientStateEnum.clientSend]: snodeCols[snodeStateEnum.snodeStore],
  [clientStateEnum.clientP2pSend]: {r: 135, g: 206, b: 150},
  [clientStateEnum.clientRetrieve]: snodeCols[snodeStateEnum.snodeRetrieve],
};

class Client {
  constructor(clientId) {
    this.clientId = clientId;
    this.over = false;
    this.r = clientRadius;
    this.state = clientStateEnum.default;
    this.x = 0;
    this.y = 0;
    this.statePromise = Promise.resolve();
  }

  // Check if mouse is over the swarm
  rollover(px, py) {
    let d = dist(px, py, this.x, this.y);
    this.over = d < this.r;
  }

  setPosition(pos) {
    this.x = pos.x;
    this.desiredX = pos.x;
    this.y = pos.y;
    this.desiredY = pos.y;
  }

  setState(newState) {
    this.state = clientStateEnum[newState];
  }

  lerpPosition() {
    this.x = lerp(this.x, this.desiredX, 0.1);
    this.y = lerp(this.y, this.desiredY, 0.1);
  }

  display() {
    if (this.x !== this.desiredX || this.y !== this.desiredY) {
      this.lerpPosition();
    }
    const col = clientCols[this.state];
    fill(col.r, col.g, col.b, 255);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
    if (this.over) {
      fill(0);
      textAlign(CENTER);
      text(this.clientId, this.x, this.y + this.r + 20);
    }
  }
}
