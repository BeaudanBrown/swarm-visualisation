/*jshint esversion: 8 */

let swarms = {};
const baseUrl = '13.236.173.190';
const lokidPort = '38157';
const lokidUrl = `http://${baseUrl}:${lokidPort}/json_rpc`;

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
