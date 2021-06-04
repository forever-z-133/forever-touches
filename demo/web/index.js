import ForeverTouches from '../../src/forever-touches.js';

let initalScale = 1;
let scale = 1;
const ftouches = new ForeverTouches({
  onMultipointStart(evt) {
    initalScale = scale;
  },
  onPinch(evt) {
    scale = initalScale * evt.scale;
    document.querySelector('.box2').style.transform = `scale(${scale})`;
  }
});
ftouches.now = '1'
const ftouches2 = new ForeverTouches();
console.log(ftouches);
console.log(ftouches2);
