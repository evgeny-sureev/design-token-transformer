// swift-tools-version: 5.8
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "design-tokens-ios",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "design-tokens-ios",
            targets: ["design-tokens-ios"]
        ),
    ],
    targets: [
        .target(
            name: "design-tokens-ios",
            path: "build",
            resources: [
                .copy("DesignToken.xcassets")
            ]
        )
    ]
)
