export interface Dot { x: number, y: number };

export function getLen(v: Dot) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function dot(v1: Dot, v2: Dot) {
  return v1.x * v2.x + v1.y * v2.y;
}

export function getAngle(v1: Dot, v2: Dot) {
  var mr = getLen(v1) * getLen(v2);
  if (mr === 0) return 0;
  var r = dot(v1, v2) / mr;
  if (r > 1) r = 1;
  return Math.acos(r);
}

export function cross(v1: Dot, v2: Dot) {
  return v1.x * v2.y - v2.x * v1.y;
}

export function getRotateAngle(v1: Dot, v2: Dot) {
  var angle = getAngle(v1, v2);
  if (cross(v1, v2) > 0) {
    angle *= -1;
  }

  return (angle * 180) / Math.PI;
}

export function swipeDirection(x1: number, x2: number, y1: number, y2: number) {
  if (Math.abs(x1 - x2) > 80) {
    return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? "Left" : "Right") : (y1 - y2 > 0 ? "Up" : "Down");
  } else {
    return "Nochange";
  }
}
