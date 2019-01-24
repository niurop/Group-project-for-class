log = console.log
min = Math.min
max = Math.max
random = Math.random
abs = x => x < 0 ? -x : x
sgn = x => x < 0 ? -1 : x > 0 ? 1 : 0
avg = X => sumV(X) / X.length
sin = x => Math.sin(x*Math.PI)
cos = x => Math.cos(x*Math.PI)
MIN = L => L.reduce((a,b) => min(a,b))
MAX = L => L.reduce((a,b) => max(a,b))


// Function to download data to a file
toJSON = data => JSON.stringify(data, (key, value) => typeof value === "function" ? "/Function(" + value.toString() + ")/" : value)
fromJSON = json => JSON.parse(json, (key, value) => (typeof value === "string" && value.startsWith("/Function(") && value.endsWith(")/")) ? eval("(" + value.substring(10, value.length - 2) + ")") : value)
downloadJSON = (data, filename) => download(toJSON(data), filename, "text/json")
function download(data, filename, type) {
  if (window.navigator.msSaveOrOpenBlob) // IE10+
    window.navigator.msSaveOrOpenBlob(new Blob([data], {type: type}), filename)
  else { // Others
    let obj = document.createElement("a"),
        url = URL.createObjectURL(new Blob([data], {type: type}))
    obj.href = url
    obj.download = filename
    document.body.appendChild(obj)
    obj.click()
    setTimeout(function() {
      document.body.removeChild(obj)
      window.URL.revokeObjectURL(url)
    }, 0)
  }
}

zipWith = (xs, ys, f) =>  range( min(xs.length, ys.length) ).map(i => f(xs[i], ys[i], i))
range = n => Array(n).fill(0).map((_, i) => i)
range2 = (n, m) => range(m).map(i => range(n).map(j => [j,i]))
mapN = (n, f, Ls) => n === 0 ? f(Ls) : Ls.map(ls => mapN(n-1, f, ls))
applyN = (n, f) => x => {
  let temp = x
  while(n-- > 0) temp = f(temp)
  return temp
}

abstractionClass = (List, eq) => {
  let list = []
  for(e in List){
    for(i = 0; i < list.length && !eq(List[e], list[i][0]); i++);
    if(i === list.length)
      list.push([List[e]])
    else
      list[i].push(List[e])
  }
  return list
}

sumV = V => V.reduce(sumRR)
mulV = V => V.reduce(mulRR)
sumRR = (a, b) => a + b
mulRR = (a, b) => a * b
mulVR = (v, a) => v.map(x => x * a)
dotVV = (v, w) => sumV(mulVV(v, w))
mulVV = (v, w) => zipWith(v, w, mulRR)
sumVV = (v, w) => zipWith(v, w, sumRR)
mulMR = (M, a) => M.map(v => mulVR(v, a))
mulMV = (M, v) => M.map(m => dotVV(m,v))
transposeM = M => M[0].map((_, i) => M.map(x => x[i]))
mulMM = (A, B) => transposeM(transposeM(B).map(x => mulMV(A,x)))
sumMM = (A, B) => zipWith(A, B, sumVV)
negR = x => -x
negV = V => V.map(negR)
negM = M => M.map(negV)
numericLevel = a => a = a === undefined ? undefined : typeof a === "number" ? 0 : Array.isArray(a) ? 1 + numericLevel(a[0]) : undefined
neg = a => [negR, negV, negM][numericLevel(a)](a)
sum = (a, b) => numericLevel(a) === numericLevel(b) ? [sumRR, sumVV, sumMM][numericLevel(a)](a, b) : console.error("Types of elements don't match")
mul = (a, b) => [[mulRR, flip(mulVR), flip(mulMR)], [mulVR, mulVV, (a, b) => mulMM([a], b)], [mulMR, mulMV, mulMM]][numericLevel(a)][numericLevel(b)](a, b)

changePartialyV = (I, M, V) => zipWith(I, V, (i, v, m) => M[m] ? v : i)
setPartialyV = (I, M, v) => zipWith(I, M, (i, m) => m ? v : i)

randomFrom = L => s => L.length == 0 ? random(s) : L[(random(s) * L.length) | 0 % L.length]
randomV = (V, s) => range(s).map(randomFrom(V))
randomM = (V, w, h) => range(h).map(x => range(w).map(randomFrom(V)))

slightnudgeVV = (s => (V, W) => sumVV(V, mulVR(W, s)))
slightnudgeMM = (s => (M, N) => sumMM(M, mulMR(M, s)))
slightnudgeNN = (s => (A, B) => zipWith(A, zipWith(A.map(l => l.M), B.map(l => l.M), slightnudgeMM(s)), (A, N) => ({M: N, F: A.F})))
flip = f => (x, y) => f(y, x)
applay = (f, x) => f(x)
applayVV = (f, x) => zipWith(f, x, applay)

id = t => t
clamp = (a, b) => t => min(b, max(a, t))
scale = (f, x, y) => t => y * f(t / x)
translate = (f, x, y) => t => f(t - x) + y
logistic = t => 1 / (1 + Math.exp(-t))
nonegativelinear = t => max(0, t)
nonepositivelinear = t => min(0, t)
compose = (f, g) => t => f(g(t))
threshold = x => t => t >= x ? 1 : 0

layerevaluator = (M, F) => V => applayVV(F, mulMV(M, V))
layersevaluator = (Ms, Fs) => V => zipWith(Ms, Fs, (M, F) => layerevaluator(M, F)).reduce(flip(applay), V)

distribution = t => -Math.log(1/t - 1)

randomNNdata = (I, D, O, Fs) => zipWith([I].concat(D), D.concat([O]), (a, b) => ({M: randomM([], a,b), F: randomV(Fs, b)}))
NNfromdata = D => V => D.map(L => layerevaluator(L.M, L.F)).reduce((v, f) => f(v), V)
