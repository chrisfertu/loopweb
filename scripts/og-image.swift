// Renders public/images/og-image.png (1200x630): the social card for opusloop.co.
//
//   swift scripts/og-image.swift [out.png] [icon.png] [CourierPrime-Bold.ttf]
//
// Run from the repo root. Defaults read the app icon and Courier Prime Bold
// from the iOS repo next door (../opusloop). If the font cannot be registered,
// the wordmark falls back to Menlo Bold.
//
// Composition: black; on the right third a thin luminous ring (#64D262) with
// the app icon inside it and a bright point (#14E468) where the ring starts,
// at 12 o'clock, like the drawing hand on the landing page; on the left the
// loop logotype and the headline.

import AppKit
import CoreText

let args = CommandLine.arguments
let cwd = FileManager.default.currentDirectoryPath
let outPath = args.count > 1 ? args[1] : "\(cwd)/public/images/og-image.png"
let iconPath = args.count > 2 ? args[2] : "\(cwd)/../opusloop/Icon-iOS-Default-1024x1024@2x.png"
let fontPath = args.count > 3 ? args[3] : "\(cwd)/../opusloop/CourierPrime-Bold.ttf"

let W = 1200, H = 630

func rgb(_ hex: UInt32, _ a: CGFloat = 1) -> CGColor {
  CGColor(srgbRed: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
          blue: CGFloat(hex & 0xFF) / 255, alpha: a)
}

let GLOW: UInt32 = 0x64D262
let CORE: UInt32 = 0x14E468
let MUTED: UInt32 = 0x9A9AA0

// ── Fonts ─────────────────────────────────────────────────────
var wordmarkFont = NSFont(name: "Menlo-Bold", size: 64)!
if FileManager.default.fileExists(atPath: fontPath) {
  var error: Unmanaged<CFError>?
  let url = URL(fileURLWithPath: fontPath) as CFURL
  let ok = CTFontManagerRegisterFontsForURL(url, .process, &error)
  if ok || error != nil, let f = NSFont(name: "CourierPrime-Bold", size: 64) {
    wordmarkFont = f
  } else {
    FileHandle.standardError.write("Courier Prime Bold not registered, using Menlo Bold\n".data(using: .utf8)!)
  }
} else {
  FileHandle.standardError.write("No font at \(fontPath), using Menlo Bold\n".data(using: .utf8)!)
}
let bodyFont = NSFont.systemFont(ofSize: 34, weight: .regular)

// ── Canvas ────────────────────────────────────────────────────
let space = CGColorSpace(name: CGColorSpace.sRGB)!
guard let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0,
                          space: space, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else {
  fatalError("no context")
}
ctx.setFillColor(rgb(0x000000))
ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
ctx.interpolationQuality = .high
ctx.setShouldAntialias(true)

// CoreGraphics is y-up: y = 0 is the bottom edge.
let cx: CGFloat = 872, cy: CGFloat = CGFloat(H) / 2
let R: CGFloat = 208

// A faint halo inside the ring, so it reads as light rather than a line.
// Peaks at the ring (R / 1.4R = 0.714) and fades to nothing on both sides.
if let halo = CGGradient(colorsSpace: space,
                         colors: [rgb(GLOW, 0.0), rgb(GLOW, 0.035), rgb(GLOW, 0.075), rgb(GLOW, 0.0)] as CFArray,
                         locations: [0, 0.5, 0.714, 1]) {
  ctx.drawRadialGradient(halo, startCenter: CGPoint(x: cx, y: cy), startRadius: 0,
                         endCenter: CGPoint(x: cx, y: cy), endRadius: R * 1.4, options: [])
}

// The ring: three passes, wide and faint to thin and bright.
func ring(width: CGFloat, alpha: CGFloat, blur: CGFloat) {
  ctx.saveGState()
  ctx.setShadow(offset: .zero, blur: blur, color: rgb(GLOW, min(1, alpha * 1.4)))
  ctx.setStrokeColor(rgb(GLOW, alpha))
  ctx.setLineWidth(width)
  ctx.strokeEllipse(in: CGRect(x: cx - R, y: cy - R, width: 2 * R, height: 2 * R))
  ctx.restoreGState()
}
ring(width: 10, alpha: 0.08, blur: 30)
ring(width: 4, alpha: 0.35, blur: 14)
ring(width: 2.2, alpha: 0.95, blur: 5)

// The bright point where the ring begins (12 o'clock).
func point(_ p: CGPoint, r: CGFloat) {
  if let g = CGGradient(colorsSpace: space,
                        colors: [rgb(CORE, 0.55), rgb(CORE, 0.16), rgb(CORE, 0.0)] as CFArray,
                        locations: [0, 0.35, 1]) {
    ctx.drawRadialGradient(g, startCenter: p, startRadius: 0, endCenter: p, endRadius: r * 7, options: [])
  }
  ctx.saveGState()
  ctx.setShadow(offset: .zero, blur: 10, color: rgb(CORE, 1))
  ctx.setFillColor(rgb(0xE9FFF0))
  ctx.fillEllipse(in: CGRect(x: p.x - r, y: p.y - r, width: 2 * r, height: 2 * r))
  ctx.restoreGState()
}
point(CGPoint(x: cx, y: cy + R), r: 4.5)

