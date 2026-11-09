import XCTest

final class PuzzleUITests: XCTestCase {
    let app = XCUIApplication()
    var web: XCUIElement { app.webViews.firstMatch }
    private var context = "Launching"
    private enum HarnessError: Error { case unavailableControl(String) }

    // Query from the app: WKWebView/WKContentView ancestor types can disagree in AX.
    private func buttons(_ text: String) -> XCUIElementQuery {
        app.buttons.matching(NSPredicate(format: "label CONTAINS %@", text))
    }
    private var solved: XCUIElement { app.staticTexts["Beautifully solved."] }

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
        XCTAssertTrue(web.waitForExistence(timeout: 15), "Native WebView must exist")
        XCTAssertTrue(buttons("Twist cube").firstMatch.waitForExistence(timeout: 15),
                      "Puzzle content must be accessible, not just the WebView container")
    }

    override func tearDownWithError() throws {
        if let run = testRun, run.failureCount > 0 { captureDiagnostics() }
        try super.tearDownWithError()
    }

    private func captureDiagnostics() {
        let hierarchy = app.debugDescription
        print("PRISM NATIVE FAILURE: \(context)\nWebViews: \(app.webViews.count)\n\(hierarchy)")
        let tree = XCTAttachment(string: "\(context)\n\(hierarchy)")
        tree.name = "Prism accessibility hierarchy"
        tree.lifetime = .keepAlways
        add(tree)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Prism native failure"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }

    private func scrollPage(towardTop: Bool) {
        // The 22-point page padding is outside interactive stages. Center swipes
        // can be consumed by cube/tower/brick pointer handlers instead of scrolling.
        let origin = app.coordinate(withNormalizedOffset: CGVector(dx: 0, dy: 0))
        let frame = app.frame
        let startY = frame.height * (towardTop ? 0.30 : 0.75)
        let endY = frame.height * (towardTop ? 0.75 : 0.30)
        let start = origin.withOffset(CGVector(dx: 8, dy: startY))
        let end = origin.withOffset(CGVector(dx: 8, dy: endY))
        start.press(forDuration: 0.05, thenDragTo: end)
    }

    private func showButton(_ text: String, towardTop: Bool = false) throws -> XCUIElement {
        context = "Find button: \(text)"
        // Each pass creates a fresh app-root query, including after every drag.
        for direction in [towardTop, !towardTop] {
            for step in 0...6 {
                let candidate = buttons(text).firstMatch
                if candidate.exists && candidate.isHittable {
                    let enabled = XCTNSPredicateExpectation(
                        predicate: NSPredicate(format: "enabled == true"), object: candidate)
                    if XCTWaiter.wait(for: [enabled], timeout: 5) == .completed {
                        return buttons(text).firstMatch
                    }
                    break
                }
                if step < 6 { scrollPage(towardTop: direction) }
            }
        }
        let matches = buttons(text).allElementsBoundByIndex
        context += " (matches: \(matches.count))"
        for element in matches {
            print("PRISM candidate: \(element.label), frame=\(element.frame), hittable=\(element.isHittable), enabled=\(element.isEnabled)")
        }
        captureDiagnostics()
        XCTFail("Could not find a hittable, enabled button: \(text)")
        throw HarnessError.unavailableControl(text)
    }

    private func solveWithHints() throws {
        _ = try showButton("Free hint")
        context = "Solve using native hint taps"
        for _ in 0..<100 {
            if solved.exists { break }
            try showButton("Free hint").tap()
        }
        XCTAssertTrue(solved.waitForExistence(timeout: 5), "Hints must solve this puzzle")
        for _ in 0..<5 { try showButton("Free hint").tap() }
        XCTAssertTrue(solved.exists, "Extra hints must remain available and preserve the solution")
    }

    func testNativeFaceSwipeHintsAndPersistence() throws {
        try showButton("New puzzle").tap()
        context = "Drag a real cube sticker"
        let stickers = app.descendants(matching: .any).matching(
            NSPredicate(format: "label == %@", "F face, F sticker"))
        guard let sticker = stickers.allElementsBoundByIndex.first(where: {
            $0.isHittable && $0.frame.midX > app.frame.minX + 70 && $0.frame.midX < app.frame.maxX - 70
        }) else {
            XCTFail("No visible cube sticker for a real simulator drag")
            return
        }
        let start = sticker.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: 50, dy: 0)))
        XCTAssertTrue(app.staticTexts["1"].waitForExistence(timeout: 5),
                      "A face swipe must register exactly one turn")
        try solveWithHints()
        context = "Verify completed cube after native relaunch"
        app.terminate()
        app.launch()
        XCTAssertTrue(web.waitForExistence(timeout: 10))
        XCTAssertTrue(solved.waitForExistence(timeout: 10), "Completed cube persists across native relaunch")
    }

    func testNativeOtherPuzzlesAndUnlimitedHints() throws {
        let puzzles = [
            ("Pocket cube", "SMALL CUBE. BIG POSSIBILITIES."),
            ("Block assembly", "BUILD THE ANSWER"),
            ("Fifteen tiles", "A CLASSIC WITH A TACTILE TWIST"),
            ("Tower", "ONE DISK AT A TIME"),
            ("Lights out", "A SPARK OF LOGIC"),
            ("Slide nine", "MAKE ROOM FOR THE ANSWER")
        ]
        for (name, mode) in puzzles {
            print("PRISM begin puzzle: \(name)")
            try showButton(name, towardTop: true).tap()
            context = "Verify selected puzzle: \(name)"
            XCTAssertTrue(app.staticTexts[mode].waitForExistence(timeout: 5),
                          "Selecting \(name) must change the active puzzle")
            try showButton("New puzzle").tap()
            try solveWithHints()
            print("PRISM solved puzzle and verified extra hints: \(name)")
        }
    }
}
