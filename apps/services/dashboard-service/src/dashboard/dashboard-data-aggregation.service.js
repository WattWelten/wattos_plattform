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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardDataAggregationService = void 0;
var common_1 = require("@nestjs/common");
var db_1 = require("@wattweiser/db");
/**
 * Dashboard Data Aggregation Service
 *
 * Aggregiert Daten aus verschiedenen Quellen für Dashboard-Widgets
 */
var DashboardDataAggregationService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DashboardDataAggregationService = _classThis = /** @class */ (function () {
        function DashboardDataAggregationService_1(analytics, metrics) {
            this.analytics = analytics;
            this.metrics = metrics;
            this.logger = new common_1.Logger(DashboardDataAggregationService.name);
            this.prisma = new db_1.PrismaClient();
        }
        /**
         * Dashboard-Daten aggregieren
         */
        DashboardDataAggregationService_1.prototype.aggregateDashboardData = function (tenantId, dashboard) {
            return __awaiter(this, void 0, void 0, function () {
                var widgets, widgetData;
                var _this = this;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            widgets = ((_a = dashboard.layout) === null || _a === void 0 ? void 0 : _a.widgets) || [];
                            widgetData = {};
                            // Parallel alle Widget-Daten aggregieren
                            return [4 /*yield*/, Promise.all(widgets.map(function (widget) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a, _b, error_1, errorMessage;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0:
                                                _c.trys.push([0, 2, , 3]);
                                                _a = widgetData;
                                                _b = widget.id;
                                                return [4 /*yield*/, this.aggregateWidgetData(tenantId, widget)];
                                            case 1:
                                                _a[_b] = _c.sent();
                                                return [3 /*break*/, 3];
                                            case 2:
                                                error_1 = _c.sent();
                                                errorMessage = error_1 instanceof Error ? error_1.message : 'Unknown error';
                                                this.logger.warn("Failed to aggregate widget data: ".concat(errorMessage), {
                                                    widgetId: widget.id,
                                                });
                                                widgetData[widget.id] = { error: errorMessage };
                                                return [3 /*break*/, 3];
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                }); }))];
                        case 1:
                            // Parallel alle Widget-Daten aggregieren
                            _b.sent();
                            return [2 /*return*/, {
                                    id: dashboard.id,
                                    name: dashboard.name,
                                    layout: dashboard.layout,
                                    widgets: widgetData,
                                    updatedAt: new Date(),
                                }];
                    }
                });
            });
        };
        /**
         * Widget-Daten aggregieren
         */
        DashboardDataAggregationService_1.prototype.aggregateWidgetData = function (tenantId, widget) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = widget.type;
                            switch (_a) {
                                case 'overview': return [3 /*break*/, 1];
                                case 'conversations': return [3 /*break*/, 3];
                                case 'agents': return [3 /*break*/, 5];
                                case 'analytics': return [3 /*break*/, 7];
                                case 'metrics': return [3 /*break*/, 9];
                                case 'kb-sync': return [3 /*break*/, 11];
                            }
                            return [3 /*break*/, 13];
                        case 1: return [4 /*yield*/, this.getOverviewData(tenantId)];
                        case 2: return [2 /*return*/, _b.sent()];
                        case 3: return [4 /*yield*/, this.getConversationsData(tenantId, widget.config)];
                        case 4: return [2 /*return*/, _b.sent()];
                        case 5: return [4 /*yield*/, this.getAgentsData(tenantId, widget.config)];
                        case 6: return [2 /*return*/, _b.sent()];
                        case 7: return [4 /*yield*/, this.getAnalyticsData(tenantId, widget.config)];
                        case 8: return [2 /*return*/, _b.sent()];
                        case 9: return [4 /*yield*/, this.getMetricsData(tenantId, widget.config)];
                        case 10: return [2 /*return*/, _b.sent()];
                        case 11: return [4 /*yield*/, this.getKBSyncData(tenantId, widget.config)];
                        case 12: return [2 /*return*/, _b.sent()];
                        case 13: return [2 /*return*/, { error: "Unknown widget type: ".concat(widget.type) }];
                    }
                });
            });
        };
        /**
         * Overview-Daten
         */
        DashboardDataAggregationService_1.prototype.getOverviewData = function (tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, conversations, agents, kbArticles, syncStatus;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.conversation.count({ where: { tenantId: tenantId } }),
                                this.prisma.agent.count({ where: { tenantId: tenantId } }),
                                this.prisma.kBArticle.count({ where: { tenantId: tenantId } }),
                                this.getKBSyncStatus(tenantId),
                            ])];
                        case 1:
                            _a = _b.sent(), conversations = _a[0], agents = _a[1], kbArticles = _a[2], syncStatus = _a[3];
                            return [2 /*return*/, {
                                    conversations: conversations,
                                    agents: agents,
                                    kbArticles: kbArticles,
                                    kbSyncStatus: syncStatus,
                                }];
                    }
                });
            });
        };
        /**
         * Conversations-Daten
         */
        DashboardDataAggregationService_1.prototype.getConversationsData = function (tenantId, config) {
            return __awaiter(this, void 0, void 0, function () {
                var limit, timeRange, conversations;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            limit = (config === null || config === void 0 ? void 0 : config.limit) || 10;
                            timeRange = (config === null || config === void 0 ? void 0 : config.timeRange) || '7d';
                            return [4 /*yield*/, this.prisma.conversation.findMany({
                                    where: {
                                        tenantId: tenantId,
                                        createdAt: {
                                            gte: this.getTimeRangeStart(timeRange),
                                        },
                                    },
                                    orderBy: {
                                        createdAt: 'desc',
                                    },
                                    take: limit,
                                    select: {
                                        id: true,
                                        createdAt: true,
                                        messageCount: true,
                                    },
                                })];
                        case 1:
                            conversations = _a.sent();
                            return [2 /*return*/, {
                                    conversations: conversations,
                                    total: conversations.length,
                                }];
                    }
                });
            });
        };
        /**
         * Agents-Daten
         */
        DashboardDataAggregationService_1.prototype.getAgentsData = function (tenantId, config) {
            return __awaiter(this, void 0, void 0, function () {
                var agents;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.agent.findMany({
                                where: { tenantId: tenantId },
                                select: {
                                    id: true,
                                    name: true,
                                    status: true,
                                    createdAt: true,
                                },
                                orderBy: {
                                    createdAt: 'desc',
                                },
                            })];
                        case 1:
                            agents = _a.sent();
                            return [2 /*return*/, {
                                    agents: agents,
                                    total: agents.length,
                                    active: agents.filter(function (a) { return a.status === 'active'; }).length,
                                }];
                    }
                });
            });
        };
        /**
         * Analytics-Daten
         */
        DashboardDataAggregationService_1.prototype.getAnalyticsData = function (tenantId, config) {
            return __awaiter(this, void 0, void 0, function () {
                var timeRange;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            timeRange = (config === null || config === void 0 ? void 0 : config.timeRange) || '7d';
                            return [4 /*yield*/, this.analytics.getAnalytics(tenantId, __assign({ timeRange: timeRange }, config))];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * Metrics-Daten
         */
        DashboardDataAggregationService_1.prototype.getMetricsData = function (tenantId, config) {
            return __awaiter(this, void 0, void 0, function () {
                var metricTypes, timeRange;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            metricTypes = (config === null || config === void 0 ? void 0 : config.types) || ['all'];
                            timeRange = (config === null || config === void 0 ? void 0 : config.timeRange) || '1h';
                            return [4 /*yield*/, this.metrics.getMetrics(tenantId, {
                                    types: metricTypes,
                                    timeRange: timeRange,
                                })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * KB-Sync-Daten
         */
        DashboardDataAggregationService_1.prototype.getKBSyncData = function (tenantId, config) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getKBSyncStatus(tenantId)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        /**
         * KB-Sync-Status
         */
        DashboardDataAggregationService_1.prototype.getKBSyncStatus = function (tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, total, synced, pending, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.kBArticle.count({ where: { tenantId: tenantId } }),
                                this.prisma.kBArticle.count({
                                    where: { tenantId: tenantId, f13SyncStatus: 'synced' },
                                }),
                                this.prisma.kBArticle.count({
                                    where: { tenantId: tenantId, f13SyncStatus: 'pending' },
                                }),
                                this.prisma.kBArticle.count({
                                    where: { tenantId: tenantId, f13SyncStatus: 'error' },
                                }),
                            ])];
                        case 1:
                            _a = _b.sent(), total = _a[0], synced = _a[1], pending = _a[2], error = _a[3];
                            return [2 /*return*/, {
                                    total: total,
                                    synced: synced,
                                    pending: pending,
                                    error: error,
                                    syncRate: total > 0 ? (synced / total) * 100 : 0,
                                }];
                    }
                });
            });
        };
        /**
         * Time-Range Start berechnen
         */
        DashboardDataAggregationService_1.prototype.getTimeRangeStart = function (timeRange) {
            var now = new Date();
            var ranges = {
                '1h': 60 * 60 * 1000,
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000,
            };
            var ms = ranges[timeRange] || ranges['7d'];
            return new Date(now.getTime() - ms);
        };
        return DashboardDataAggregationService_1;
    }());
    __setFunctionName(_classThis, "DashboardDataAggregationService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DashboardDataAggregationService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DashboardDataAggregationService = _classThis;
}();
exports.DashboardDataAggregationService = DashboardDataAggregationService;
