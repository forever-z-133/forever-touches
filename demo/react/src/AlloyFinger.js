import { useEffect, useState } from 'react';
import AFinger, { AlloyFingerTrggers } from "./packages/Alloyfinger-React";

export let IS_ALLOY_FINGER = false;
window.addEventListener('touchstart', function(e) {
  if (IS_ALLOY_FINGER) e.preventDefault();
}, { passive: false });
window.addEventListener('touchmove', function(e) {
  if (IS_ALLOY_FINGER) e.preventDefault();
}, { passive: false });

export default function AlloyFinger() {
  const [initalScale, setInitalScale] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  return (
    <AFinger
      onMultipointStart={(e) => {
        IS_ALLOY_FINGER = e.target;
        setInitalScale(scale);
        setRotate(rotate);
      }}
      onMultipointEnd={(e) => {
        IS_ALLOY_FINGER = false;
      }}
      onPressMove={(e) => {
        setX(x + e.deltaX);
        setY(y + e.deltaY);
      }}
      onPinch={(e) => {
        setScale(Math.max(0.5, initalScale * e.scale));
      }}
      onRotate={(e) => {
        setRotate((rotate + e.angle) % 360);
      }}
    >
      <div className="box pink target2" style={{
        transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`
      }} onClick={(e) => {
        AlloyFingerTrggers.set(e.target, true);
      }}></div>
    </AFinger>
  );
}
