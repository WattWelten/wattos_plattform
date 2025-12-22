"use strict";
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
exports.KBSyncService = void 0;
var common_1 = require("@nestjs/common");
var db_1 = require("@wattweiser/db");
/**
 * KB-Sync Service
 *
 * Synchronisiert KB-Artikel zu F13-OS mit Incremental Sync und Approval-Workflow
 */
var KBSyncService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var KBSyncService = _classThis = /** @class */ (function () {
        function KBSyncService_1(f13Client) {
            this.f13Client = f13Client;
            this.logger = new common_1.Logger(KBSyncService.name);
            this.prisma = new db_1.PrismaClient();
        }
        /**
         * KB-Artikel zu F13-OS synchronisieren
         */
        KBSyncService_1.prototype.syncKBArticleToF13 = function (tenantId, kbArticleId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var article, f13Response, f13ArticleId, error_1, errorMessage, errorStack;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 5, , 7]);
                            return [4 /*yield*/, this.prisma.kBArticle.findUnique({
                                    where: { id: kbArticleId },
                                })];
                        case 1:
                            article = _b.sent();
                            if (!article || article.tenantId !== tenantId) {
                                throw new Error("KB Article not found: ".concat(kbArticleId));
                            }
                            // Prüfen ob bereits synchronisiert
                            if (article.f13SyncStatus === 'synced' && article.syncedAt) {
                                this.logger.debug("KB Article already synced: ".concat(kbArticleId));
                                return [2 /*return*/, {
                                        success: true,
                                        f13ArticleId: article.kbId,
                                        status: 'synced',
                                    }];
                            }
                            // Status auf "syncing" setzen
                            return [4 /*yield*/, this.prisma.kBArticle.update({
                                    where: { id: kbArticleId },
                                    data: {
                                        f13SyncStatus: 'syncing',
                                        lastSyncedAt: new Date(),
                                    },
                                })];
                        case 2:
                            // Status auf "syncing" setzen
                            _b.sent();
                            return [4 /*yield*/, this.f13Client.post('/api/v1/kb/articles', {
                                    title: article.title,
                                    content: article.contentMd,
                                    metadata: {
                                        tenantId: tenantId,
                                        kbArticleId: article.id,
                                        status: article.status,
                                    },
                                })];
                        case 3:
                            f13Response = _b.sent();
                            f13ArticleId = f13Response.id || ((_a = f13Response.data) === null || _a === void 0 ? void 0 : _a.id);
                            // Status auf "synced" setzen
                            return [4 /*yield*/, this.prisma.kBArticle.update({
                                    where: { id: kbArticleId },
                                    data: {
                                        f13SyncStatus: 'synced',
                                        syncedAt: new Date(),
                                        kbId: f13ArticleId, // F13-OS ID speichern
                                    },
                                })];
                        case 4:
                            // Status auf "synced" setzen
                            _b.sent();
                            this.logger.log("KB Article synced to F13-OS: ".concat(kbArticleId, " -> ").concat(f13ArticleId));
                            return [2 /*return*/, {
                                    success: true,
                                    f13ArticleId: f13ArticleId,
                                    status: 'synced',
                                }];
                        case 5:
                            error_1 = _b.sent();
                            errorMessage = error_1 instanceof Error ? error_1.message : 'Unknown error';
                            errorStack = error_1 instanceof Error ? error_1.stack : undefined;
                            this.logger.error("KB sync failed: ".concat(errorMessage), errorStack, { kbArticleId: kbArticleId });
                            // Status auf "error" setzen
                            return [4 /*yield*/, this.prisma.kBArticle.update({
                                    where: { id: kbArticleId },
                                    data: {
                                        f13SyncStatus: 'error',
                                    },
                                }).catch(function () { })];
                        case 6:
                            // Status auf "error" setzen
                            _b.sent();
                            return [2 /*return*/, {
                                    success: false,
                                    status: 'error',
                                }];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Incremental Sync: Nur geänderte Artikel synchronisieren
         */
        KBSyncService_1.prototype.syncIncremental = function (tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                var config, articlesToSync, synced, failed, skipped, _i, articlesToSync_1, article, result, error_2, errorMessage, errorStack;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 7, , 8]);
                            return [4 /*yield*/, this.prisma.f13Config.findUnique({
                                    where: { tenantId: tenantId },
                                })];
                        case 1:
                            config = _a.sent();
                            if (!config || !config.kbSyncEnabled) {
                                this.logger.debug("KB sync disabled for tenant: ".concat(tenantId));
                                return [2 /*return*/, { synced: 0, failed: 0, skipped: 0 }];
                            }
                            return [4 /*yield*/, this.prisma.kBArticle.findMany({
                                    where: {
                                        tenantId: tenantId,
                                        status: 'published',
                                        OR: [
                                            { f13SyncStatus: null },
                                            { f13SyncStatus: 'pending' },
                                            { f13SyncStatus: 'error' },
                                            {
                                                AND: [
                                                    { f13SyncStatus: 'synced' },
                                                    { updatedAt: { gt: this.prisma.kBArticle.fields.syncedAt } },
                                                ],
                                            },
                                        ],
                                    },
                                    take: 100, // Batch-Größe
                                })];
                        case 2:
                            articlesToSync = _a.sent();
                            synced = 0;
                            failed = 0;
                            skipped = 0;
                            _i = 0, articlesToSync_1 = articlesToSync;
                            _a.label = 3;
                        case 3:
                            if (!(_i < articlesToSync_1.length)) return [3 /*break*/, 6];
                            article = articlesToSync_1[_i];
                            // Approval-Workflow (wenn nicht auto-approve)
                            if (!config.autoApprove && article.status !== 'approved') {
                                skipped++;
                                return [3 /*break*/, 5];
                            }
                            return [4 /*yield*/, this.syncKBArticleToF13(tenantId, article.id, {
                                    autoApprove: config.autoApprove,
                                })];
                        case 4:
                            result = _a.sent();
                            if (result.success) {
                                synced++;
                            }
                            else {
                                failed++;
                            }
                            _a.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 3];
                        case 6:
                            this.logger.log("Incremental KB sync completed", {
                                tenantId: tenantId,
                                synced: synced,
                                failed: failed,
                                skipped: skipped,
                            });
                            return [2 /*return*/, { synced: synced, failed: failed, skipped: skipped }];
                        case 7:
                            error_2 = _a.sent();
                            errorMessage = error_2 instanceof Error ? error_2.message : 'Unknown error';
                            errorStack = error_2 instanceof Error ? error_2.stack : undefined;
                            this.logger.error("Incremental KB sync failed: ".concat(errorMessage), errorStack);
                            throw error_2;
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Health Check
         */
        KBSyncService_1.prototype.healthCheck = function (tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                var config, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, this.prisma.f13Config.findUnique({
                                    where: { tenantId: tenantId },
                                })];
                        case 1:
                            config = _b.sent();
                            if (!config) {
                                return [2 /*return*/, false];
                            }
                            return [4 /*yield*/, this.f13Client.healthCheck()];
                        case 2: 
                        // F13-OS Health Check
                        return [2 /*return*/, _b.sent()];
                        case 3:
                            _a = _b.sent();
                            return [2 /*return*/, false];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return KBSyncService_1;
    }());
    __setFunctionName(_classThis, "KBSyncService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        KBSyncService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return KBSyncService = _classThis;
}();
exports.KBSyncService = KBSyncService;
