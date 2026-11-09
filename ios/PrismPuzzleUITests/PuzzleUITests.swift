import XCTest
final class PuzzleUITests: XCTestCase {
 let app = XCUIApplication()
 var web: XCUIElement { app.webViews.firstMatch }
 func button(_ text: String) -> XCUIElement { web.buttons.matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch }
 func show(_ element: XCUIElement) { for _ in 0..<6 { if element.isHittable { return }; web.swipeUp() }; for _ in 0..<6 { if element.isHittable { return }; web.swipeDown() } }
 override func setUpWithError() throws { continueAfterFailure = false; app.launch(); XCTAssertTrue(web.waitForExistence(timeout: 15)) }
 func solveWithHints() { let hint = button("Free hint"); show(hint); for _ in 0..<100 { if web.staticTexts["Beautifully solved."].exists { break }; hint.tap() }; XCTAssertTrue(web.staticTexts["Beautifully solved."].exists); for _ in 0..<5 { hint.tap() }; XCTAssertTrue(web.staticTexts["Beautifully solved."].exists) }
 func testNativeFaceSwipeHintsAndPersistence() throws {
  let fresh = button("New puzzle"); show(fresh); fresh.tap()
  let stickers = web.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "F face, F sticker"))
  guard let sticker = stickers.allElementsBoundByIndex.first(where: { $0.isHittable && $0.frame.midX > 70 && $0.frame.midX < web.frame.width - 70 }) else { XCTFail("No visible cube sticker for a real simulator drag"); return }
  let start = sticker.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
  start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: 50, dy: 0)))
  XCTAssertTrue(web.staticTexts["1"].waitForExistence(timeout: 5), "A face swipe must register exactly one turn")
  solveWithHints()
  app.terminate(); app.launch(); XCTAssertTrue(web.waitForExistence(timeout: 10)); XCTAssertTrue(web.staticTexts["Beautifully solved."].waitForExistence(timeout: 10), "Completed cube persists across native relaunch")
 }
 func testNativeOtherPuzzlesAndUnlimitedHints() {
  for name in ["Pocket cube", "Block assembly", "Fifteen tiles", "Tower", "Lights out", "Slide nine"] {
   let tab=button(name); show(tab); tab.tap(); let fresh=button("New puzzle"); show(fresh); fresh.tap(); solveWithHints()
  }
 }
}
