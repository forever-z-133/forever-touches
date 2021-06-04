import React, { Component } from 'react';
import AlloyFinger from './packages/Alloyfinger-React';

export default class CanvasScale2 extends Component {
  constructor(props) {
    super(props);

    const { defaultValue } = props;
    const { scale = 1, left = 0, top = 0 } = defaultValue || {};

    this.state = {
      scale,
      top,
      left,
      originX: 0,
      originY: 0,
      duration: 0,
    };

    this.initalScale = scale;

    this.winW = window.innerWidth || 414;
    this.winH = window.innerHeight || 667;
  }

  durationTimer = 0;
  initalScale = 1;
  initalOriginX = 0;
  initalOriginY = 0;
  disabled = {};
  areaRef = null;

  getAreaRef = ref => {
    if (ref) {
      const { width, height } = this.props.style;
      this.areaRef = ref;
      const originX = width / 2;
      const originY = height / 2;
      this.initalOriginX = originX;
      this.initalOriginY = originY;
      this.setTempState({});
    }
  };

  // 开始缩放
  onMultipointStart = e => {
    const { scale, left: l, top: t } = this.state;
    this.initalScale = scale;

    this.resetTransformOrigin(e);
  };
  // 缩放
  onPinch = e => {
    e.stopPropagation();
    const { scale: defaultScale, left: _left, top: _top } = this.props.defaultValue || {};
    const min = defaultScale / 2;
    const scale = Math.max(min, this.initalScale * e.scale);

    this.setTempState({ scale, duration: 0 });
  };
  // 拖拽
  onPressMove = e => {
    // 点中激活元素时禁用画布移动
    if (this.disabled.onPressMove) return;

    // 画布缩小时禁用画布移动
    const { scale: defaultScale } = this.props.defaultValue || {};
    const { left: l, top: t, scale } = this.state;
    if (scale <= defaultScale) return;

    const left = l + e.deltaX;
    const top = t + e.deltaY;
    this.setTempState({ left, top, duration: 0 });
  };
  // 完成操作
  onTouchFinish = (e, must = false) => {
    const { scale: defaultScale } = this.props.defaultValue || {};
    const { scale } = this.state;
    // 若海报缩小，则动画返回默认大小
    if (must || scale < defaultScale) {
      const { left, top } = this.props.defaultValue || {};
      const cr = this.areaRef.getBoundingClientRect();
      const x = cr.left + cr.width / 2;
      const y = cr.top + cr.height / 2;
      const center = { x, y };
      this.resetTransformOrigin({ center });
      setTimeout(() => {
        this.setTempState({ scale: defaultScale, left, top, originX: 0, originY: 0, duration: 200 });
        this.setState({});
      }, 50);
    } else {
      this.setState({});
    }
    delete this.disabled.onPressMove;
  };
  // 手势开始规避
  onTouchBegin = e => {
    // 点中激活元素，则不再触发画布的拖拽
    const { activeRef } = this.props.editor;
    const dom = activeRef;
    if (dom && this.isTouchInActiveElement(e, dom)) {
      this.disabled.onPressMove = true;
    }
  };
  onTouchCancel = e => {
    this.handleReset();
  };

  // 点在元素内部
  isTouchInActiveElement = (e, dom) => {
    const touch = e.touches[0];
    const { clientX: x, clientY: y } = touch;
    const { left, top, right, bottom } = dom.getBoundingClientRect();
    if (x >= left && x <= right && y >= top && y <= bottom) {
      return true;
    }
    return false;
  };

  // 重置原始位置大小
  handleReset = () => {
    this.onTouchFinish(undefined, true);
  };

  // 变更缩放中心
  resetTransformOrigin(e) {
    // 先更新中心
    const { scale, left: l, top: t } = this.state;
    const { x: centerX, y: centerY } = e.center;
    const cr = this.areaRef.getBoundingClientRect();
    const img_centerX = cr.left + cr.width / 2;
    const img_centerY = cr.top + cr.height / 2;
    const offX = centerX - img_centerX;
    const offY = centerY - img_centerY;
    const originX = offX / scale;
    const originY = offY / scale;
    this.setTempState({ originX, originY, duration: 0 });
    // 再还原为原视图
    const cr2 = this.areaRef.getBoundingClientRect();
    const left = l + cr.left - cr2.left;
    const top = t + cr.top - cr2.top;
    this.setTempState({ left, top });
  }

  unit(val) {
    return typeof val === 'string' ? val : `${val}px`;
  }

  // 操作过程中的处理 dom，操作结束时处理 state
  setTempState = (newState, callback) => {
    const state = Object.assign(this.state, newState);

    const { left, top, scale, duration, originX = 0, originY = 0 } = state;
    this.areaRef.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
    this.areaRef.style.transition = `transform ${duration}ms`;
    this.areaRef.style.transformOrigin = `
      ${this.unit(originX + this.initalOriginX)} ${this.unit(originY + this.initalOriginY)}
    `;

    clearTimeout(this.durationTimer);
    if (duration > 0) {
      this.durationTimer = setTimeout(() => {
        callback && callback();
      }, duration);
    }
  };

  render() {
    const { disabled, editor, style, ...props } = this.props;
    return (
      <AlloyFinger
        disabled={disabled}
        onTouchBegin={this.onTouchBegin}
        onTouchFinish={this.onTouchFinish}
        onMultipointStart={this.onMultipointStart}
        onTouchCancel={this.onTouchCancel}
        onPinch={this.onPinch}
        onPressMove={this.onPressMove}
      >
        <div
          ref={this.getAreaRef}
          style={{
            ...style,
            willChange: 'transform',
          }}
          {...props}
        >
          {this.props.children}
        </div>
      </AlloyFinger>
    );
  }
}
