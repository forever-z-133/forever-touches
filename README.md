# forever-touches

增强 touches 操作，比如 drag rotate pinch swiper 等，  
已经有 AlloyFinger / Gesto 之类的库做得很好了。    

但在业务实现时，特别是在微信浏览器中，它的下拉问题属实烦人，  
特此，借鉴 AlloyFinger 代码后，期望解决掉它。  

另外，其他库都需要双指皆在元素上时才能触发，但元素过小时这样操作并不美妙，  
不如把事件绑在 window 上，自定义激活态元素，这样双指在全屏中的反馈都能集中到该元素上。  
