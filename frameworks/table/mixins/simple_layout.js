SC.SimpleLayout = {
  isLayout: YES,
  isDividedLayout: YES,

  layoutDirection: SC.LAYOUT_HORIZONTAL,

  thicknesses: null,
  thicknessesBindingDefault: SC.Binding.multiple(),

  totalThickness: 0,
  
  widthDelta: null,
  offsetDelta: null,
  
  thicknessKey: null,
  
  initMixin: function() {
    this._thicknesses_observer = this.addObserver('thicknesses.@each.' + this.get('thicknessKey'), this, 'thicknessesDidChange');
  },
  
  thicknessesDidChange: function(object, key, value) {
    if(this._doLayout === NO) return;
    var thicknesses = this.get('thicknesses');
    var thicknessProperty = this.get('layoutDirection') == SC.LAYOUT_HORIZONTAL ? "Width" : "Height";

    if(key == '[]') {
      idx = 0;
    } else {
      idx = thicknesses.objectAt(object);
    }
    
    this.expireLayoutFrom(idx);
    this._sl_layoutChildViews(idx);
    
    var total = this.offsetForView(thicknesses.get('length'))
    this.set('totalThickness', total);
    this.adjust('min' + thicknessProperty, total);
    this.set('calculated' + thicknessProperty, this.get('totalThickness'), total);
  },
  
  childViewsDidChange: function() {
    this._sl_layoutChildViews();
  }.observes('childViews'),
  
  _sl_layoutChildViews: function() {
    var layoutViews = (this._layoutViews || (this._layoutViews = [])),
      childViews = this.get('childViews');
      
    childViews.forEach(function(c) {
      if(c.layoutDelegate == this) {
        layoutViews[c.layoutIndex] = c;
      }
    }, this);
    
    this.layoutViewsFrom(0);
  },
  
  expireLayoutFrom: function(index) {
    this._offsetCache = this._offsetCache ? this._offsetCache.slice(0, index) : null;
  },
  
  layoutViewsFrom: function(index) {
    if(!index) index = 0;
    this.expireLayoutFrom(index);
  
    var thicknesses = this.get('thicknesses'), view;
    
    for(var i = index, len = thicknesses.get('length'); i < len; i++) {
      view = this.viewForIndex(i);
      if(!this.shouldLayoutView || this.shouldLayoutView(view, i)) {
        this.repositionView(view, this.layoutForView(i, view));
      }
    }
  },

  layoutForView: function(idx, view) {
    var ret = {top: 0, left: 0, right: 0, bottom: 0};
    var direction = this.get('layoutDirection');
    if((direction == SC.LAYOUT_HORIZONTAL)) {
      delete ret['right'];
    } else {
      delete ret['bottom'];
    }
    
    ret[(direction == SC.LAYOUT_HORIZONTAL) ? 'left' : 'top'] = this.offsetForView(idx, view);
    ret[(direction == SC.LAYOUT_HORIZONTAL) ? 'width' : 'height'] = this.thicknessForView(idx, view);
      
    return ret;
  },

  thicknessForView: function(idx, view) {
    var thicknesses = this.get('thicknesses');
    return thicknesses.objectAt(idx).get(this.get('thicknessKey')) + (this.widthDelta || 0);
  },

  offsetForView: function(idx, view) {
    var cache = this._offsetCache;
    if (!cache) {
      cache = this._offsetCache = [];
    }
    
    if(SC.none(this._offsetCache[idx])) {
      if(idx > 0) {
        this._offsetCache[idx] = this.offsetForView(idx - 1) + this.thicknessForView(idx - 1);
      } else {
        this._offsetCache[idx] = this.startOffset || 0;
      }
    }
  
    return this._offsetCache[idx] + (this.offsetDelta || 0);
  },
  
  // these methods are for overriding index-to-view and view repositioning
  // behaviour in your class, for instance it's used in tableview to map
  // the index of a column to the index of the cellview for that column
  
  viewForIndex: function(i) {
    var views = this._layoutViews;
    return views[i];
  },
  
  repositionView: function(view, layout) {
    if(view) {
      view.adjust(layout);
    }
  }
};