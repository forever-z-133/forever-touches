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

  options = {};

  /// 全局初始化
  constructor(options) {
    this._handleTouchPrevent = this._handleTouchPrevent.bind(this);
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchMove = this._handleTouchMove.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);
    this._handleTouchCancel = this._handleTouchCancel.bind(this);

    window.addEventListener('touchstart', this._handleTouchPrevent, { passive: false });
    window.addEventListener('touchmove', this._handleTouchPrevent, { passive: false });
    window.addEventListener('touchstart', this._handleTouchStart);
    window.addEventListener('touchmove', this._handleTouchMove);
    window.addEventListener('touchend', this._handleTouchEnd);
    window.addEventListener('touchcancel', this._handleTouchCancel);
  }

  _handleTouchPrevent(evt) {
    evt.preventDefault();
  }

  _handleTouchStart(evt) {
    if (!this._canTriggerMe(evt)) return;

    this._emitEvent("onTouchStart", evt);
    if (!evt.touches) return;

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
    var preV = this.preV,
      len = evt.touches.length;

    if (len > 1) {
      this._cancelLongTap();
      this._cancelSingleTap();
      var v = {
        x: evt.touches[1].pageX - this.x1,
        y: evt.touches[1].pageY - this.y1
      };
      preV.x = v.x;
      preV.y = v.y;
      this.pinchStartLen = getLen(preV);
      this._emitEvent("onMultipointStart", evt);
    } else {
      this.isSingleTap = true;
    }
    this.longTapTimeout = setTimeout(() => {
      this._emitEvent("onLongTap", evt);
      this.afterLongTap = true;
      this.afterLongTapTimeout = setTimeout(() => {
        this.afterLongTap = false;
      }, 1000);
    }, 750);
  }

  _handleTouchMove(evt) {
    if (!this._canTriggerMe(evt)) return;

    this._emitEvent("onTouchMove", evt);
    var preV = this.preV,
      len = evt.touches.length,
      currentX = evt.touches[0].pageX,
      currentY = evt.touches[0].pageY;
    this.isSingleTap = false;
    this.isDoubleTap = false;
    if (len > 1) {
      var v = {
        x: evt.touches[1].pageX - currentX,
        y: evt.touches[1].pageY - currentY
      };
      if (preV.x !== null) {
        if (this.pinchStartLen > 0) {
          evt.center = {
            x: (evt.touches[1].pageX + currentX) / 2,
            y: (evt.touches[1].pageY + currentY) / 2
          };
          evt.scale = evt.zoom = getLen(v) / this.pinchStartLen;
          this._emitEvent("onPinch", evt);
        }
        evt.angle = getRotateAngle(v, preV);
        this._emitEvent("onRotate", evt);
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
      this._emitEvent("onPressMove", evt);
    }
    this._cancelLongTap();
    this.x2 = currentX;
    this.y2 = currentY;

    if (len > 1) {
      evt.preventDefault();
    }
  }

  _handleTouchCancel(evt) {
    if (!this._canTriggerMe(evt)) return;

    this._emitEvent("onTouchCancel", evt);
    clearInterval(this.singleTapTimeout);
    clearInterval(this.tapTimeout);
    clearInterval(this.longTapTimeout);
    clearInterval(this.swipeTimeout);
  }

  _handleTouchEnd(evt) {
    if (!this._canTriggerMe(evt)) return;

    this._emitEvent("onTouchEnd", evt);
    this.end = Date.now();
    this._cancelLongTap();

    if (this.multiTouch === true && evt.touches.length < 2) {
      this._emitEvent("onMultipointEnd", evt);
    }

    evt.origin = [this.x1, this.y1];
    if (this.multiTouch === false) {
      if (
        (this.x2 && Math.abs(this.x1 - this.x2) > 30) ||
        (this.y2 && Math.abs(this.y1 - this.y2) > 30)
      ) {
        evt.direction = swipeDirection(this.x1, this.x2, this.y1, this.y2);
        if (this.end - this.now < 250) evt.direction = 'Nochange';
        evt.distance = Math.abs(this.x1 - this.x2);
        this.swipeTimeout = setTimeout(() => {
          this._emitEvent("onSwipe", evt);
        }, 0);
      } else {
        if (this.afterLongTap) {
          clearTimeout(this.afterLongTapTimeout);
          this.afterLongTap = false;
        } else {
          this.tapTimeout = setTimeout(() => {
            this._emitEvent("onTap", evt);
            if (this.isDoubleTap) {
              this._emitEvent("onDoubleTap", evt);
              clearTimeout(this.singleTapTimeout);
              this.isDoubleTap = false;
            } else if (this.isSingleTap) {
              this.singleTapTimeout = setTimeout(() => {
                this._emitEvent("onSingleTap", evt);
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
    this.x1 = this.x2 = this.y1 = this.y2 = null;
    this.multiTouch = false;
  }

  _canTriggerMe(evt) {
    return true;
  }

  _cancelLongTap() {
    clearTimeout(this.longTapTimeout);
  }

  _cancelSingleTap() {
    clearTimeout(this.singleTapTimeout);
  }

  _emitEvent(name, evt) { }
}

export default Singleton(ForeverTouches);
