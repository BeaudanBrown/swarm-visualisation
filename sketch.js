/*jshint esversion: 8 */

let swarms = {};
const baseUrl = '13.236.173.190';
const port = '38157';
const lokidUrl = `http://${baseUrl}:${port}/json_rpc`;
const eventUrl = `http://${baseUrl}:${port}/get_events`;

const validEvents = ["clientMessage"];

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
  await getEvents();
}

const getEvents = async () => {
  const response = await httpGet(eventUrl, 'json')
  response.events.forEach(event => {
    const { swarmId, eventType, snodeId, otherId } = event;
    print(`Got ${eventType} event`);
    if (!validEvents.includes(eventType)) return;
    const swarm = swarms[swarmId];
    if (!swarm) return;
    switch (eventType) {
      case "clientMessage":
        const snode = swarm.snodes[snodeId];
        if (!snode) return;
        snode.gotClientMessage();
        break;
      default:
        break;
    }
  });
  getEvents();
}

var setup = () => {
  createCanvas(1000, 800);
  frameRate(10);
  init();
}

var draw = () => {
  clear()
  // Draw all the swarms
  Object.keys(swarms).forEach(swarmId => {
    swarms[swarmId].rollover(mouseX, mouseY);
    swarms[swarmId].display();
  })
}
