/*jshint esversion: 8 */

let swarms = {};
const baseUrl = '13.236.173.190';
const port = '38157';
const lokidUrl = `http://${baseUrl}:${port}/json_rpc`;
const eventUrl = `http://${baseUrl}:${port}/get_events`;

const validEvents = Object.keys(stateEnum);

const init = async () => {
  const response = await httpPost(lokidUrl, 'json', { method: 'get_service_nodes' })

  const snodeList = JSON.parse(response.result.as_json);
  snodeList.forEach(snodeData => {
    const addressBuf = Multibase.Buffer.from(snodeData.pubkey, 'hex');
    const address = Multibase.encode(
      'base32z',
      addressBuf
    ).toString().substr(1) + '.snode';

    const swarmId = snodeData.info.swarm_id;
    if (!Object.keys(swarms).includes(swarmId.toString())) {
      swarms[swarmId] = new Swarm(swarmId);
    }
    const swarm = swarms[swarmId];
    if (!Object.keys(swarms[swarmId]).includes(address)) {
      swarm.snodes[address] = new Snode(swarm, address);
    }
  });
  const numSwarms = Object.keys(swarms).length;
  Object.keys(swarms).forEach(swarmId => {
    const swarm = swarms[swarmId];

    const idx = Object.keys(swarms).indexOf(swarmId);

    const r = swarmRadius * 3;
    const a = (idx + 1) / numSwarms * 2 * PI;
    swarm.x = r * Math.cos(a) + width / 2;
    swarm.y = r * Math.sin(a) + height / 2;

    Object.keys(swarm.snodes).forEach(snodeAddress => {
      const pos = swarm.getSnodeLocation(snodeAddress);
      swarm.snodes[snodeAddress].setPosition(pos);
    });
  });
  await getEvents();
}

const getEvents = async () => {
  const response = await httpGet(eventUrl, 'json')
  let needAlign = false;
  response.events.forEach(event => {
    const { swarm_id, snode_id, event_type, other_id } = event;
    print(`Got ${event_type} event from ${snode_id}`);
    if (!validEvents.includes(event_type)) return;
    const swarm = swarms[swarm_id];
    if (!swarm) return;
    const snode = swarm.snodes[snode_id];
    if (!snode) return;
    if (event_type === 'changedSwarm') {
      swarm.migrate(snode_id, other_id);
      needAlign = true;
      return;
    }
    snode.setState(event_type);
  });
  if (needAlign) {
    Object.keys(swarms).forEach(swarmId => {
      swarms[swarmId].alignSnodes();
    });
  }
  setTimeout(() => {
    getEvents();
  }, 200)
}

var setup = () => {
  createCanvas(1000, 800);
  frameRate(30);
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
