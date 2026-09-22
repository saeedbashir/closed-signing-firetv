// The launcher icon, drawn from the app's own design tokens: a television with the
// interpreter placed bottom-right in amber and two caption lines beside her — the same
// diagram the walkthrough uses, so the icon cannot drift from the product.
import AppKit

func rgb(_ hex: UInt32) -> NSColor {
  NSColor(srgbRed: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
          blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
}
let size = 512
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8,
                           samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                           colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
rep.size = NSSize(width: size, height: size)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)

// Background: bgBase, rounded like a launcher tile expects.
rgb(0x0B0F14).setFill()
NSBezierPath(roundedRect: NSRect(x: 0, y: 0, width: 512, height: 512), xRadius: 92, yRadius: 92).fill()

// The screen: bgSurface with a borderSubtle frame.
let screen = NSRect(x: 60, y: 124, width: 392, height: 264)
rgb(0x151C24).setFill()
NSBezierPath(roundedRect: screen, xRadius: 22, yRadius: 22).fill()
let frame = NSBezierPath(roundedRect: screen, xRadius: 22, yRadius: 22)
frame.lineWidth = 7
rgb(0x61748A).setStroke()
frame.stroke()

// Where the interpreter could be: a dashed ghost top-left.
let ghost = NSBezierPath(roundedRect: NSRect(x: 92, y: 274, width: 96, height: 82), xRadius: 8, yRadius: 8)
ghost.lineWidth = 5
ghost.setLineDash([12, 9], count: 2, phase: 0)
rgb(0xA3B1BF).setStroke()
ghost.stroke()

// Where she is: the amber signer layer, bottom-right.
rgb(0xFFB020).setFill()
NSBezierPath(roundedRect: NSRect(x: 292, y: 150, width: 132, height: 112), xRadius: 10, yRadius: 10).fill()

// Two lines of caption, clear of the signer.
NSColor.white.setFill()
NSBezierPath(roundedRect: NSRect(x: 92, y: 182, width: 176, height: 18), xRadius: 9, yRadius: 9).fill()
NSBezierPath(roundedRect: NSRect(x: 92, y: 152, width: 122, height: 18), xRadius: 9, yRadius: 9).fill()

NSGraphicsContext.restoreGraphicsState()
let png = rep.representation(using: .png, properties: [:])!
try! png.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
print("wrote", CommandLine.arguments[1])
