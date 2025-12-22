"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetController = void 0;
var common_1 = require("@nestjs/common");
/**
 * Widget Controller
 *
 * REST API für Widget-Management, Analytics und A/B-Testing
 */
var WidgetController = function () {
    var _classDecorators = [(0, common_1.Controller)('widgets')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _createWidget_decorators;
    var _listWidgets_decorators;
    var _getWidget_decorators;
    var _updateWidget_decorators;
    var _deleteWidget_decorators;
    var _getEmbeddingCode_decorators;
    var _trackEvent_decorators;
    var _getAnalytics_decorators;
    var _getABTestVariants_decorators;
    var WidgetController = _classThis = /** @class */ (function () {
        function WidgetController_1(widgetService) {
            this.widgetService = (__runInitializers(this, _instanceExtraInitializers), widgetService);
        }
        /**
         * Widget erstellen
         */
        WidgetController_1.prototype.createWidget = function (tenantId, createDto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetService.createWidget(tenantId, createDto)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * Widgets auflisten
         */
        WidgetController_1.prototype.listWidgets = function (tenantId, characterId, isActive, type) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetService.listWidgets(tenantId, {
                                characterId: characterId,
                                isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
                                type: type,
                            })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * Widget abrufen
         */
        WidgetController_1.prototype.getWidget = function (widgetId, tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetService.getWidget(tenantId, widgetId)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * Widget aktualisieren
         */
        WidgetController_1.prototype.updateWidget = function (widgetId, tenantId, updateDto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetService.updateWidget(tenantId, widgetId, updateDto)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * Widget löschen
         */
        WidgetController_1.prototype.deleteWidget = function (widgetId, tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetService.deleteWidget(tenantId, widgetId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        /**
         * Embedding-Code generieren
         */
        WidgetController_1.prototype.getEmbeddingCode = function (widgetId, tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                var code;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetService.generateEmbeddingCode(tenantId, widgetId)];
                        case 1:
                            code = _a.sent();
                            return [2 /*return*/, { code: code }];
                    }
                });
            });
        };
        /**
         * Analytics-Event tracken
         */
        WidgetController_1.prototype.trackEvent = function (widgetId, body, sessionId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetService.trackEvent(widgetId, body.eventType, body.eventData, body.sessionId || sessionId, body.userId || userId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        /**
         * Analytics abrufen
         */
        WidgetController_1.prototype.getAnalytics = function (widgetId, tenantId, startDate, endDate, eventType) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetService.getAnalytics(tenantId, widgetId, {
                                startDate: startDate ? new Date(startDate) : undefined,
                                endDate: endDate ? new Date(endDate) : undefined,
                                eventType: eventType,
                            })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * A/B-Test-Varianten abrufen
         */
        WidgetController_1.prototype.getABTestVariants = function (widgetId, tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.widgetService.getABTestVariants(tenantId, widgetId)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        return WidgetController_1;
    }());
    __setFunctionName(_classThis, "WidgetController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createWidget_decorators = [(0, common_1.Post)()];
        _listWidgets_decorators = [(0, common_1.Get)()];
        _getWidget_decorators = [(0, common_1.Get)(':widgetId')];
        _updateWidget_decorators = [(0, common_1.Put)(':widgetId')];
        _deleteWidget_decorators = [(0, common_1.Delete)(':widgetId')];
        _getEmbeddingCode_decorators = [(0, common_1.Get)(':widgetId/embedding-code')];
        _trackEvent_decorators = [(0, common_1.Post)(':widgetId/analytics/events')];
        _getAnalytics_decorators = [(0, common_1.Get)(':widgetId/analytics')];
        _getABTestVariants_decorators = [(0, common_1.Get)(':widgetId/ab-test-variants')];
        __esDecorate(_classThis, null, _createWidget_decorators, { kind: "method", name: "createWidget", static: false, private: false, access: { has: function (obj) { return "createWidget" in obj; }, get: function (obj) { return obj.createWidget; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listWidgets_decorators, { kind: "method", name: "listWidgets", static: false, private: false, access: { has: function (obj) { return "listWidgets" in obj; }, get: function (obj) { return obj.listWidgets; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getWidget_decorators, { kind: "method", name: "getWidget", static: false, private: false, access: { has: function (obj) { return "getWidget" in obj; }, get: function (obj) { return obj.getWidget; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateWidget_decorators, { kind: "method", name: "updateWidget", static: false, private: false, access: { has: function (obj) { return "updateWidget" in obj; }, get: function (obj) { return obj.updateWidget; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteWidget_decorators, { kind: "method", name: "deleteWidget", static: false, private: false, access: { has: function (obj) { return "deleteWidget" in obj; }, get: function (obj) { return obj.deleteWidget; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getEmbeddingCode_decorators, { kind: "method", name: "getEmbeddingCode", static: false, private: false, access: { has: function (obj) { return "getEmbeddingCode" in obj; }, get: function (obj) { return obj.getEmbeddingCode; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _trackEvent_decorators, { kind: "method", name: "trackEvent", static: false, private: false, access: { has: function (obj) { return "trackEvent" in obj; }, get: function (obj) { return obj.trackEvent; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAnalytics_decorators, { kind: "method", name: "getAnalytics", static: false, private: false, access: { has: function (obj) { return "getAnalytics" in obj; }, get: function (obj) { return obj.getAnalytics; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getABTestVariants_decorators, { kind: "method", name: "getABTestVariants", static: false, private: false, access: { has: function (obj) { return "getABTestVariants" in obj; }, get: function (obj) { return obj.getABTestVariants; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WidgetController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WidgetController = _classThis;
}();
exports.WidgetController = WidgetController;
