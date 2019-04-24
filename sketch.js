/*jshint esversion: 8 */
// const fetch = require('node-fetch');

let swarms = {};
// const serviceNodes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const testSnodes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
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

let protect = 0;

const createSwarms = async () => {
  const params = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ method: 'get_service_nodes' }),
  }
  const response = await fetch(lokidUrl, params);
  let serviceNodes;
  if (!response.headers.get('Content-Type') === 'application/json') {
    return;
  }

  responseJson = await response.json();
  const snodeList = JSON.parse(responseJson.result.as_json);
  snodeList.forEach(snodeData => {
    const pubkey = snodeData.pubkey;
    const swarmId = snodeData.info.swarm_id;
    if (!Object.keys(swarms).includes(swarmId.toString())) {
      let x, y, r;
      while(true && protect < 1000) {
        let overlapping = false;
        protect += 1;
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
    const swarmX = swarms[swarmId].x;
    const swarmY = swarms[swarmId].y;
    const snodes = swarms[swarmId].snodes;
    let x, y, r;
    while(true && protect < 1000) {
      let overlapping = false;
      protect += 1;
      const a = random() * 2 * PI;
      r = swarmRadius * Math.sqrt(random()) - snodeRadius * 2;
      x = r * Math.cos(a) + swarmX;
      y = r * Math.sin(a) + swarmY;

      Object.keys(swarms[swarmId].snodes).forEach(pubkey => {
        const other = swarms[swarmId].snodes[pubkey];
        const d = dist(x, y, other.x, other.y);
        if (d < snodeRadius + snodeRadius + 6) {
          overlapping = true;
        }
      });
      if (!overlapping) {
        break;
      }
    }
    const snode = {
      x,
      y,
      r: snodeRadius,
      state: stateEnum.default,
    }
    swarms[swarmId].snodes[pubkey] = snode;
  });
}

const drawSnodes = swarm => {
  Object.keys(swarm.snodes).forEach(pubkey => {
    const snode = swarm.snodes[pubkey];
    const col = snodeCols[snode.state];
    fill(col.r, col.g, col.b, 100);
    ellipse(snode.x, snode.y, snodeRadius * 2, snodeRadius * 2);
  });
}

const updateSnodes = () => {

}

var setup = async () => {
  createCanvas(1000, 800);
  frameRate(1);
  await createSwarms();
}

var draw = () => {
  clear()
  console.log('Frame');
  // Draw all the swarms
  Object.keys(swarms).forEach(swarmId => {
    const swarm = swarms[swarmId];
    fill(swarmCol.r, swarmCol.g, swarmCol.b, 10);
    ellipse(swarm.x, swarm.y, swarm.r * 2, swarm.r * 2);
    drawSnodes(swarm);
  })
}
