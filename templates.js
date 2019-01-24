let tiles = data => ({name:"", treversable:true, speed:1, food:0, foodregen:0, foodcap:0, harmful:false, damage:0, ...data})

templates = {
  tiles: [tiles({name:"normal"}),
          tiles({name:"block", treversable:false}),
          tiles({name:"food", food:10, foodregen:1, foodcap:100}),
          tiles({name:"lava", speed:.5, harmful:true, damage:1})],
}

getTile = name => templates.tiles.reduce((a, t) => t.name === name ? t : a, tiles())
getTileColor = tile => {
  switch (tile.name){
    case 'normal' : return [.8,.8,.8]
    case 'block'  : return [0,0,0]
    case 'lava'   : return [1,0,0]
    case 'food'   : return (x => [0,x,.1*x])(.2 + logistic(tile.food)-.5)
    default       : return [.1,.1,.1]
  }
}

Sensor = (type, arg1, arg2) => {
  switch (type){
    case 'base': return (world, entitie) => getTileColor(world.tiles[entitie.x|0][entitie.y|0])
    case 'hunger'   : return (_, entitie) => [entitie.hunger]
    case 'health'   : return (_, entitie) => [entitie.health]
    case 'vision'   : return (world, entitie) => [0,0,0,0]
    case 'nextTile' : return (world, entitie) => getTileColor(world.tiles[(entitie.y + Math.sin(entitie.heding))|0][(entitie.x + Math.cos(entitie.heding))|0])
    case 'memory'   : return (_, entitie) => entitie.memory
    default         : return (_, __) => []
  }
}

randomName = () => randomFrom(['Bob','Elisa','Rayan','Marc','Paul','Tom','Peter','Josh','Samuel','Kunegunda','Lucas','Casanova','Zorro','Slanderman','Agent700','Legolas','Leonidas','JanIIISobieski','Adolf','Jozef','CiasteczkowyPotwor','Batman','Pigeon','Filemon','Superman','Spiderman','Slodziak','Putin','Trump','Dyktator','Boss','King','Melodias','Lufy','Ban','Naruto','Kakashi','Bolt'])(0)
