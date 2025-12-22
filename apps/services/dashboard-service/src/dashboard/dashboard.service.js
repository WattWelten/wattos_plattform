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
exports.DashboardService = void 0;
var common_1 = require("@nestjs/common");
var db_1 = require("@wattweiser/db");
/**
 * Dashboard Service
 *
 * Verwaltet Dashboard-Konfigurationen und -Daten
 */
var DashboardService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DashboardService = _classThis = /** @class */ (function () {
        function DashboardService_1(dataAggregation, cache) {
            this.dataAggregation = dataAggregation;
            this.cache = cache;
            this.logger = new common_1.Logger(DashboardService.name);
            this.cacheTTL = 300; // 5 Minuten
            this.prisma = new db_1.PrismaClient();
        }
        /**
         * Dashboard für Tenant abrufen
         */
        DashboardService_1.prototype.getDashboard = function (tenantId, dashboardId) {
            return __awaiter(this, void 0, void 0, function () {
                var cacheKey, cached, dashboard, layout, dashboardData;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cacheKey = "dashboard:".concat(tenantId, ":").concat(dashboardId || 'default');
                            return [4 /*yield*/, this.cache.get(cacheKey)];
                        case 1:
                            cached = _a.sent();
                            if (cached) {
                                this.logger.debug("Dashboard loaded from cache: ".concat(cacheKey));
                                return [2 /*return*/, cached];
                            }
                            if (!dashboardId) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.dashboard.findUnique({
                                    where: {
                                        id: dashboardId,
                                        tenantId: tenantId,
                                    },
                                })];
                        case 2:
                            dashboard = _a.sent();
                            return [3 /*break*/, 6];
                        case 3: return [4 /*yield*/, this.prisma.dashboard.findFirst({
                                where: {
                                    tenantId: tenantId,
                                    isDefault: true,
                                },
                            })];
                        case 4:
                            // Default Dashboard laden oder erstellen
                            dashboard = _a.sent();
                            if (!!dashboard) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.createDefaultDashboard(tenantId)];
                        case 5:
                            dashboard = _a.sent();
                            _a.label = 6;
                        case 6:
                            if (!dashboard) {
                                throw new Error("Dashboard not found: ".concat(dashboardId));
                            }
                            layout = dashboard.layout || dashboard.config;
                            return [4 /*yield*/, this.dataAggregation.aggregateDashboardData(tenantId, __assign(__assign({}, dashboard), { layout: layout }))];
                        case 7:
                            dashboardData = _a.sent();
                            // Cache speichern
                            return [4 /*yield*/, this.cache.set(cacheKey, dashboardData, this.cacheTTL)];
                        case 8:
                            // Cache speichern
                            _a.sent();
                            return [2 /*return*/, dashboardData];
                    }
                });
            });
        };
        /**
         * Dashboard erstellen
         */
        DashboardService_1.prototype.createDashboard = function (tenantId_1, name_1, layout_1) {
            return __awaiter(this, arguments, void 0, function (tenantId, name, layout, isDefault) {
                var dashboard;
                if (isDefault === void 0) { isDefault = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!isDefault) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.dashboard.updateMany({
                                    where: { tenantId: tenantId, isDefault: true },
                                    data: { isDefault: false },
                                })];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [4 /*yield*/, this.prisma.dashboard.create({
                                data: {
                                    tenantId: tenantId,
                                    name: name,
                                    layout: layout, // MVP: layout field wird verwendet
                                    config: {}, // Legacy: leeres config für Kompatibilität
                                    isDefault: isDefault,
                                },
                            })];
                        case 3:
                            dashboard = _a.sent();
                            // Cache invalidieren
                            return [4 /*yield*/, this.cache.delete("dashboard:".concat(tenantId, ":*"))];
                        case 4:
                            // Cache invalidieren
                            _a.sent();
                            return [2 /*return*/, dashboard];
                    }
                });
            });
        };
        /**
         * Dashboard aktualisieren
         */
        DashboardService_1.prototype.updateDashboard = function (tenantId, dashboardId, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var dashboard;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!updates.isDefault) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.dashboard.updateMany({
                                    where: { tenantId: tenantId, isDefault: true },
                                    data: { isDefault: false },
                                })];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [4 /*yield*/, this.prisma.dashboard.update({
                                where: {
                                    id: dashboardId,
                                    tenantId: tenantId,
                                },
                                data: __assign(__assign({}, updates), { layout: updates.layout, config: updates.layout || {} }),
                            })];
                        case 3:
                            dashboard = _a.sent();
                            // Cache invalidieren
                            return [4 /*yield*/, this.cache.delete("dashboard:".concat(tenantId, ":").concat(dashboardId))];
                        case 4:
                            // Cache invalidieren
                            _a.sent();
                            return [2 /*return*/, dashboard];
                    }
                });
            });
        };
        /**
         * Dashboard löschen
         */
        DashboardService_1.prototype.deleteDashboard = function (tenantId, dashboardId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.dashboard.delete({
                                where: {
                                    id: dashboardId,
                                    tenantId: tenantId,
                                },
                            })];
                        case 1:
                            _a.sent();
                            // Cache invalidieren
                            return [4 /*yield*/, this.cache.delete("dashboard:".concat(tenantId, ":").concat(dashboardId))];
                        case 2:
                            // Cache invalidieren
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Alle Dashboards für Tenant auflisten
         */
        DashboardService_1.prototype.listDashboards = function (tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                var dashboards;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.dashboard.findMany({
                                where: { tenantId: tenantId },
                                orderBy: {
                                    createdAt: 'desc',
                                },
                            })];
                        case 1:
                            dashboards = _a.sent();
                            return [2 /*return*/, dashboards];
                    }
                });
            });
        };
        /**
         * Default Dashboard erstellen
         */
        DashboardService_1.prototype.createDefaultDashboard = function (tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                var defaultLayout;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            defaultLayout = {
                                widgets: [
                                    {
                                        id: 'overview',
                                        type: 'overview',
                                        position: { x: 0, y: 0, w: 12, h: 4 },
                                    },
                                    {
                                        id: 'conversations',
                                        type: 'conversations',
                                        position: { x: 0, y: 4, w: 6, h: 4 },
                                    },
                                    {
                                        id: 'agents',
                                        type: 'agents',
                                        position: { x: 6, y: 4, w: 6, h: 4 },
                                    },
                                ],
                            };
                            return [4 /*yield*/, this.prisma.dashboard.create({
                                    data: {
                                        tenantId: tenantId,
                                        name: 'Default Dashboard',
                                        layout: defaultLayout,
                                        isDefault: true,
                                    },
                                })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        return DashboardService_1;
    }());
    __setFunctionName(_classThis, "DashboardService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DashboardService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DashboardService = _classThis;
}();
exports.DashboardService = DashboardService;
