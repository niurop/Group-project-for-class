function main(){

}



{
  let width = 10; let height = 11
  let Sensors = [Sensor('base'), Sensor('nextTile', 0), Sensor('health'), Sensor('hunger'), Sensor('memory')]
  let Input = [3,3,1,1,3]
  let Output = [1,2,1,1,3]
  let NNsize = {I: sumV(Input), D: [], O: sumV(Output), Vs: [], Fs: [logistic]}
  let entities = range(1000).map(i => ({
    name: randomName(),
    sensors: Sensors,
    memory: range(Input[Input.length-1]).fill(0),
    NNsize: NNsize,
    NNdata: randomNNdata(NNsize.I, NNsize.D, NNsize.O, NNsize.Vs, NNsize.Fs),
    hunger: 1, health: 1,
    id: i, heding: 0, x: width/2, y: height/2,
    alive: true
  }))
 
  let tileUpdate = dt => tile => ({...tile, food: clamp(0, tile.foodcap)(tile.food + dt * tile.foodregen)})
  var entitieDecisions = world =>  entitie => {
    if(!entitie.alive) return {cost: 0, memory: entitie.memory, eat: 0, angle: entitie.angle, ex: entitie.x, x: entitie.x, ey: entitie.y, y: entitie.y, multiply: 0}
    let tile = world.tiles[entitie.y|0][entitie.x|0]
    let decisions = calculateNN(world, entitie)
    let go = decisions[0] * tile.speed
    let rotate = (decisions[1] - decisions[2])
    let angle = (entitie.heding + rotate * world.phisics.dt + 2) % 2
    let mx = entitie.x + cos(angle) * go * world.phisics.dt
    let my = entitie.y + sin(angle) * go * world.phisics.dt
    let nextTile = world.tiles[my|0][mx|0]
    let multiply = decisions[3] > world.phisics.multiplyDecision & entitie.hunger > world.phisics.multiplyCost
    let hunger = decisions[0] * world.phisics.movementCost + rotate * world.phisics.rotateCost + decisions[4] * world.phisics.eatCost + world.phisics.defaulCost
    return {
      cost: hunger * world.phisics.dt + multiply * world.phisics.multiplyCost,
      memory: decisions.splice(-entitie.memory.length),
      eat: decisions[4] * world.phisics.dt,
      ex: entitie.x|0,
      ey: entitie.y|0,
      angle: angle,
      x: nextTile.treversable ? mx : entitie.x,
      y: nextTile.treversable ? my : entitie.y,
      multiply: multiply
    }
  }

  
  var updateWorld = World => {
   let decisions = World.entities.map(e => entitieDecisions(World)(e))
   let food = (x, y) => World.tiles[y][x].food
   let tileEters = abstractionClass(
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
   let newDecisions = decisions.map(D => ({...D, eat: tileEters.find(T => T.x === D.ex && T.y === D.ey).m * D.eat}))

   let tiles = World.tiles
   tileEters.map(i => tiles[i.y][i.x].food = i.tileLeft)
   tiles = mapN(2, tileUpdate(World.phisics.dt), tiles)

   let entities = zipWith(World.entities, newDecisions, (e, d) => {
     let hunger = e.hunger - d.cost + d.eat
     let health = e.health + (hunger < 0 ? hunger : hunger > .5 ? hunger - .5 : 0)
     return {
       ...e,
       hunger: clamp(0,1)(hunger),
       x: d.x,
       y: d.y,
       heding: d.angle,
       memory: d.memory,
       health: clamp(0,1)(health),
       alive: health > 0
     }}
   )
   
   let toMultiply = zipWith(World.entities, newDecisions, (e, d) => [e, d.multiply]).filter(e => e[1]).map(e => e[0])
   let newBorn = toMultiply.map((e, i) => ({
     name: randomName(),
     sensors: e.sensors,
     memory: [...e.memory],
     NNsize: e.NNsize,
     NNdata: slightnudgeNN(World.phisics.epsilon)(e.NNdata, randomNNdata(e.NNsize.I, e.NNsize.D, e.NNsize.O, e.NNsize.Vs, e.NNsize.Fs)),
     hunger: 1,
     health: 1,
     id: i + World.lastId, 
     heding: e.heding,
     x: e.x,
     y: e.y,
     alive: true
   }))
   return {...World, tiles: tiles, entities: entities.filter(e => e.alive).concat(newBorn), lastId: World.lastId + newBorn.length}
  }
  
  world = {
    entities: entities,
    lastId: entities.length,
    tiles: mapN(2, I => I[0] === 0 || I[1] === 0 || I[1] === width-1 || I[0] === height-1 ? {...getTile('block')} : {...getTile('food')}, range2(height, width)),
    width: width,
    height: height,
    phisics: {dt:.1, multiplyCost:.5, rotateCost:.05, movementCost:.1, eatCost:0, defaulCost: 0, epsilon: 0.01}
  }
}

calculateSensors = (sensors, world, entitie) => sensors.flatMap(f => f(world, entitie))
calculateNN = (world, entitie) => NNfromdata(entitie.NNdata)(calculateSensors(entitie.sensors, world, entitie))


drawWorld = world => {
  let sx = 10, sy = 10, Tiles = mapN(2, getTileColor, world.tiles)
  log(Tiles)
}
