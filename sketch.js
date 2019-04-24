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

const init = async () => {
  const response = await httpPost(lokidUrl, 'json', { method: 'get_service_nodes' })

  const snodeList = JSON.parse(response.result.as_json);
  snodeList.forEach(snodeData => {
    const pubkey = snodeData.pubkey;
    const swarmId = snodeData.info.swarm_id;
    if (!Object.keys(swarms).includes(swarmId.toString())) {
      swarms[swarmId] = new Swarm(swarmId);
    }
    const swarm = swarms[swarmId];
    if (!Object.keys(swarms[swarmId]).includes(pubkey)) {
      swarm.snodes[pubkey] = new Snode(swarm, pubkey);
    }
  });
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
    swarms[swarmId].rollover(mouseX, mouseY);
    swarms[swarmId].display();
  })
}
