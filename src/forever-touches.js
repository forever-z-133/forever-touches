import { getLen, getRotateAngle, swipeDirection, Singleton } from "./utils.js";

/**
 * ForeverTouches 主程序
 */
class ForeverTouches {
  preV = { x: null, y: null };
  pinchStartLen = null;
  scale = 1;
  isSingleTap = false;
  isDoubleTap = false;
  delta = null;
  last = null;
  now = null;
  end = null;
  multiTouch = false;
  tapTimeout = null;
  longTapTimeout = null;
  singleTapTimeout = null;
  swipeTimeout = null;
  x1 = null;
  x2 = null;
  y1 = null;
  y2 = null;
  preTapPosition = { x: null, y: null };

  afterLongTap = false;
  afterLongTapTimeout = null;

  touchCount = 0;

  options = {};

  /// 全局初始化
  constructor(options) {
    this.options = Object.assign({}, options);

    this._handleTouchPrevent = this._handleTouchPrevent.bind(this);
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchMove = this._handleTouchMove.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);
    this._handleTouchCancel = this._handleTouchCancel.bind(this);
    this._handleMouseWheel = this._handleMouseWheel.bind(this);

    window.addEventListener('touchstart', this._handleTouchPrevent, { passive: false });
    window.addEventListener('touchmove', this._handleTouchPrevent, { passive: false });
    window.addEventListener('touchstart', this._handleTouchStart);
    window.addEventListener('touchmove', this._handleTouchMove);
    window.addEventListener('touchend', this._handleTouchEnd);
    window.addEventListener('touchcancel', this._handleTouchCancel);
    window.addEventListener('mousewheel', this._handleMouseWheel); // PC 端双指
  }

  _handleTouchPrevent(evt) {
    evt.preventDefault();
  }

  _handleTouchStart(evt) {
    this._emitEvent('onTouchStart', evt);
    if (!evt.touches) return;

    if (this.touchCount === 0) {
      this._emitEvent('onTouchBegin', evt);
    }
    this.touchCount += 1;

    this.now = Date.now();
    this.x1 = evt.touches[0].pageX;
    this.y1 = evt.touches[0].pageY;
    this.delta = this.now - (this.last || this.now);
    if (this.preTapPosition.x !== null) {
      this.isDoubleTap =
        this.delta > 0 &&
        this.delta <= 250 &&
        Math.abs(this.preTapPosition.x - this.x1) < 30 &&
        Math.abs(this.preTapPosition.y - this.y1) < 30;
    }
    this.preTapPosition.x = this.x1;
    this.preTapPosition.y = this.y1;
    this.last = this.now;
    const { preV } = this;
    const len = evt.touches.length;

    if (len > 1) {
      this._cancelLongTap();
      this._cancelSingleTap();
      const v = { x: evt.touches[1].pageX - this.x1, y: evt.touches[1].pageY - this.y1 };
      preV.x = v.x;
      preV.y = v.y;
      this.pinchStartLen = getLen(preV);
      this._emitEvent('onMultipointStart', evt);
    } else {
      this.isSingleTap = true;
    }
    this.longTapTimeout = setTimeout(() => {
      this._emitEvent('onLongTap', evt);
      this.afterLongTap = true;
      this.afterLongTapTimeout = setTimeout(() => {
        this.afterLongTap = false;
      }, 1000);
    }, 750);
  }

  _handleTouchMove(evt) {
    this._emitEvent('onTouchMove', evt);
    const { preV } = this;
    const len = evt.touches.length;
    const currentX = evt.touches[0].pageX;
    const currentY = evt.touches[0].pageY;
    this.isSingleTap = false;
    this.isDoubleTap = false;
    if (len > 1) {
      const v = { x: evt.touches[1].pageX - currentX, y: evt.touches[1].pageY - currentY };
      if (preV.x !== null) {
        if (this.pinchStartLen > 0) {
          evt.center = {
            x: (evt.touches[1].pageX + currentX) / 2,
            y: (evt.touches[1].pageY + currentY) / 2,
          };
          evt.scale = getLen(v) / this.pinchStartLen;
          this._emitEvent('onPinch', evt);
        }
        evt.angle = getRotateAngle(v, preV);
        this._emitEvent('onRotate', evt);
      }
      preV.x = v.x;
      preV.y = v.y;
      this.multiTouch = true;
    } else {
      if (this.x2 !== null) {
        evt.deltaX = currentX - this.x2;
        evt.deltaY = currentY - this.y2;
      } else {
        evt.deltaX = 0;
        evt.deltaY = 0;
      }
      this._emitEvent('onPressMove', evt);
    }
    this._cancelLongTap();
    this.x2 = currentX;
    this.y2 = currentY;

    if (len > 1) {
      evt.preventDefault();
    }
  }

  _handleTouchCancel(evt) {
    this._emitEvent('onTouchCancel', evt);
    clearInterval(this.singleTapTimeout);
    clearInterval(this.tapTimeout);
    clearInterval(this.longTapTimeout);
    clearInterval(this.swipeTimeout);
    this.touchCount -= 1;
  }

  _handleTouchEnd(evt) {
    this._emitEvent('onTouchEnd', evt);
    this.end = Date.now();
    this._cancelLongTap();

    if (this.multiTouch === true && evt.touches.length < 2) {
      this._emitEvent('onMultipointEnd', evt);
    }

    this.touchCount -= 1;
    if (this.touchCount === 0) {
      this._emitEvent('onTouchFinish', evt);
    }

    evt.origin = [this.x1, this.y1];
    if (this.multiTouch === false) {
      if ((this.x2 && Math.abs(this.x1 - this.x2) > 30) || (this.y2 && Math.abs(this.y1 - this.y2) > 30)) {
        evt.direction = swipeDirection(this.x1, this.x2, this.y1, this.y2);
        evt.distance = Math.abs(this.x1 - this.x2);
        this.swipeTimeout = setTimeout(() => {
          this._emitEvent('onSwipe', evt);
        }, 0);
      } else {
        if (this.afterLongTap) {
          clearTimeout(this.afterLongTapTimeout);
          this.afterLongTap = false;
        } else {
          this.tapTimeout = setTimeout(() => {
            this._emitEvent('onTap', evt);
            if (this.isDoubleTap) {
              this._emitEvent('onDoubleTap', evt);
              clearTimeout(this.singleTapTimeout);
              this.isDoubleTap = false;
            } else if (this.isSingleTap) {
              this.singleTapTimeout = setTimeout(() => {
                this._emitEvent('onSingleTap', evt);
              }, 250);
              this.isSingleTap = false;
            }
          }, 0);
        }
      }
    }

    this.preV.x = 0;
    this.preV.y = 0;
    this.scale = 1;
    this.pinchStartLen = null;
    this.x1 = null;
    this.x2 = null;
    this.y1 = null;
    this.y2 = null;
    this.multiTouch = false;
  }

  wheelTimer = 0;
  prevWheelDelta = null;
  wheelDist = null;
  _handleMouseWheel(evt) {
    // https://github.com/codingforme/jquery-mac-mousewheel/blob/master/jquery.mac.mousewheel.js
    if (this.wheelDist === null) {
      this._emitEvent("onTouchBegin", evt);
      this._emitEvent("onMultipointStart", evt);
      this.pinchStartLen = 0;
      this.wheelDist = { deltaX: 0, deltaY: 0 };
    }
    clearTimeout(this.wheelTimer);
    this.wheelTimer = setTimeout(() => {
      this.wheelDist = null;
      this._emitEvent("onTouchFinish", evt);
      this._emitEvent("onMultipointEnd", evt);
    }, 300);
    evt.center = { x: 0, y: 0 };
    const { wheelDeltaX: x, wheelDeltaY: y } = evt;
    if (!this.prevWheelDelta) this.prevWheelDelta = { x, y };

    const { x: prevX, y: prevY } = this.prevWheelDelta;
    console.log(prevX, x, prevY, y);
    // if (this._sameWheelDirection(prevX - x, x) === 0) return;
    // if (this._sameWheelDirection(prevY - y, y) === 0) return;

    const deltaX = this.wheelDist.deltaX + x;
    const deltaY = this.wheelDist.deltaY + y;

    if (Math.abs(deltaX) < 5 || Math.abs(deltaY) < 5) return;

    const v = { x: deltaX, y: deltaY };
    evt.scale = getLen(v) / 10;;
    // console.log(evt.scale);
    this.wheelDist = { deltaX, deltaY }
    this.prevWheelDelta = { x: deltaX, y: deltaY };;
    this._emitEvent('onPinch', evt);
  }

  //当差值不跟滑动方向正负相同时，需舍弃
  _sameWheelDirection(delta, space) {
    return delta > 0 && space > 0 || delta < 0 && space < 0 ? space : 0;
  }

  _cancelLongTap() {
    clearTimeout(this.longTapTimeout);
  }

  _cancelSingleTap() {
    clearTimeout(this.singleTapTimeout);
  }

  _emitEvent(name, ...arg) {
    let { disabled } = this.options;
    if (Array.isArray(disabled)) disabled = disabled.includes(name);
    if (this.options[name] && !disabled) {
      this.options[name](...arg);
    }
  }
}

export default Singleton(ForeverTouches);
