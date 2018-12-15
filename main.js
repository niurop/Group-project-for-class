function main(){
  let world = {}

}

/*
World : (WorldStats, Tiles, Enteties, Phisics, PhisicsSettings)
Entety : (EntetyStats: []R, Sensors: []R, Brain: []([][]R, []R->R), WorldData: []R, RewordFunction: EntetyStatus->R, memory: [m]R, Sensors->[nI]R, F: Brain->[nI+m]R->[nO+m]R, update:Entety->[nO]R)

update = E => (Out => {E: {...E, memory: Out.slice(E.nO)}, O: Out.slice(0, E.nO)})(E.F(E.Sensors ++ E.memory))
  
*/

