import XCTest

final class PuzzleUITests: XCTestCase {
    let app = XCUIApplication()
    var web: XCUIElement { app.webViews.firstMatch }
    private var context = "Launching"
    private enum HarnessError: Error { case unavailableControl(String) }

    // Query from the app: WKWebView/WKContentView ancestor types can disagree in AX.
    private func controls(_ text: String) -> XCUIElementQuery {
        // WebKit exposes navigation as AX Switches and can change a hint from
        // Button to Switch after activation. Match both interactive roles on
        // every fresh snapshot; showControl still requires hittable and enabled.
        let roles = [XCUIElement.ElementType.button.rawValue,
                     XCUIElement.ElementType.switch.rawValue,
                     XCUIElement.ElementType.checkBox.rawValue]
        return app.descendants(matching: .any).matching(NSPredicate(
            format: "elementType IN %@ AND label CONTAINS %@", roles as NSArray, text))
    }
    private var solved: XCUIElement { app.staticTexts["Beautifully solved."] }

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
        XCTAssertTrue(web.waitForExistence(timeout: 15), "Native WebView must exist")
        XCTAssertTrue(controls("Twist cube").firstMatch.waitForExistence(timeout: 15),
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

    private func showControl(_ text: String, towardTop: Bool = false) throws -> XCUIElement {
        context = "Find control: \(text)"
        // Each pass creates a fresh app-root query, including after every drag.
        for direction in [towardTop, !towardTop] {
            for step in 0...6 {
                let candidate = controls(text).firstMatch
                if candidate.exists && candidate.isHittable {
                    let enabled = XCTNSPredicateExpectation(
                        predicate: NSPredicate(format: "enabled == true"), object: candidate)
                    if XCTWaiter.wait(for: [enabled], timeout: 5) == .completed {
                        return controls(text).firstMatch
                    }
                    break
                }
                if step < 6 { scrollPage(towardTop: direction) }
            }
        }
        let matches = controls(text).allElementsBoundByIndex
        context += " (matches: \(matches.count))"
        for element in matches {
            print("PRISM candidate: \(element.label), frame=\(element.frame), hittable=\(element.isHittable), enabled=\(element.isEnabled)")
        }
        captureDiagnostics()
        XCTFail("Could not find a hittable, enabled control: \(text)")
        throw HarnessError.unavailableControl(text)
    }

    private func solveWithHints() throws {
        _ = try showControl("Free hint")
        context = "Solve using native hint taps"
        for _ in 0..<100 {
            if solved.exists { break }
            try showControl("Free hint").tap()
        }
        XCTAssertTrue(solved.waitForExistence(timeout: 5), "Hints must solve this puzzle")
        for _ in 0..<5 { try showControl("Free hint").tap() }
        XCTAssertTrue(solved.exists, "Extra hints must remain available and preserve the solution")
    }

    func testNativeFaceSwipeHintsAndPersistence() throws {
        try showControl("New puzzle").tap()
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
            try showControl(name, towardTop: true).tap()
            context = "Verify selected puzzle: \(name)"
            XCTAssertTrue(app.staticTexts[mode].waitForExistence(timeout: 5),
                          "Selecting \(name) must change the active puzzle")
            try showControl("New puzzle").tap()
            try solveWithHints()
            print("PRISM solved puzzle and verified extra hints: \(name)")
        }
    }

    func testLocalSuggestionReviewAndSelection() throws {
        context = "Open local suggestion composer"
        try showControl("Suggest an improvement").tap()
        let title = app.textFields["Suggestion title"]
        for _ in 0..<8 {
            if title.exists && title.isHittable { break }
            scrollPage(towardTop: false)
        }
        XCTAssertTrue(title.exists && title.isHittable)
        title.tap()
        title.typeText("Offline guide")
        let details = app.textViews["Suggestion details"]
        for _ in 0..<8 {
            if details.exists && details.isHittable { break }
            scrollPage(towardTop: false)
        }
        XCTAssertTrue(details.exists && details.isHittable)
        details.tap()
        details.typeText("Explain controls with fictional examples.")
        try showControl("Prepare local draft").tap()
        let reviewLabel = "I reviewed this draft and removed private data and credentials."
        try showControl(reviewLabel).tap()
        try showControl("Select draft for copying").tap()
        context = "Verify selection remains in the app"
        XCTAssertTrue(app.staticTexts.matching(NSPredicate(
            format: "label CONTAINS %@", "Nothing has been uploaded")).firstMatch.waitForExistence(timeout: 5))
        XCTAssertEqual(app.state, .runningForeground)
        let prepared = app.textViews["Prepared suggestion"]
        XCTAssertTrue(prepared.exists)
        XCTAssertTrue((prepared.value as? String ?? "").contains("Offline guide"))
        XCTAssertTrue((prepared.value as? String ?? "").contains("R347H4CK3R/Prism-Puzzle"))
    }

    func testCubeVisualDiagnostic() throws {
        try showControl("New puzzle").tap()
        context = "Capture visible native cube for visual inspection"
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Prism native onscreen cube"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }

}
