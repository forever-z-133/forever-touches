import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AlloyFinger from './packages/Alloyfinger-React';
import './tranform';

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
  }

  durationTimer = 0;
  initalScale = 1;
  disabled = {};
  areaRef = null;

  componentDidMount = () => {
    const { getRef } = this.props;
    getRef && getRef(this);
  }

  getAreaRef = ref => {
    if (ref) {
      this.areaRef = ref;

      window.Transform(ref);
      const { defaultValue } = this.props;
      const { scale = 1, left = 0, top = 0 } = defaultValue || {};
      this.resetTransformOriginWithPercent(0.5, 0.5);
      this.setTempState({ scale, left, top });
    }
  };

  // 给外界调用，可修改缩放
  setScale(scale, duration = 200, callback) {
    this.setTempState({ scale, duration }, callback);
  }

  // 开始缩放
  onMultipointStart = e => {
    this.resetTransformOrigin(e);
    const { scale } = this.state;
    this.initalScale = scale;
  };
  // 缩放
  onPinch = e => {
    e.stopPropagation();
    const { scale: defaultScale } = this.props.defaultValue || {};
    const min = defaultScale * 0.9;
    const max = defaultScale * 4;
    const scale = Math.max(min, Math.min(max, this.initalScale * e.scale));

    const { left: l, top: t } = this.state;
    let left = l;
    let top = t;
    if (scale > defaultScale) {
      const [minX, maxX, minY, maxY] = this.getTranslateRange();
      left = Math.max(minX, Math.min(maxX, l));
      top = Math.max(minY, Math.min(maxY, t));
    }

    this.setTempState({ scale, left, top, duration: 0 });
  };
  // 拖拽
  onPressMove = e => {
    // 点中激活元素时禁用画布移动
    if (this.disabled.onPressMove) return;

    const { scale: defaultScale } = this.props.defaultValue || {};
    const { scale, left: _left, top: _top } = this.state;

    if (scale < defaultScale) return;

    const l = _left + e.deltaX;
    const t = _top + e.deltaY;

    const [minX, maxX, minY, maxY] = this.getTranslateRange();
    const left = Math.max(minX, Math.min(maxX, l));
    const top = Math.max(minY, Math.min(maxY, t));

    this.setTempState({ left, top, duration: 0 });
  };
  // 完成操作
  onTouchFinish = (e, must = false) => {
    const { defaultValue } = this.props;
    const { scale: defaultScale } = defaultValue || {};
    const { scale } = this.state;
    // 若海报缩小，则动画返回默认大小
    if (must || scale < defaultScale) {
      const { left, top } = defaultValue || {};
      this.setTempState({ scale: defaultScale, left, top, originX: 0, originY: 0, duration: 200 });
      this.resetTransformOriginWithPercent(0.5, 0.5);
      this.setState({}); // 显示缩放按钮，其实可调整为 dom 操作
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
    const { x: centerX, y: centerY } = e.center;
    const { scale } = this.state;
    const dom = this.areaRef;
    const { originX: preOriginX, originY: preOriginY } = dom;
    const cr = dom.getBoundingClientRect();
    const img_centerX = cr.left + cr.width / 2;
    const img_centerY = cr.top + cr.height / 2;
    const offX = centerX - img_centerX;
    const offY = centerY - img_centerY;
    const originX = offX / dom.scaleX;
    const originY = offY / dom.scaleY;
    const left = dom.translateX + offX - preOriginX * dom.scaleX;
    const top = dom.translateY + offY - preOriginY * dom.scaleX;
    this.setTempState({ left, top, scale, originX, originY });
  }
  resetTransformOriginWithPercent(percentX, percentY) {
    const cr = this.areaRef.getBoundingClientRect();
    const x = cr.left + cr.width * percentX;
    const y = cr.top + cr.height * percentY;
    this.resetTransformOrigin({ center: { x, y } });
  }

  // 重置可拖拽范围
  getTranslateRange() {
    const { scale: defaultScale } = this.props.defaultValue || {};
    const { width, height } = this.props.style;
    const { scale, originX, originY } = this.state;
    const anchorX = originX / width;
    const anchorY = originY / height;
    const left = defaultScale * width / 2 * anchorX;
    const top = defaultScale * height / 2 * anchorY;
    const offsetX = (scale - defaultScale) * width;
    const offsetY = (scale - defaultScale) * height;
    const maxX = left + (anchorX + 0.5) * offsetX;
    const minX = maxX - offsetX;
    const maxY = top + (anchorY + 0.5) * offsetY;
    const minY = maxY - offsetY;
    return [minX, maxX, minY, maxY];
  }

  // 操作过程中的处理 dom，操作结束时处理 state
  setTempState = (newState, callback) => {
    const state = Object.assign(this.state, newState);
    const dom = this.areaRef;
    const { left, top, scale, duration, originX = 0, originY = 0 } = state;
    dom.originX = originX;
    dom.originY = originY;
    dom.scaleX = scale;
    dom.scaleY = scale;
    dom.translateX = left;
    dom.translateY = top;
    dom.style.transition = `transform ${duration}ms`;

    clearTimeout(this.durationTimer);
    if (duration > 0) {
      this.durationTimer = setTimeout(() => {
        callback && callback();
      }, duration);
    }
  };

  render() {
    const { disabled, editor, style, getRef, ...props } = this.props;
    return (
      <>
        <AlloyFinger
          disabled={disabled}
          onTouchStart={this.onTouchBegin}
          onMultipointEnd={this.onTouchFinish}
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
      </>
    );
  }
}
CanvasScale2.propTypes = {
  children: PropTypes.array,
  defaultValue: PropTypes.object,
  style: PropTypes.object,
  editor: PropTypes.object,
  disabled: PropTypes.bool,
  getRef: PropTypes.func,
};
