/*jshint esversion: 8 */

let swarms = {};
let clients = {};
const baseUrl = '13.236.173.190';
const port = '38157';
const lokidUrl = `http://${baseUrl}:${port}/json_rpc`;
const eventUrl = `http://${baseUrl}:${port}/get_events`;

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

const getClientPos = (clientId) => {
  let pos = {
    x: -1,
    y: -1,
  }
  const idx = Object.keys(clients).indexOf(clientId);
  const numClients = Object.keys(clients).length;
  const d = width / (numClients + 1);
  if (idx === -1) return pos;
  pos.y = height - clientRadius * 2;
  pos.x = (idx + 1) * d;
  return pos;
}

const getEvents = async () => {
  const response = await httpGet(eventUrl, 'json')
  let needAlign = false;
  response.events.forEach(event => {
    const { swarm_id, snode_id, event_type, other_id } = event;
    print(`Got ${event_type} event from ${snode_id}`);
    switch (event_type) {
      case 'changedSwarm':
        {
          const swarm = swarms[swarm_id];
          swarm.migrate(snode_id, other_id);
          needAlign = true;
          break;
        }
      case 'clientStart':
        {
          if (Object.keys(clients).includes(snode_id)) return;
          clients[snode_id] = new Client(snode_id);
          const newPos = getClientPos(snode_id);
          clients[snode_id].setPosition(newPos);

          Object.keys(clients).forEach(clientId => {
            const client = clients[clientId];
            const pos = getClientPos(clientId);
            client.desiredX = pos.x;
            client.desiredY = pos.y;
          })
          break;
        }
      case 'clientMessage':
        {
          const swarm = swarms[swarm_id];
          swarm.migrate(snode_id, other_id);
          needAlign = true;
          break;
        }
      default:
        {
          const swarm = swarms[swarm_id];
          if (!swarm) return;
          const snode = swarm.snodes[snode_id];
          if (!snode) return;
          snode.setState(event_type);
          break;
        }
    }
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
  createCanvas(1000, 1000);
  frameRate(30);
  init();
}

var draw = () => {
  clear()
  // Draw all the clients
  Object.keys(clients).forEach(clientId => {
    clients[clientId].rollover(mouseX, mouseY);
    clients[clientId].display();
  })
  // Draw all the swarms
  Object.keys(swarms).forEach(swarmId => {
    swarms[swarmId].rollover(mouseX, mouseY);
    swarms[swarmId].display();
  })
}
