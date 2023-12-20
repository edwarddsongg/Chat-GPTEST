"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const ReactWelcome = ({ tests }) => {
    const [numberOfFailures, setNumberOfFailures] = (0, react_1.useState)(0);
    const [bool, setBool] = (0, react_1.useState)(5999);
    (0, react_1.useEffect)(() => {
        const match = tests.match(/failures=(\d+)/);
        console.log("Tests");
        setBool(10000);
        if (match) {
            const failures = parseInt(match[1], 10);
            setNumberOfFailures(failures);
        }
    }, [tests]);
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("div", { className: "container" },
            react_1.default.createElement("h1", null, "Welcome to Your Extension!!"),
            react_1.default.createElement("p", null, "This is a welcome page for your extension. Customizes this content as needed.")),
        react_1.default.createElement("h2", null, "Test Progress"),
        react_1.default.createElement("div", { className: "progress-bar" },
            react_1.default.createElement("div", { className: `progress-bar-inner ${numberOfFailures > 0 ? 'failed' : 'passed'}`, style: { width: `${(100 - (numberOfFailures * 10))}%` } })),
        react_1.default.createElement("p", null,
            numberOfFailures,
            "% Passed | ",
            numberOfFailures,
            "% Failed ",
            bool)));
};
exports.default = ReactWelcome;
