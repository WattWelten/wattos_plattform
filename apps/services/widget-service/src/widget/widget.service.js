"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetService = void 0;
var common_1 = require("@nestjs/common");
var db_1 = require("@wattweiser/db");
/**
 * Widget Service
 *
 * Verwaltet Widget-Konfigurationen, Embedding-Codes, Analytics und A/B-Testing
 */
var WidgetService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var WidgetService = _classThis = /** @class */ (function () {
        function WidgetService_1(codeGenerator) {
            this.codeGenerator = codeGenerator;
            this.logger = new common_1.Logger(WidgetService.name);
            this.prisma = new db_1.PrismaClient();
        }
        /**
         * Widget erstellen
         */
        WidgetService_1.prototype.createWidget = function (tenantId, createDto) {
            return __awaiter(this, void 0, void 0, function () {
                var widget, embeddingCode;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("Creating widget for tenant: ".concat(tenantId), { name: createDto.name });
                            return [4 /*yield*/, this.prisma.widget.create({
                                    data: {
                                        tenantId: tenantId,
                                        characterId: createDto.characterId || null,
                                        name: createDto.name,
                                        type: createDto.type,
                                        mode: createDto.mode || 'iframe',
                                        config: __assign({ position: createDto.position || 'bottom-right', size: createDto.size || { width: 400, height: 600 }, theme: createDto.theme || 'light', avatar: createDto.avatar || null }, createDto.config),
                                        abTestVariant: createDto.abTestVariant || null,
                                        analyticsEnabled: createDto.analyticsEnabled !== false,
                                        isActive: true,
                                    },
                                    include: {
                                        character: true,
                                    },
                                })];
                        case 1:
                            widget = _a.sent();
                            embeddingCode = this.codeGenerator.generateCode(__assign({ tenantId: tenantId, widgetId: widget.id }, widget.config));
                            return [4 /*yield*/, this.prisma.widget.update({
                                    where: { id: widget.id },
                                    data: { embeddingCode: embeddingCode },
                                })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, this.mapToResponse(widget)];
                    }
                });
            });
        };
        /**
         * Widget abrufen
         */
        WidgetService_1.prototype.getWidget = function (tenantId, widgetId) {
            return __awaiter(this, void 0, void 0, function () {
                var widget;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.widget.findFirst({
                                where: {
                                    id: widgetId,
                                    tenantId: tenantId,
                                },
                                include: {
                                    character: true,
                                },
                            })];
                        case 1:
                            widget = _a.sent();
                            if (!widget) {
                                throw new common_1.NotFoundException("Widget not found: ".concat(widgetId));
                            }
                            return [2 /*return*/, this.mapToResponse(widget)];
                    }
                });
            });
        };
        /**
         * Widgets auflisten
         */
        WidgetService_1.prototype.listWidgets = function (tenantId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var widgets;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.widget.findMany({
                                where: __assign(__assign(__assign({ tenantId: tenantId }, ((options === null || options === void 0 ? void 0 : options.characterId) && { characterId: options.characterId })), ((options === null || options === void 0 ? void 0 : options.isActive) !== undefined && { isActive: options.isActive })), ((options === null || options === void 0 ? void 0 : options.type) && { type: options.type })),
                                include: {
                                    character: true,
                                },
                                orderBy: {
                                    createdAt: 'desc',
                                },
                            })];
                        case 1:
                            widgets = _a.sent();
                            return [2 /*return*/, widgets.map(function (w) { return _this.mapToResponse(w); })];
                    }
                });
            });
        };
        /**
         * Widget aktualisieren
         */
        WidgetService_1.prototype.updateWidget = function (tenantId, widgetId, updateDto) {
            return __awaiter(this, void 0, void 0, function () {
                var existingWidget, config, updatedConfig, widget, embeddingCode;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.widget.findFirst({
                                where: {
                                    id: widgetId,
                                    tenantId: tenantId,
                                },
                            })];
                        case 1:
                            existingWidget = _a.sent();
                            if (!existingWidget) {
                                throw new common_1.NotFoundException("Widget not found: ".concat(widgetId));
                            }
                            config = existingWidget.config;
                            updatedConfig = __assign(__assign(__assign(__assign(__assign(__assign({}, config), (updateDto.position && { position: updateDto.position })), (updateDto.size && { size: updateDto.size })), (updateDto.theme && { theme: updateDto.theme })), (updateDto.avatar && { avatar: updateDto.avatar })), (updateDto.config && updateDto.config));
                            return [4 /*yield*/, this.prisma.widget.update({
                                    where: { id: widgetId },
                                    data: __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, (updateDto.name && { name: updateDto.name })), (updateDto.type && { type: updateDto.type })), (updateDto.mode && { mode: updateDto.mode })), (updateDto.characterId !== undefined && { characterId: updateDto.characterId })), (updateDto.abTestVariant !== undefined && { abTestVariant: updateDto.abTestVariant })), (updateDto.analyticsEnabled !== undefined && { analyticsEnabled: updateDto.analyticsEnabled })), (updateDto.isActive !== undefined && { isActive: updateDto.isActive })), { config: updatedConfig }),
                                    include: {
                                        character: true,
                                    },
                                })];
                        case 2:
                            widget = _a.sent();
                            embeddingCode = this.codeGenerator.generateCode(__assign({ tenantId: tenantId, widgetId: widget.id }, widget.config));
                            return [4 /*yield*/, this.prisma.widget.update({
                                    where: { id: widget.id },
                                    data: { embeddingCode: embeddingCode },
                                })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, this.mapToResponse(__assign(__assign({}, widget), { embeddingCode: embeddingCode }))];
                    }
                });
            });
        };
        /**
         * Widget löschen
         */
        WidgetService_1.prototype.deleteWidget = function (tenantId, widgetId) {
            return __awaiter(this, void 0, void 0, function () {
                var widget;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.widget.findFirst({
                                where: {
                                    id: widgetId,
                                    tenantId: tenantId,
                                },
                            })];
                        case 1:
                            widget = _a.sent();
                            if (!widget) {
                                throw new common_1.NotFoundException("Widget not found: ".concat(widgetId));
                            }
                            return [4 /*yield*/, this.prisma.widget.delete({
                                    where: { id: widgetId },
                                })];
                        case 2:
                            _a.sent();
                            this.logger.log("Widget deleted: ".concat(widgetId));
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Embedding-Code generieren
         */
        WidgetService_1.prototype.generateEmbeddingCode = function (tenantId, widgetId) {
            return __awaiter(this, void 0, void 0, function () {
                var widget, code;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getWidget(tenantId, widgetId)];
                        case 1:
                            widget = _a.sent();
                            if (widget.embeddingCode) {
                                return [2 /*return*/, widget.embeddingCode];
                            }
                            code = this.codeGenerator.generateCode(__assign({ tenantId: tenantId, widgetId: widget.id }, widget.config));
                            // Code in DB speichern
                            return [4 /*yield*/, this.prisma.widget.update({
                                    where: { id: widgetId },
                                    data: { embeddingCode: code },
                                })];
                        case 2:
                            // Code in DB speichern
                            _a.sent();
                            return [2 /*return*/, code];
                    }
                });
            });
        };
        /**
         * Analytics-Event tracken
         */
        WidgetService_1.prototype.trackEvent = function (widgetId, eventType, eventData, sessionId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.widgetAnalytics.create({
                                data: {
                                    widgetId: widgetId,
                                    eventType: eventType,
                                    eventData: eventData || {},
                                    sessionId: sessionId || null,
                                    userId: userId || null,
                                },
                            })];
                        case 1:
                            _a.sent();
                            this.logger.debug("Analytics event tracked: ".concat(eventType), { widgetId: widgetId, sessionId: sessionId });
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Analytics abrufen
         */
        WidgetService_1.prototype.getAnalytics = function (tenantId, widgetId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var widget, analytics, aggregated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.widget.findFirst({
                                where: {
                                    id: widgetId,
                                    tenantId: tenantId,
                                },
                            })];
                        case 1:
                            widget = _a.sent();
                            if (!widget) {
                                throw new common_1.NotFoundException("Widget not found: ".concat(widgetId));
                            }
                            return [4 /*yield*/, this.prisma.widgetAnalytics.findMany({
                                    where: __assign(__assign(__assign({ widgetId: widgetId }, ((options === null || options === void 0 ? void 0 : options.startDate) && { timestamp: { gte: options.startDate } })), ((options === null || options === void 0 ? void 0 : options.endDate) && { timestamp: { lte: options.endDate } })), ((options === null || options === void 0 ? void 0 : options.eventType) && { eventType: options.eventType })),
                                    orderBy: {
                                        timestamp: 'desc',
                                    },
                                })];
                        case 2:
                            analytics = _a.sent();
                            aggregated = {
                                totalEvents: analytics.length,
                                eventsByType: analytics.reduce(function (acc, event) {
                                    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
                                    return acc;
                                }, {}),
                                uniqueSessions: new Set(analytics.map(function (a) { return a.sessionId; }).filter(Boolean)).size,
                                uniqueUsers: new Set(analytics.map(function (a) { return a.userId; }).filter(Boolean)).size,
                                events: analytics.map(function (a) { return ({
                                    eventType: a.eventType,
                                    eventData: a.eventData,
                                    sessionId: a.sessionId,
                                    userId: a.userId,
                                    timestamp: a.timestamp,
                                }); }),
                            };
                            return [2 /*return*/, aggregated];
                    }
                });
            });
        };
        /**
         * A/B-Test-Varianten abrufen
         */
        WidgetService_1.prototype.getABTestVariants = function (tenantId, baseWidgetId) {
            return __awaiter(this, void 0, void 0, function () {
                var baseWidget, variants;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.widget.findFirst({
                                where: {
                                    id: baseWidgetId,
                                    tenantId: tenantId,
                                },
                            })];
                        case 1:
                            baseWidget = _a.sent();
                            if (!baseWidget) {
                                throw new common_1.NotFoundException("Widget not found: ".concat(baseWidgetId));
                            }
                            return [4 /*yield*/, this.prisma.widget.findMany({
                                    where: {
                                        tenantId: tenantId,
                                        name: baseWidget.name,
                                        id: { not: baseWidgetId },
                                        abTestVariant: { not: null },
                                    },
                                    include: {
                                        character: true,
                                    },
                                })];
                        case 2:
                            variants = _a.sent();
                            return [2 /*return*/, __spreadArray([this.mapToResponse(baseWidget)], variants.map(function (v) { return _this.mapToResponse(v); }), true)];
                    }
                });
            });
        };
        /**
         * Widget zu Response mappen
         */
        WidgetService_1.prototype.mapToResponse = function (widget) {
            return {
                id: widget.id,
                tenantId: widget.tenantId,
                characterId: widget.characterId,
                name: widget.name,
                type: widget.type,
                mode: widget.mode,
                config: widget.config,
                abTestVariant: widget.abTestVariant,
                analyticsEnabled: widget.analyticsEnabled,
                isActive: widget.isActive,
                embeddingCode: widget.embeddingCode,
                character: widget.character ? {
                    id: widget.character.id,
                    name: widget.character.name,
                    role: widget.character.role,
                } : null,
                createdAt: widget.createdAt,
                updatedAt: widget.updatedAt,
            };
        };
        return WidgetService_1;
    }());
    __setFunctionName(_classThis, "WidgetService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WidgetService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WidgetService = _classThis;
}();
exports.WidgetService = WidgetService;
