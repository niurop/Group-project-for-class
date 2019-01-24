function main(){

}

{
  let width = 10
  let height = 10
  let Sensors = [Sensor('base'), Sensor('nextTile', 0), Sensor('health'), Sensor('hunger'), Sensor('memory')]
  let Input = [3,3,1,1,3]
  let Output = [1,2,1,1,3]
  let ActivationF = [logistic]
  let entities = range(1000).map(i => ({
    name: randomName(),
    sensors: Sensors,
    memory: range(Input[Input.length-1]).fill(0),
    NNdata: randomNNdata(sumV(Input), [], sumV(Output), ActivationF),
    hunger: .5,
    health: 1,
    id: i,
    heding: 0,
    x: width/2,
    y: height/2,
    childOf: -1,
    generation: 0,
    timeAlive: 0,
    alive: true
  }))

  world = {
    entities: entities,
    lastId: entities.length,
    tiles: mapN(2, I => I[0] === 0 || I[1] === 0 || I[1] === width-1 || I[0] === height-1 ? {...getTile('block')} : {...getTile('food')}, range2(height, width)),
    width: width,
    height: height,
    physics: {dt:.1, multiplyCost:.5, rotateCost:.05, movementCost:.1, eatCost:0, defaulCost: 0, epsilon: 0.01, multiplyDecision: 0.5, multiplyRequirements: e => e.hunger > 0.5}
  }

  calculateSensors = (sensors, world, entity) => sensors.flatMap(f => f(world, entity))
  calculateNN = (world, entity) => NNfromdata(entity.NNdata)(calculateSensors(entity.sensors, world, entity))

  let tileUpdate = dt => tile => ({...tile, food: clamp(0, tile.foodcap)(tile.food + dt * tile.foodregen)})
  var entityDecisions = world =>  entity => {
    if(!entity.alive) return {cost: 0, memory: entity.memory, eat: 0, angle: entity.angle, ex: entity.x, x: entity.x, ey: entity.y, y: entity.y, multiply: 0}
    let tile = world.tiles[entity.y|0][entity.x|0]
    let decisions = calculateNN(world, entity)
    let go = decisions[0] * tile.speed
    let rotate = (decisions[1] - decisions[2])
    let angle = (entity.heding + rotate * world.physics.dt + 2) % 2
    let mx = entity.x + cos(angle) * go * world.physics.dt
    let my = entity.y + sin(angle) * go * world.physics.dt
    let nextTile = world.tiles[my|0][mx|0]
    let multiply = decisions[3] > world.physics.multiplyDecision & world.physics.multiplyRequirements(entity)
    let hunger = decisions[0] * world.physics.movementCost + rotate * world.physics.rotateCost + decisions[4] * world.physics.eatCost + world.physics.defaulCost
    return {
      cost: hunger * world.physics.dt + multiply * world.physics.multiplyCost,
      memory: decisions.splice(-entity.memory.length),
      eat: decisions[4] * world.physics.dt,
      ex: entity.x|0,
      ey: entity.y|0,
      angle: angle,
      x: nextTile.traversable ? mx : entity.x,
      y: nextTile.traversable ? my : entity.y,
      multiply: multiply
    }
  }


  var updateworld = world => {
   let decisions = world.entities.map(e => entityDecisions(world)(e))
   let tiles = world.tiles
   let food = (x, y) => tiles[y][x].food
   let tileEaters = abstractionClass(
     decisions.map(D => [D.ex, D.ey, D.eat]),
     (x,y) => x[0] === y[0] && x[1] === y[1]
   ).flatMap(
     A => ({x: A[0][0], y: A[0][1], v: sumV(A.map(a=>a[2]))})
   ).map(
     a => ({
       x: a.x,
       y: a.y,
       m: min(food(a.x, a.y) / a.v, 1),
       tileLeft: food(a.x, a.y) > a.v? food(a.x, a.y) - a.v : 0})
   )
   let newDecisions = decisions.map(D => ({...D, eat: tileEaters.find(T => T.x === D.ex && T.y === D.ey).m * D.eat}))

   tileEaters.map(i => tiles[i.y][i.x].food = i.tileLeft)
   tiles = mapN(2, tileUpdate(world.physics.dt), tiles)

   let entities = zipWith(world.entities, newDecisions, (e, d) => {
     let hunger = e.hunger - d.cost + d.eat
     let health = e.health + (hunger < 0 ? hunger : hunger > .5 ? hunger - .5 : 0) - tiles[e.y|0][e.x|0].harmful * tiles[e.y|0][e.x|0].damage * world.physics.dt
     return {
       ...e,
       hunger: clamp(0,1)(hunger),
       x: d.x,
       y: d.y,
       heding: d.angle,
       memory: d.memory,
       health: clamp(0,1)(health),
       alive: health > 0,
       timeAlive: e.timeAlive + world.physics.dt
     }}
   )

   let toMultiply = zipWith(world.entities, newDecisions, (e, d) => [e, d.multiply]).filter(e => e[1]).map(e => e[0])
   let slightnudgeNNEpsilon = slightnudgeNN(world.physics.epsilon)
   let newBorn = toMultiply.map((e, i) => ({
     name: randomName(),
     sensors: Sensors,
     memory: [...e.memory],
     NNdata: slightnudgeNNEpsilon(e.NNdata, randomNNdata(sumV(Input), [], sumV(Output), ActivationF)),
     hunger: world.physics.multiplyCost / 2,
     health: 1,
     id: i + world.lastId,
     heding: e.heding,
     x: e.x,
     y: e.y,
     childOf: e.id,
     generation: e.generation + 1,
     timeAlive: 0,
     alive: true
   }))
   return {...world, tiles: tiles, entities: entities.filter(e => e.alive).concat(newBorn), lastId: world.lastId + newBorn.length}
  }
}
