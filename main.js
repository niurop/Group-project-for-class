function main(){

}



{
  let width = 10; let height = 10
  let Sensors = [Sensor('base'), Sensor('vision', 0, 2), Sensor('vision', .1, 2), Sensor('vision', -.1, 2), Sensor('health'), Sensor('hunger'), Sensor('memory')]
  let Input = [3,4,4,4,1,1,5]
  let Output = [1,2,1,1,5]
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
  let entitieUpdate = dt => (world, entitie) => {
    if(!entitie.alive) return entitie
    let decisions = calculateNN(world, entitie)
    let memory = decisions.splice(-entitie.memory.length)
    let go = decisions[0]
    let rotate = decisions[1]-decisions[2]
    let multiply = decisions[3]
    let eat = decisions[4]
    return {...entitie, memory: memory}
  }
  updateWorld = World => ({...World, tiles: mapN(2, tileUpdate(World.phisics.dt), World.tiles)})
  
  world = {
    entities: entities,
    lastId: entities.length,
    tiles: mapN(2, I => I[0] === 0 || I[1] === 0 || I[0] === width-1 || I[1] === height-1 ? getTile('block') : getTile('food'), range2(height, width)),
    width: width,
    height: height,
    phisics: {dt: 0.1}
  }
}

calculateSensors = (sensors, world, entitie) => sensors.flatMap(f => f(world, entitie))
calculateNN = (world, entitie) => NNfromdata(entitie.NNdata)(calculateSensors(entitie.sensors, world, entitie))


drawWorld = world => {
  let sx = 10, sy = 10, Tiles = mapN(2, getTileColor, world.tiles)
  log(Tiles)
}
