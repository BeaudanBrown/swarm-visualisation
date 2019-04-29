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
    this.destinations = [];
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

  setState(newState, destination=null) {
    if (newState === this.state) {
      if (destination) {
        this.destinations.push(destination)
      }
      return;
    }
    this.statePromise = this.statePromise.then(async () => {
      this.state = clientStateEnum[newState]
      this.destinations = [destination];
      await sleep(stateTimer / 2);
      this.state = clientStateEnum.default;
      this.destinations = [];
    });
  }

  lerpPosition() {
    this.x = lerp(this.x, this.desiredX, 0.1);
    this.y = lerp(this.y, this.desiredY, 0.1);
  }

  displayDestinations() {
    const destination = this.destinations[0];
    if (!destination) return;
    line(this.x, this.y, destination.x, destination.y);
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
