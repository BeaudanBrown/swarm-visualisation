const clientRadius = 20;

const clientStateEnum = {
  default: 0,
  sendMessage: 1,
  retrieveMessage: 2,
};

const clientCols = {
  [clientStateEnum.default]: {r: 235, g: 206, b: 50},
  [clientStateEnum.sendMessage]: snodeCols[snodeStateEnum.clientMessage],
  [clientStateEnum.retrieveMessage]: snodeCols[snodeStateEnum.clientRetrieve],
};

class Client {
  constructor(clientId) {
    this.clientId = clientId;
    this.over = false;
    this.r = clientRadius;
    this.state = clientStateEnum.default;
    this.x = 0;
    this.y = 0;
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

  lerpPosition() {
    this.x = lerp(this.x, this.desiredX, 0.1);
    this.y = lerp(this.y, this.desiredY, 0.1);
  }

  display() {
    if (this.x !== this.desiredX || this.y !== this.desiredY) {
      this.lerpPosition();
    }
    const col = clientCols[this.state];
    fill(col.r, col.g, col.b, 100);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
    if (this.over) {
      fill(0);
      textAlign(CENTER);
      text(this.clientId, this.x, this.y + this.r + 20);
    }
  }
}
