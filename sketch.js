/*jshint esversion: 8 */

let swarms = {};
const swarmRadius = 80;
const snodeRadius = 10;
const propCol = {r: 106, g: 55, b: 255};
const messageCol = {r: 106, g: 255, b: 142};
const swarmCol = {r: 70, g: 70, b: 70};
const snodeCol = {r: 135, g: 206, b: 250};
const lokidUrl = 'http://13.236.173.190:38157/json_rpc';

const stateEnum = {
  default: 0,
  clientMessage: 1,
  snodeMessage: 2,
};

const snodeCols = {
  [stateEnum.default]: snodeCol,
  [stateEnum.clientMessage]: messageCol,
  [stateEnum.snodeMessage]: propCol,
};

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
    this.radius = snodeRadius;
    this.diameter = 2 * snodeRadius;
    this.pubkey = pubkey;
    this.state = stateEnum.default;

    this.over = false;
  }

  // Check if mouse is over the snode
  rollover(px, py) {
    let d = dist(px, py, this.x, this.y);
    this.over = d < this.radius;
  }

  // Display the Bubble
  display() {
    const col = snodeCols[this.state];
    fill(col.r, col.g, col.b, 100);
    ellipse(this.x, this.y, this.diameter, this.diameter);
    if (this.over) {
      fill(0);
      textAlign(CENTER);
      text(this.pubkey, this.x, this.y + this.radius + 20);
    }
  }
}

const createSwarm = (swarmId) => {
  let x, y, r;
  while(true) {
    let overlapping = false;
    x = random(swarmRadius, width - swarmRadius);
    y = random(swarmRadius, height - swarmRadius);
    r = swarmRadius;

    Object.keys(swarms).forEach(swarmId => {
      const other = swarms[swarmId];
      const d = dist(x, y, other.x, other.y);
      if (d < r + other.r + 6) {
        overlapping = true;
      }
    });
    if (!overlapping) {
      break;
    }
  }

  let swarm = {
    x,
    y,
    r,
    snodes: []
  }
  swarms[swarmId] = swarm;
}

const init = async () => {
  const response = await httpPost(lokidUrl, 'json', { method: 'get_service_nodes' })

  const snodeList = JSON.parse(response.result.as_json);
  snodeList.forEach(snodeData => {
    const pubkey = snodeData.pubkey;
    const swarmId = snodeData.info.swarm_id;
    if (!Object.keys(swarms).includes(swarmId.toString())) {
      createSwarm(swarmId);
    }
    const swarm = swarms[swarmId];
    if (!Object.keys(swarms[swarmId]).includes(pubkey)) {
      swarm.snodes[pubkey] = new Snode(swarm, pubkey);
    }
  });
}

const drawSnodes = swarm => {
  Object.keys(swarm.snodes).forEach(pubkey => {
    swarm.snodes[pubkey].rollover(mouseX, mouseY);
    swarm.snodes[pubkey].display();
  });
}

const updateSnodes = () => {

}

var setup = async () => {
  init();
  createCanvas(1000, 800);
  frameRate(10);
}

var draw = () => {
  clear()
  // Draw all the swarms
  Object.keys(swarms).forEach(swarmId => {
    const swarm = swarms[swarmId];
    fill(swarmCol.r, swarmCol.g, swarmCol.b, 10);
    ellipse(swarm.x, swarm.y, swarm.r * 2, swarm.r * 2);
    drawSnodes(swarm);
  })
}
