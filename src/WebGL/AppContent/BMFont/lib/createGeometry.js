import { BufferAttribute } from 'three'

var createLayout = require('layout-bmfont-text')
var inherits = require('inherits')
var createIndices = require('quad-indices')
var assign = require('object-assign')

var vertices = require('./vertices')
var utils = require('./utils')

var BufferGeometry = require('three/src/core/BufferGeometry').BufferGeometry
var Base = BufferGeometry
var Sphere = require('three/src/math/Sphere').Sphere
var Box3 = require('three/src/math/Box3').Box3

export default function createTextGeometry (opt) {
  return new TextGeometry(opt)
}

function TextGeometry (opt) {
  Base.call(this)

  if (typeof opt === 'string') {
    opt = { text: opt }
  }

  // use these as default values for any subsequent
  // calls to update()
  this._opt = assign({}, opt)

  // also do an initial setup...
  if (opt) this.update(opt)
}

inherits(TextGeometry, Base)

TextGeometry.prototype.update = function (opt) {
  if (typeof opt === 'string') {
    opt = { text: opt }
  }

  // use constructor defaults
  opt = assign({}, this._opt, opt)

  if (!opt.font) {
    throw new TypeError('must specify a { font } in options')
  }

  this.layout = createLayout(opt)

  // get vec2 texcoords
  var flipY = opt.flipY !== false

  // the desired BMFont data
  var font = opt.font

  // determine texture size from font file
  var texWidth = font.common.scaleW
  var texHeight = font.common.scaleH

  // get visible glyphs
  var glyphs = this.layout.glyphs.filter(function (glyph) {
    var bitmap = glyph.data
    return bitmap.width * bitmap.height > 0
  })

  // provide visible glyphs for convenience
  this.visibleGlyphs = glyphs

  // get common vertex data
  var positions = vertices.positions(glyphs)
  var uvs = vertices.uvs(glyphs, texWidth, texHeight, flipY)
  var indices = createIndices({
    clockwise: true,
    type: 'uint16',
    count: glyphs.length
  })

  // update vertex data
  // this.setIndex(indices)

  this.setIndex(new BufferAttribute(indices, 1))

  this.setAttribute('position', new BufferAttribute(positions, 2))
  this.setAttribute('uv', new BufferAttribute(uvs, 2))

  // buffer.index(this, indices, 1, 'uint16')
  // buffer.attr(this, 'position', positions, 2)
  // buffer.attr(this, 'uv', uvs, 2)

  // // update multipage data
  // if (!opt.multipage && 'page' in this.attributes) {
  //   // disable multipage rendering
  //   this.removeAttribute('page')
  // } else if (opt.multipage) {

  console.log(glyphs)
  var pages = vertices.pages(glyphs)
  // enable multipage rendering
  // buffer.attr(this, 'page', pages, 1)
  this.setAttribute('page', new BufferAttribute(pages, 1))
  // }
}

TextGeometry.prototype.computeBoundingSphere = function () {
  if (this.boundingSphere === null) {
    this.boundingSphere = new Sphere()
  }

  var positions = this.attributes.position.array
  var itemSize = this.attributes.position.itemSize
  if (!positions || !itemSize || positions.length < 2) {
    this.boundingSphere.radius = 0
    this.boundingSphere.center.set(0, 0, 0)
    return
  }
  utils.computeSphere(positions, this.boundingSphere)
  if (isNaN(this.boundingSphere.radius)) {
    console.error('BufferGeometry.computeBoundingSphere(): ' +
      'Computed radius is NaN. The ' +
      '"position" attribute is likely to have NaN values.')
  }
}

TextGeometry.prototype.computeBoundingBox = function () {
  if (this.boundingBox === null) {
    this.boundingBox = new Box3()
  }

  var bbox = this.boundingBox
  var positions = this.attributes.position.array
  var itemSize = this.attributes.position.itemSize
  if (!positions || !itemSize || positions.length < 2) {
    bbox.makeEmpty()
    return
  }
  utils.computeBox(positions, bbox)
}