// The app icon inside the ring, clipped to its rounded rectangle.
let iconSize: CGFloat = 184
if let img = NSImage(contentsOfFile: iconPath),
   let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) {
  let rect = CGRect(x: cx - iconSize / 2, y: cy - iconSize / 2, width: iconSize, height: iconSize)
  let path = CGPath(roundedRect: rect, cornerWidth: iconSize * 0.224, cornerHeight: iconSize * 0.224, transform: nil)
  // Soft green bloom behind the icon.
  ctx.saveGState()
  ctx.setShadow(offset: .zero, blur: 40, color: rgb(GLOW, 0.22))
  ctx.addPath(path)
  ctx.setFillColor(rgb(0x050505))
  ctx.fillPath()
  ctx.restoreGState()
  ctx.saveGState()
  ctx.addPath(path)
  ctx.clip()
  ctx.draw(cg, in: rect)
  ctx.restoreGState()
  // Hairline edge, as on the device frames.
  ctx.saveGState()
  ctx.addPath(path)
  ctx.setStrokeColor(rgb(0xFFFFFF, 0.12))
  ctx.setLineWidth(1)
  ctx.strokePath()
  ctx.restoreGState()
} else {
  FileHandle.standardError.write("No icon at \(iconPath)\n".data(using: .utf8)!)
}

// ── Type ──────────────────────────────────────────────────────
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)

let left: CGFloat = 96
let textWidth: CGFloat = 560

let para = NSMutableParagraphStyle()
para.lineSpacing = 6
let headline = NSAttributedString(string: "Your rituals, without\na monthly sacrifice.", attributes: [
  .font: bodyFont,
  .foregroundColor: NSColor(cgColor: rgb(MUTED))!,
  .paragraphStyle: para,
])

// The loop logotype, drawn from the same geometry as src/components/brand/Wordmark.jsx:
// x-height 100 units, stroke 17, round caps, the two o's as one infinity sign.
let wmScale: CGFloat = 0.5
let wmSize = CGSize(width: 377.5 * wmScale, height: 209 * wmScale)
let hlSize = headline.boundingRect(with: CGSize(width: textWidth, height: 400), options: [.usesLineFragmentOrigin])
let gap: CGFloat = 26
let block = wmSize.height + gap + hlSize.height
let top = cy + block / 2  // y of the block's top edge (y-up)

do {
  // unit (x, y-down) -> canvas (y-up); the wordmark's box starts 55 units above the x-height top
  let s = wmScale
  let ox = left + 9 * s
  let topY = top  // canvas y of unit y = -55
  func P(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: ox + x * s, y: topY - (y + 55) * s) }
  ctx.saveGState()
  ctx.setStrokeColor(rgb(0xE8E6E1))
  ctx.setLineWidth(17 * s)
  ctx.setLineCap(.round)
  ctx.setLineJoin(.round)
  // l
  ctx.move(to: P(8.5, -46)); ctx.addLine(to: P(8.5, 91.5))
  // oo as one infinity sign (a Bernoulli lemniscate stretched so its lobes read as o's)
  let cx: CGFloat = 142.5, a: CGFloat = 100, k: CGFloat = 41.5 / (100 * 0.3536)
  for i in 0...480 {
    let t = CGFloat(i) / 480 * 2 * .pi
    let d = 1 + sin(t) * sin(t)
    let pt = P(cx + a * cos(t) / d, 50 + k * a * sin(t) * cos(t) / d)
    if i == 0 { ctx.move(to: pt) } else { ctx.addLine(to: pt) }
  }
  ctx.closePath()
  // p
  ctx.addEllipse(in: CGRect(x: P(318 - 41.5, 0).x, y: P(0, 50 + 41.5).y, width: 83 * s, height: 83 * s))
  ctx.move(to: P(276.5, 9)); ctx.addLine(to: P(276.5, 146))
  ctx.strokePath()
  ctx.restoreGState()
}
headline.draw(with: CGRect(x: left + 2, y: top - wmSize.height - gap - hlSize.height, width: textWidth, height: hlSize.height),
              options: [.usesLineFragmentOrigin])

NSGraphicsContext.restoreGraphicsState()

// ── Write ─────────────────────────────────────────────────────
guard let image = ctx.makeImage() else { fatalError("no image") }
let rep = NSBitmapImageRep(cgImage: image)
guard let png = rep.representation(using: .png, properties: [:]) else { fatalError("png") }
try png.write(to: URL(fileURLWithPath: outPath))
print("wrote \(outPath) (\(png.count / 1024) kB, \(W)x\(H))")
