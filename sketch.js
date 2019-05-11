/*jshint esversion: 8 */

let swarms = [];
let clients = [];
let events = [];
let eventLoop = Promise.resolve();
let arrows = [];
const baseUrl = '13.236.173.190';
const port = '22023';
const lokidUrl = `http://${baseUrl}:${port}/json_rpc`;
const eventUrl = `http://${baseUrl}:${port}/get_events`;
const stateTimer = 500;

const init = async () => {
  const initRequest = {
    method: 'get_service_nodes'
  };

  const response = await httpPost(lokidUrl, 'json', initRequest);

  const snodeList = response.result.service_node_states;
  snodeList.forEach(snodeData => {
    const addressBuf = Multibase.Buffer.from(snodeData.service_node_pubkey, 'hex');
    const address = Multibase.encode(
      'base32z',
      addressBuf
    ).toString().substr(1) + '.snode';

    const swarmId = snodeData.swarm_id.toString();
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

const drawLegend = () => {
  // Legend background
  fill(255, 255, 255, 255);
  rect(50, 50, 200, 200, 10);
  // Default client
  let col = clientCols[clientStateEnum.default];
  fill(col.r, col.g, col.b, 255);
  rect(60, 60, 20, 20, 2);
  // Store message
  col = snodeCols[snodeStateEnum.snodeStore];
  fill(col.r, col.g, col.b, 255);
  rect(60, 90, 20, 20, 2);
  // Send p2p message
  col = clientCols[clientStateEnum.clientP2pSend];
  fill(col.r, col.g, col.b, 255);
  rect(60, 120, 20, 20, 2);
  // Retrieve message
  col = clientCols[clientStateEnum.clientRetrieve];
  fill(col.r, col.g, col.b, 255);
  rect(60, 150, 20, 20, 2);
  // Snode push message
  col = snodeCols[snodeStateEnum.snodePush];
  fill(col.r, col.g, col.b, 255);
  rect(60, 180, 20, 20, 2);
  // Snode push message
  col = snodeCols[snodeStateEnum.snodePushed];
  fill(col.r, col.g, col.b, 255);
  rect(60, 210, 20, 20, 2);
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
    arrows = [];
  }
}

const getEvents = async () => {
  let response;
  try {
    response = await httpGet(eventUrl, 'json')
  } catch(e) {
    print(`Error fetching events: ${e}`);
    await sleep(200);
    return getEvents();
  }
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
          const client = clients.find(client => client.clientId === this_id);
          if (!client) return;
          const destination = clients.find(client => client.clientId === other_id);
          if (!destination) return;
          eventLoop = eventLoop.then(async () => addEvent(client, 'clientP2pSend', destination, 'clientP2pSend'));
          break;
        }
      case 'clientSend':
        {
          const client = clients.find(client => client.clientId === this_id);
          if (!client) return;
          let destination;
          let destinationSwarm;
          swarms.forEach(swarm => {
            const possibleDestination = swarm.snodes.find(snode => snode.address === other_id);
            if (possibleDestination) {
              destination = possibleDestination;
              destinationSwarm = swarm;
            }
          });

          eventLoop = eventLoop.then(async () => addEvent(client, 'clientSend', destination, 'snodeStore'));
          if (destination) {
            destinationSwarm.snodes.forEach(otherSnode => {
              if (otherSnode.address === this_id) return;
              eventLoop = eventLoop.then(async () => addEvent(destination, 'snodePush', otherSnode, 'snodePush'));
            });
          }
          break;
        }
      case 'clientRetrieve':
        {
          const client = clients.find(client => client.clientId === this_id);
          if (!client) return;
          let destination;
          swarms.forEach(swarm => {
            const possibleDestination = swarm.snodes.find(snode => snode.address === other_id);
            if (possibleDestination) {
              destination = possibleDestination;
            }
          });
          eventLoop = eventLoop.then(async () => addEvent(client, 'clientRetrieve', destination, 'snodeRetrieve'));
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
  return getEvents();
}

var setup = () => {
  createCanvas(1200, 900);
  frameRate(30);
  init();
  textSize(24);
}

var draw = () => {
  clear();
  background(100);
  drawLegend();
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
  // Draw all the swarms hover text
  swarms.forEach(swarm => {
    swarm.displayText();
  });
  // Draw all the snodes hover text
  swarms.forEach(swarm => {
    swarm.snodes.forEach(snode => {
      snode.displayText();
    })
  })
  // Draw all the clients hover text
  clients.forEach(client => {
    client.displayText();
  });
}

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
