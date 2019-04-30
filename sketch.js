/*jshint esversion: 8 */

let swarms = [];
let clients = [];
let events = [];
let eventLoop = Promise.resolve();
let arrows = [];
const baseUrl = '13.236.173.190';
const port = '38157';
const lokidUrl = `http://${baseUrl}:${port}/json_rpc`;
const eventUrl = `http://${baseUrl}:${port}/get_events`;
const stateTimer = 500;

const init = async () => {
  const response = await httpPost(lokidUrl, 'json', { method: 'get_service_nodes' })

  const snodeList = JSON.parse(response.result.as_json);
  snodeList.forEach(snodeData => {
    const addressBuf = Multibase.Buffer.from(snodeData.pubkey, 'hex');
    const address = Multibase.encode(
      'base32z',
      addressBuf
    ).toString().substr(1) + '.snode';

    const swarmId = snodeData.info.swarm_id.toString();
    if (!swarms.map(swarm => swarm.swarmId).includes(swarmId)) {
      swarms.push(new Swarm(swarmId));
    }
    const swarm = swarms.find(swarm => swarm.swarmId === swarmId);
    if (!swarm.snodes.find(snode => snode.address === address)) {
      swarm.snodes.push(new Snode(swarm, address));
    }
  });
  const numSwarms = swarms.length;
  swarms.forEach((swarm, idx) => {
    const r = swarmRadius * 3;
    const a = (idx + 1) / numSwarms * 2 * PI;
    swarm.x = r * Math.cos(a) + width / 2;
    swarm.y = r * Math.sin(a) + height / 2;

    swarm.snodes.forEach(snode => {
      const pos = swarm.getSnodeLocation(snode.address);
      snode.setPosition(pos);
    });
  });
  await getEvents();
}

const getClientPos = (clientId) => {
  let pos = {
    x: -1,
    y: -1,
  }
  const idx = clients.findIndex(client => client.clientId === clientId);
  if (idx === -1) return pos;
  const numClients = clients.length;
  const d = width / (numClients + 1);
  pos.y = height - clientRadius * 3;
  pos.x = (idx + 1) * d;
  return pos;
}

const addEvent = async (origin, originState, destination, destinationState) => {
  origin.setState(originState);
  if (destination) {
    destination.setState(destinationState);
    arrows.push({
      x1: origin.x,
      y1: origin.y,
      x2: destination.x,
      y2: destination.y,
    });
  }
  await sleep(stateTimer);
  origin.setState('default');
  if (destination) {
    destination.setState('default');
  }
  arrows = [];
}

const getEvents = async () => {
  const response = await httpGet(eventUrl, 'json')
  let needAlign = false;
  response.events.forEach(event => {
    const { swarm_id, this_id, event_type, other_id } = event;
    print(`Got ${event_type} event from ${this_id}`);
    switch (event_type) {
      case 'clientStart':
        {
          if (clients.map(client => client.clientId).includes(this_id)) return;
          clients.push(new Client(this_id));
          const newPos = getClientPos(this_id);
          clients[clients.length - 1].setPosition(newPos);

          clients.forEach(client => {
            const pos = getClientPos(client.clientId);
            client.desiredX = pos.x;
            client.desiredY = pos.y;
          })
          break;
        }
      case 'clientP2pSend':
        {
          if (!clients.map(client => client.clientId).includes(this_id)) return;
          const client = clients.find(client => client.clientId === this_id);
          const destination = clients.find(client => client.clientId === other_id);
          eventLoop = eventLoop.then(async () => addEvent(client, 'clientP2pSend', destination, 'clientP2pSend'));
          break;
        }
      case 'clientSend':
        {
          if (!clients.map(client => client.clientId).includes(this_id)) return;
          const client = clients.find(client => client.clientId === this_id);
          let destination;
          swarms.forEach(swarm => {
            const possibleDestination = swarm.snodes.find(snode => snode.address === other_id);
            if (possibleDestination) {
              destination = possibleDestination;
            }
          });
          eventLoop = eventLoop.then(async () => addEvent(client, 'clientSend', destination, 'snodeStore'));
          break;
        }
      case 'snodeRetrieve':
        {
          const swarm = swarms.find(swarm => swarm.swarmId === swarm_id);
          if (!swarm) return;
          const snode = swarm.snodes.find(snode => snode.address === this_id);
          if (!snode) return;
          const destination = clients.find(client => client.clientId === other_id);

          eventLoop = eventLoop.then(async () => addEvent(snode, 'snodeRetrieve', destination, 'clientRetrieve'));
          break;
        }
      case 'snodePush':
        {
          const swarm = swarms.find(swarm => swarm.swarmId === swarm_id);
          if (!swarm) return;
          const snode = swarm.snodes.find(snode => snode.address === this_id);
          if (!snode) return;
          const destination = swarm.snodes.find(snode => snode.address === other_id);

          eventLoop = eventLoop.then(async () => addEvent(snode, 'snodePush', destination, 'snodePush'));
          break;
        }
      case 'changedSwarm':
        {
          const swarm = swarms.find(swarm => swarm.swarmId === swarm_id);
          swarm.migrate(this_id, other_id);
          needAlign = true;
          break;
        }
      default:
        print('Unknown event reported');
        return;
    }
  });
  if (needAlign) {
    swarms.forEach(swarm => swarm.alignSnodes());
  }
  await sleep(200);
  getEvents();
}

var setup = () => {
  createCanvas(1000, 1000);
  frameRate(30);
  init();
}

var draw = () => {
  clear();
  background(100);
  // Draw all the swarms
  swarms.forEach(swarm => {
    swarm.rollover(mouseX, mouseY);
    swarm.display();
  });
  // Draw all the arrows
  arrows.forEach(arrow => {
    line(arrow.x1, arrow.y1, arrow.x2, arrow.y2);
  });
  // Draw all the snodes
  swarms.forEach(swarm => {
    swarm.snodes.forEach(snode => {
      snode.rollover(mouseX, mouseY);
      snode.display();
    })
  })
  // Draw all the clients
  clients.forEach(client => {
    client.rollover(mouseX, mouseY);
    client.display();
  });
}

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
